import { Logger, Note } from './types';
import { ConsoleLogger, generateId } from './utils';

export class NoteManager {
  private notes: Map<string, Note> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  createNote(title: string, content: string, userId: string): Note {
    const note: Note = {
      _id: generateId(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      userId,
    };

    this.notes.set(note._id, note);
    this.logger.log('info', `Created note: ${note.title}`);
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
}
