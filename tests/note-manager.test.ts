import { NoteManager } from '../src';

describe('NoteManager', () => {
  let noteManager: NoteManager;

  beforeEach(() => {
    noteManager = new NoteManager();
  });

  test('should create a new note', () => {
    const note = noteManager.createNote('Test Note', 'Test content');
    
    expect(note).toBeDefined();
    expect(note.title).toBe('Test Note');
    expect(note.content).toBe('Test content');
    expect(note.id).toBeTruthy();
    expect(note.createdAt).toBeInstanceOf(Date);
    expect(note.updatedAt).toBeInstanceOf(Date);
  });

  test('should retrieve a note by id', () => {
    const note = noteManager.createNote('Test Note', 'Test content');
    const retrievedNote = noteManager.getNote(note.id);
    
    expect(retrievedNote).toEqual(note);
  });

  test('should return undefined for non-existent note', () => {
    const retrievedNote = noteManager.getNote('non-existent-id');
    
    expect(retrievedNote).toBeUndefined();
  });

  test('should get all notes', () => {
    noteManager.createNote('Note 1', 'Content 1');
    noteManager.createNote('Note 2', 'Content 2');
    
    const allNotes = noteManager.getAllNotes();
    
    expect(allNotes).toHaveLength(2);
  });

  test('should update a note', async () => {
    const note = noteManager.createNote('Original Title', 'Original content');
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const updatedNote = noteManager.updateNote(note.id, {
      title: 'Updated Title',
      content: 'Updated content'
    });
    
    expect(updatedNote).toBeDefined();
    expect(updatedNote!.title).toBe('Updated Title');
    expect(updatedNote!.content).toBe('Updated content');
    expect(updatedNote!.updatedAt.getTime()).toBeGreaterThanOrEqual(note.createdAt.getTime());
  });

  test('should return undefined when updating non-existent note', () => {
    const result = noteManager.updateNote('non-existent-id', { title: 'New Title' });
    
    expect(result).toBeUndefined();
  });

  test('should delete a note', () => {
    const note = noteManager.createNote('Test Note', 'Test content');
    const deleted = noteManager.deleteNote(note.id);
    
    expect(deleted).toBe(true);
    expect(noteManager.getNote(note.id)).toBeUndefined();
    expect(noteManager.getAllNotes()).toHaveLength(0);
  });

  test('should return false when deleting non-existent note', () => {
    const deleted = noteManager.deleteNote('non-existent-id');
    
    expect(deleted).toBe(false);
  });
});