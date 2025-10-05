import { beforeEach, describe, expect, it } from 'vitest';
import { NoteManager } from '../src';

describe('NoteManager', () => {
  let noteManager: NoteManager;

  beforeEach(() => {
    noteManager = new NoteManager();
  });

  it('should create a new note', () => {
    const note = noteManager.createNote('Test Note', 'Test content', 'user123');

    expect(note).toBeDefined();
    expect(note.title).toBe('Test Note');
    expect(note.content).toBe('Test content');
    expect(note._id).toBeTruthy();
    expect(note.userId).toBe('user123');
    expect(note.createdAt).toBeInstanceOf(Date);
    expect(note.updatedAt).toBeInstanceOf(Date);
  });

  it('should retrieve a note by id', () => {
    const note = noteManager.createNote('Test Note', 'Test content', 'user123');
    const retrievedNote = noteManager.getNote(note._id);

    expect(retrievedNote).toEqual(note);
  });

  it('should return undefined for non-existent note', () => {
    const retrievedNote = noteManager.getNote('non-existent-id');

    expect(retrievedNote).toBeUndefined();
  });

  it('should get all notes', () => {
    noteManager.createNote('Note 1', 'Content 1', 'user123');
    noteManager.createNote('Note 2', 'Content 2', 'user123');

    const allNotes = noteManager.getAllNotes();

    expect(allNotes).toHaveLength(2);
  });

  it('should update a note', () => {
    const note = noteManager.createNote('Original Title', 'Original content', 'user123');

    const updatedNote = noteManager.updateNote(note._id, {
      title: 'Updated Title',
      content: 'Updated content',
    });

    expect(updatedNote).toBeDefined();
    expect(updatedNote!.title).toBe('Updated Title');
    expect(updatedNote!.content).toBe('Updated content');
  });

  it('should return undefined when updating non-existent note', () => {
    const result = noteManager.updateNote('non-existent-id', { title: 'New Title' });

    expect(result).toBeUndefined();
  });

  it('should delete a note', () => {
    const note = noteManager.createNote('Test Note', 'Test content', 'user123');
    const deleted = noteManager.deleteNote(note._id);

    expect(deleted).toBe(true);
    expect(noteManager.getNote(note._id)).toBeUndefined();
    expect(noteManager.getAllNotes()).toHaveLength(0);
  });

  it('should return false when deleting non-existent note', () => {
    const deleted = noteManager.deleteNote('non-existent-id');

    expect(deleted).toBe(false);
  });
});
