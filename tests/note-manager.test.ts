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
    expect(note.type).toBe('page');
    expect(note.position).toBe(0);
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

  describe('Tree Structure', () => {
    it('should create a space', () => {
      const space = noteManager.createSpace('My Workspace', 'user123');

      expect(space).toBeDefined();
      expect(space.title).toBe('My Workspace');
      expect(space.type).toBe('space');
      expect(space.parentId).toBeUndefined();
      expect(space.children).toEqual([]);
    });

    it('should create a folder within a space', () => {
      const space = noteManager.createSpace('My Workspace', 'user123');
      const folder = noteManager.createFolder('Projects', 'user123', space._id);

      expect(folder).toBeDefined();
      expect(folder.title).toBe('Projects');
      expect(folder.type).toBe('folder');
      expect(folder.parentId).toBe(space._id);
      expect(folder.children).toEqual([]);
      expect(space.children).toContain(folder._id);
    });

    it('should create a page within a folder', () => {
      const space = noteManager.createSpace('My Workspace', 'user123');
      const folder = noteManager.createFolder('Projects', 'user123', space._id);
      const page = noteManager.createPage('Project Notes', 'Some content', 'user123', folder._id);

      expect(page).toBeDefined();
      expect(page.title).toBe('Project Notes');
      expect(page.type).toBe('page');
      expect(page.parentId).toBe(folder._id);
      expect(page.children).toBeUndefined();
      expect(folder.children).toContain(page._id);
    });

    it('should get spaces by user', () => {
      noteManager.createSpace('Workspace 1', 'user123');
      noteManager.createSpace('Workspace 2', 'user123');
      noteManager.createSpace('Other User Workspace', 'user456');

      const spaces = noteManager.getSpacesByUserId('user123');

      expect(spaces).toHaveLength(2);
      expect(spaces.every(space => space.type === 'space')).toBe(true);
      expect(spaces.every(space => space.userId === 'user123')).toBe(true);
    });

    it('should get child nodes', () => {
      const space = noteManager.createSpace('My Workspace', 'user123');
      const folder1 = noteManager.createFolder('Folder 1', 'user123', space._id);
      const folder2 = noteManager.createFolder('Folder 2', 'user123', space._id);
      const page = noteManager.createPage('Page 1', 'Content', 'user123', space._id);

      const children = noteManager.getChildNodes(space._id);

      expect(children).toHaveLength(3);
      expect(children.every(child => child.parentId === space._id)).toBe(true);
    });

    it('should move a node to a new parent', () => {
      const space = noteManager.createSpace('My Workspace', 'user123');
      const folder1 = noteManager.createFolder('Folder 1', 'user123', space._id);
      const folder2 = noteManager.createFolder('Folder 2', 'user123', space._id);
      const page = noteManager.createPage('Page 1', 'Content', 'user123', folder1._id);

      const moved = noteManager.moveNode(page._id, folder2._id, 0);

      expect(moved).toBe(true);
      expect(page.parentId).toBe(folder2._id);
      expect(folder2.children).toContain(page._id);
      expect(folder1.children).not.toContain(page._id);
    });

    it('should get node path', () => {
      const space = noteManager.createSpace('My Workspace', 'user123');
      const folder = noteManager.createFolder('Projects', 'user123', space._id);
      const page = noteManager.createPage('Project Notes', 'Content', 'user123', folder._id);

      const path = noteManager.getNodePath(page._id);

      expect(path).toHaveLength(3);
      expect(path[0]).toBe(space);
      expect(path[1]).toBe(folder);
      expect(path[2]).toBe(page);
    });
  });
});
