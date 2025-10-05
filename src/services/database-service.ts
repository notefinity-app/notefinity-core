import nano from 'nano';
import { DatabaseService as IDatabaseService, Note, User } from '../types';

export class DatabaseService implements IDatabaseService {
  private db: nano.ServerScope;
  private notesDb!: nano.DocumentScope<Note>;
  private usersDb!: nano.DocumentScope<User>;

  constructor() {
    const couchDbUrl = process.env.COUCHDB_URL || 'http://admin:password@localhost:5984';
    this.db = nano(couchDbUrl);
  }

  async initialize(): Promise<void> {
    try {
      // Create databases if they don't exist
      await this.createDatabaseIfNotExists('notefinity_notes');
      await this.createDatabaseIfNotExists('notefinity_users');

      // Get database references
      this.notesDb = this.db.db.use<Note>('notefinity_notes');
      this.usersDb = this.db.db.use<User>('notefinity_users');

      // Create indexes for better performance
      await this.createIndexes();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createDatabaseIfNotExists(dbName: string): Promise<void> {
    try {
      await this.db.db.create(dbName);
      console.log(`Created database: ${dbName}`);
    } catch (error: any) {
      if (error.statusCode === 412) {
        // Database already exists
        console.log(`Database already exists: ${dbName}`);
      } else {
        throw error;
      }
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Index for notes by userId
      await this.notesDb.createIndex({
        index: {
          fields: ['userId'],
        },
        name: 'by-user-id',
      });

      // Index for spaces (root nodes)
      await this.notesDb.createIndex({
        index: {
          fields: ['userId', 'type', 'parentId'],
        },
        name: 'by-user-type-parent',
      });

      // Index for child nodes
      await this.notesDb.createIndex({
        index: {
          fields: ['userId', 'parentId', 'position'],
        },
        name: 'by-user-parent-position',
      });

      // Index for users by email
      await this.usersDb.createIndex({
        index: {
          fields: ['email'],
        },
        name: 'by-email',
      });
    } catch (error) {
      console.warn('Failed to create some indexes:', error);
    }
  }

  async createNote(
    noteData: Omit<Note, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<Note> {
    const now = new Date();
    const note: Note = {
      _id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...noteData,
      createdAt: now,
      updatedAt: now,
    };

    const response = await this.notesDb.insert(note);
    return {
      ...note,
      _id: response.id,
      _rev: response.rev,
    };
  }

  async getNoteById(id: string, userId: string): Promise<Note | null> {
    try {
      const note = await this.notesDb.get(id);

      // Ensure user can only access their own notes
      if (note.userId !== userId) {
        return null;
      }

      return note;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getNotesByUser(userId: string): Promise<Note[]> {
    try {
      const response = await this.notesDb.find({
        selector: {
          userId: userId,
        },
        sort: [{ updatedAt: 'desc' }],
      });

      return response.docs;
    } catch (error) {
      console.error('Failed to get notes by user:', error);
      return [];
    }
  }

  async updateNote(id: string, userId: string, updates: Partial<Note>): Promise<Note> {
    try {
      const existingNote = await this.getNoteById(id, userId);
      if (!existingNote) {
        throw new Error('Note not found or access denied');
      }

      const updatedNote: Note = {
        ...existingNote,
        ...updates,
        _id: existingNote._id,
        _rev: existingNote._rev,
        userId: existingNote.userId, // Prevent userId from being changed
        createdAt: existingNote.createdAt,
        updatedAt: new Date(),
      };

      const response = await this.notesDb.insert(updatedNote);
      return {
        ...updatedNote,
        _rev: response.rev,
      };
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    try {
      const note = await this.getNoteById(id, userId);
      if (!note) {
        return false;
      }

      // If deleting a folder, also delete all children recursively
      if (note.type === 'folder' && note.children && note.children.length > 0) {
        for (const childId of note.children) {
          await this.deleteNote(childId, userId);
        }
      }

      // Remove this node from parent's children array
      if (note.parentId) {
        const parent = await this.getNoteById(note.parentId, userId);
        if (parent && parent.children) {
          parent.children = parent.children.filter(childId => childId !== note._id);
          await this.updateNote(parent._id, userId, { children: parent.children });
        }
      }

      await this.notesDb.destroy(note._id, note._rev!);
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  }

  async getSpacesByUser(userId: string): Promise<Note[]> {
    try {
      const response = await this.notesDb.find({
        selector: {
          userId: userId,
          type: 'space',
          $or: [{ parentId: { $exists: false } }, { parentId: null }],
        },
        sort: [{ position: 'asc' }],
      });

      return response.docs;
    } catch (error) {
      console.error('Failed to get spaces by user:', error);
      return [];
    }
  }

  async getChildNodes(parentId: string, userId: string): Promise<Note[]> {
    try {
      const response = await this.notesDb.find({
        selector: {
          userId: userId,
          parentId: parentId,
        },
        sort: [{ position: 'asc' }],
      });

      return response.docs;
    } catch (error) {
      console.error('Failed to get child nodes:', error);
      return [];
    }
  }

  async moveNode(
    nodeId: string,
    newParentId: string | undefined,
    newPosition: number,
    userId: string
  ): Promise<Note> {
    try {
      const node = await this.getNoteById(nodeId, userId);
      if (!node) {
        throw new Error('Node not found or access denied');
      }

      // Remove from old parent's children
      if (node.parentId) {
        const oldParent = await this.getNoteById(node.parentId, userId);
        if (oldParent && oldParent.children) {
          oldParent.children = oldParent.children.filter(childId => childId !== nodeId);
          await this.updateNote(oldParent._id, userId, { children: oldParent.children });
        }
      }

      // Add to new parent's children
      if (newParentId) {
        const newParent = await this.getNoteById(newParentId, userId);
        if (!newParent) {
          throw new Error('New parent not found or access denied');
        }

        const children = newParent.children || [];
        children.splice(newPosition, 0, nodeId);
        await this.updateNote(newParent._id, userId, { children });
      }

      // Update the node itself
      return await this.updateNote(nodeId, userId, {
        parentId: newParentId,
        position: newPosition,
      });
    } catch (error) {
      console.error('Failed to move node:', error);
      throw error;
    }
  }

  async getNodePath(nodeId: string, userId: string): Promise<Note[]> {
    try {
      const path: Note[] = [];
      let currentNode = await this.getNoteById(nodeId, userId);

      while (currentNode) {
        path.unshift(currentNode);
        if (!currentNode.parentId) {
          break;
        }
        currentNode = await this.getNoteById(currentNode.parentId, userId);
      }

      return path;
    } catch (error) {
      console.error('Failed to get node path:', error);
      return [];
    }
  }

  async createUser(
    userData: Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const now = new Date();
    const user: User = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const response = await this.usersDb.insert(user);
    return {
      ...user,
      _id: response.id,
      _rev: response.rev,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.usersDb.find({
        selector: {
          email: email,
        },
        limit: 1,
      });

      return response.docs.length > 0 ? response.docs[0] : null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.usersDb.get(id);
      return user;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}
