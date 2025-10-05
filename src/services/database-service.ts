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

      await this.notesDb.destroy(note._id, note._rev!);
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
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
