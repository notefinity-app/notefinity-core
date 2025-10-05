import { Logger, NodeType, Note } from './types';
import { ConsoleLogger, generateId } from './utils';

export class NoteManager {
  private notes: Map<string, Note> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  createNote(
    title: string,
    content: string,
    userId: string,
    type: NodeType = 'page',
    parentId?: string
  ): Note {
    const note: Note = {
      _id: generateId(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      userId,
      type,
      parentId,
      position: 0, // Will be updated when added to parent
      children: type === 'page' ? undefined : [],
    };

    this.notes.set(note._id, note);

    // If this has a parent, add it to the parent's children
    if (parentId) {
      const parent = this.notes.get(parentId);
      if (parent && parent.children) {
        parent.children.push(note._id);
        note.position = parent.children.length - 1;
      }
    }

    this.logger.log('info', `Created ${type}: ${note.title}`);
    return note;
  }

  getNote(id: string): Note | undefined {
    return this.notes.get(id);
  }

  getAllNotes(): Note[] {
    return Array.from(this.notes.values());
  }

  updateNote(
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>
  ): Note | undefined {
    const note = this.notes.get(id);
    if (!note) {
      this.logger.log('warn', `Note not found: ${id}`);
      return undefined;
    }

    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };

    this.notes.set(id, updatedNote);
    this.logger.log('info', `Updated note: ${updatedNote.title}`);
    return updatedNote;
  }

  deleteNote(id: string): boolean {
    const deleted = this.notes.delete(id);
    if (deleted) {
      this.logger.log('info', `Deleted note: ${id}`);
    } else {
      this.logger.log('warn', `Note not found for deletion: ${id}`);
    }
    return deleted;
  }

  getNotesByUserId(userId: string): Note[] {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  getSpacesByUserId(userId: string): Note[] {
    return Array.from(this.notes.values()).filter(
      note => note.userId === userId && note.type === 'space' && !note.parentId
    );
  }

  getChildNodes(parentId: string): Note[] {
    return Array.from(this.notes.values())
      .filter(note => note.parentId === parentId)
      .sort((a, b) => a.position - b.position);
  }

  moveNode(nodeId: string, newParentId?: string, newPosition?: number): boolean {
    const node = this.notes.get(nodeId);
    if (!node) {
      this.logger.log('warn', `Node not found for move: ${nodeId}`);
      return false;
    }

    // Remove from old parent's children
    if (node.parentId) {
      const oldParent = this.notes.get(node.parentId);
      if (oldParent && oldParent.children) {
        oldParent.children = oldParent.children.filter(childId => childId !== nodeId);
        // Update positions of remaining children
        oldParent.children.forEach((childId, index) => {
          const child = this.notes.get(childId);
          if (child) {
            child.position = index;
          }
        });
      }
    }

    // Update node's parent
    node.parentId = newParentId;

    // Add to new parent's children
    if (newParentId) {
      const newParent = this.notes.get(newParentId);
      if (!newParent) {
        this.logger.log('warn', `New parent not found: ${newParentId}`);
        return false;
      }

      if (!newParent.children) {
        newParent.children = [];
      }

      const insertPosition = newPosition !== undefined ? newPosition : newParent.children.length;
      newParent.children.splice(insertPosition, 0, nodeId);

      // Update positions of all children
      newParent.children.forEach((childId, index) => {
        const child = this.notes.get(childId);
        if (child) {
          child.position = index;
        }
      });
    } else {
      node.position = newPosition || 0;
    }

    node.updatedAt = new Date();
    this.logger.log('info', `Moved node: ${node.title}`);
    return true;
  }

  getNodePath(nodeId: string): Note[] {
    const path: Note[] = [];
    let currentNode = this.notes.get(nodeId);

    while (currentNode) {
      path.unshift(currentNode);
      if (!currentNode.parentId) {
        break;
      }
      currentNode = this.notes.get(currentNode.parentId);
    }

    return path;
  }

  createSpace(title: string, userId: string): Note {
    return this.createNote(title, '', userId, 'space');
  }

  createFolder(title: string, userId: string, parentId?: string): Note {
    return this.createNote(title, '', userId, 'folder', parentId);
  }

  createPage(title: string, content: string, userId: string, parentId?: string): Note {
    return this.createNote(title, content, userId, 'page', parentId);
  }
}
