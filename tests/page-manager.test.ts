import { beforeEach, describe, expect, it } from 'vitest';
import { PageManager } from '../src';

describe('PageManager', () => {
  let pageManager: PageManager;

  beforeEach(() => {
    pageManager = new PageManager();
  });

  it('should create a new page', () => {
    const page = pageManager.createPage('Test Page', 'Test content', 'user123');

    expect(page).toBeDefined();
    expect(page.title).toBe('Test Page');
    expect(page.content).toBe('Test content');
    expect(page._id).toBeTruthy();
    expect(page.userId).toBe('user123');
    expect(page.type).toBe('page');
    expect(page.position).toBe(0);
    expect(page.createdAt).toBeInstanceOf(Date);
    expect(page.updatedAt).toBeInstanceOf(Date);
  });

  it('should retrieve a page by id', () => {
    const page = pageManager.createPage('Test Page', 'Test content', 'user123');
    const retrievedPage = pageManager.getPage(page._id);

    expect(retrievedPage).toEqual(page);
  });

  it('should return undefined for non-existent page', () => {
    const retrievedPage = pageManager.getPage('non-existent-id');

    expect(retrievedPage).toBeUndefined();
  });

  it('should get all pages', () => {
    pageManager.createPage('Page 1', 'Content 1', 'user123');
    pageManager.createPage('Page 2', 'Content 2', 'user123');

    const allPages = pageManager.getAllPages();

    expect(allPages).toHaveLength(2);
  });

  it('should update a page', () => {
    const page = pageManager.createPage(
      'Original Title',
      'Original content',
      'user123'
    );

    const updatedPage = pageManager.updatePage(page._id, {
      title: 'Updated Title',
      content: 'Updated content',
    });

    expect(updatedPage).toBeDefined();
    expect(updatedPage!.title).toBe('Updated Title');
    expect(updatedPage!.content).toBe('Updated content');
  });

  it('should return undefined when updating non-existent page', () => {
    const result = pageManager.updatePage('non-existent-id', {
      title: 'New Title',
    });

    expect(result).toBeUndefined();
  });

  it('should delete a page', () => {
    const page = pageManager.createPage('Test Page', 'Test content', 'user123');
    const deleted = pageManager.deletePage(page._id);

    expect(deleted).toBe(true);
    expect(pageManager.getPage(page._id)).toBeUndefined();
    expect(pageManager.getAllPages()).toHaveLength(0);
  });

  it('should return false when deleting non-existent page', () => {
    const deleted = pageManager.deletePage('non-existent-id');

    expect(deleted).toBe(false);
  });

  describe('Tree Structure', () => {
    it('should create a space', () => {
      const space = pageManager.createSpace('My Workspace', 'user123');

      expect(space).toBeDefined();
      expect(space.title).toBe('My Workspace');
      expect(space.type).toBe('space');
      expect(space.parentId).toBeUndefined();
      expect(space.children).toEqual([]);
    });

    it('should create a folder within a space', () => {
      const space = pageManager.createSpace('My Workspace', 'user123');
      const folder = pageManager.createFolder('Projects', 'user123', space._id);

      expect(folder).toBeDefined();
      expect(folder.title).toBe('Projects');
      expect(folder.type).toBe('folder');
      expect(folder.parentId).toBe(space._id);
      expect(folder.children).toEqual([]);
      expect(space.children).toContain(folder._id);
    });

    it('should create a page within a folder', () => {
      const space = pageManager.createSpace('My Workspace', 'user123');
      const folder = pageManager.createFolder('Projects', 'user123', space._id);
      const page = pageManager.createPageNode(
        'Project Notes',
        'Some content',
        'user123',
        folder._id
      );

      expect(page).toBeDefined();
      expect(page.title).toBe('Project Notes');
      expect(page.type).toBe('page');
      expect(page.parentId).toBe(folder._id);
      expect(page.children).toBeUndefined();
      expect(folder.children).toContain(page._id);
    });

    it('should get spaces by user', () => {
      pageManager.createSpace('Workspace 1', 'user123');
      pageManager.createSpace('Workspace 2', 'user123');
      pageManager.createSpace('Other User Workspace', 'user456');

      const spaces = pageManager.getSpacesByUserId('user123');

      expect(spaces).toHaveLength(2);
      expect(spaces.every((space) => space.type === 'space')).toBe(true);
      expect(spaces.every((space) => space.userId === 'user123')).toBe(true);
    });

    it('should get child nodes', () => {
      const space = pageManager.createSpace('My Workspace', 'user123');
      const folder1 = pageManager.createFolder(
        'Folder 1',
        'user123',
        space._id
      );
      const folder2 = pageManager.createFolder(
        'Folder 2',
        'user123',
        space._id
      );
      const page = pageManager.createPageNode(
        'Page 1',
        'Content',
        'user123',
        space._id
      );

      const children = pageManager.getChildNodes(space._id);

      expect(children).toHaveLength(3);
      expect(children.every((child) => child.parentId === space._id)).toBe(
        true
      );
    });

    it('should move a node to a new parent', () => {
      const space = pageManager.createSpace('My Workspace', 'user123');
      const folder1 = pageManager.createFolder(
        'Folder 1',
        'user123',
        space._id
      );
      const folder2 = pageManager.createFolder(
        'Folder 2',
        'user123',
        space._id
      );
      const page = pageManager.createPageNode(
        'Page 1',
        'Content',
        'user123',
        folder1._id
      );

      const moved = pageManager.moveNode(page._id, folder2._id, 0);

      expect(moved).toBe(true);
      expect(page.parentId).toBe(folder2._id);
      expect(folder2.children).toContain(page._id);
      expect(folder1.children).not.toContain(page._id);
    });

    it('should get node path', () => {
      const space = pageManager.createSpace('My Workspace', 'user123');
      const folder = pageManager.createFolder('Projects', 'user123', space._id);
      const page = pageManager.createPageNode(
        'Project Notes',
        'Content',
        'user123',
        folder._id
      );

      const path = pageManager.getNodePath(page._id);

      expect(path).toHaveLength(3);
      expect(path[0]).toBe(space);
      expect(path[1]).toBe(folder);
      expect(path[2]).toBe(page);
    });
  });
});
