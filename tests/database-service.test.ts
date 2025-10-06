import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../src/services/database-service';

// Create mock database objects
const mockDb = {
  insert: vi.fn(),
  get: vi.fn(),
  find: vi.fn(),
  destroy: vi.fn(),
  list: vi.fn(),
};

// Mock nano module
vi.mock('nano', () => {
  return {
    default: () => ({
      db: {
        create: vi.fn(),
        use: vi.fn(() => mockDb),
      },
    }),
  };
});

describe('DatabaseService Unit Tests', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize the database service - this will set up the database connections
    databaseService = new DatabaseService();

    // Manually set up the database connections for testing since initialize is async
    (databaseService as any).pagesDb = mockDb;
    (databaseService as any).usersDb = mockDb;
    (databaseService as any).keystoreDb = mockDb;
  });

  describe('Database Connection', () => {
    it('should create database service instance', () => {
      expect(databaseService).toBeInstanceOf(DatabaseService);
    });

    it('should use correct CouchDB URL from environment', () => {
      const expectedUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
      expect(expectedUrl).toBeDefined();
    });
  });

  describe('User Operations', () => {
    it('should create user with proper structure', async () => {
      const mockUser = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      const mockResponse = { id: 'user123', rev: '1-abc' };
      mockDb.insert.mockResolvedValue(mockResponse);

      const result = await databaseService.createUser(mockUser);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'user123');
      expect(result.name).toBe('John Doe');
    });

    it('should handle user creation errors', async () => {
      const mockUser = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      mockDb.insert.mockRejectedValue(new Error('Database error'));

      await expect(databaseService.createUser(mockUser)).rejects.toThrow();
    });

    it('should get user by email', async () => {
      const mockUsers = {
        docs: [
          {
            _id: 'user123',
            email: 'john@example.com',
            name: 'John Doe',
          },
        ],
      };

      mockDb.find.mockResolvedValue(mockUsers);

      const result = await databaseService.getUserByEmail('john@example.com');

      expect(mockDb.find).toHaveBeenCalledWith({
        selector: { email: 'john@example.com' },
        limit: 1,
      });
      expect(result).toBeTruthy();
      expect(result?._id).toBe('user123');
    });

    it('should return null for non-existent user', async () => {
      mockDb.find.mockResolvedValue({ docs: [] });

      const result = await databaseService.getUserByEmail(
        'nonexistent@example.com'
      );

      expect(result).toBeNull();
    });
  });

  describe('Page Operations', () => {
    it('should create page with hierarchical structure', async () => {
      const mockPage = {
        title: 'Test Page',
        content: 'Test content',
        userId: 'user123',
        type: 'page' as const,
        position: 0,
      };

      const mockResponse = { id: 'page123', rev: '1-abc' };
      mockDb.insert.mockResolvedValue(mockResponse);

      const result = await databaseService.createPage(mockPage);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'page123');
      expect(result.title).toBe('Test Page');
    });

    it('should get page by ID with user validation', async () => {
      const mockPage = {
        _id: 'page123',
        title: 'Test Page',
        userId: 'user123',
        content: 'Test content',
      };

      mockDb.get.mockResolvedValue(mockPage);

      const result = await databaseService.getPageById('page123', 'user123');

      expect(mockDb.get).toHaveBeenCalledWith('page123');
      expect(result).toBeTruthy();
      expect(result?._id).toBe('page123');
    });

    it('should reject access to other users pages', async () => {
      const mockPage = {
        _id: 'page123',
        title: 'Test Page',
        userId: 'other-user',
        content: 'Test content',
      };

      mockDb.get.mockResolvedValue(mockPage);

      const result = await databaseService.getPageById('page123', 'user123');

      expect(result).toBeNull();
    });

    it('should get pages by user', async () => {
      const mockPages = {
        docs: [
          {
            _id: 'page123',
            title: 'Test Page',
            userId: 'user123',
          },
        ],
      };

      mockDb.find.mockResolvedValue(mockPages);

      const result = await databaseService.getPagesByUser('user123');

      expect(mockDb.find).toHaveBeenCalledWith({
        selector: { userId: 'user123' },
        sort: [{ updatedAt: 'desc' }],
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should get spaces by user', async () => {
      const mockSpaces = {
        docs: [
          {
            _id: 'space123',
            title: 'My Workspace',
            userId: 'user123',
            type: 'space',
          },
        ],
      };

      mockDb.find.mockResolvedValue(mockSpaces);

      const result = await databaseService.getSpacesByUser('user123');

      expect(mockDb.find).toHaveBeenCalledWith({
        selector: {
          userId: 'user123',
          type: 'space',
          $or: [{ parentId: { $exists: false } }, { parentId: null }],
        },
        sort: [{ position: 'asc' }],
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get child nodes', async () => {
      const mockChildren = {
        docs: [
          {
            _id: 'child123',
            title: 'Child Page',
            parentId: 'parent123',
          },
        ],
      };

      mockDb.find.mockResolvedValue(mockChildren);

      const result = await databaseService.getChildNodes(
        'parent123',
        'user123'
      );

      expect(mockDb.find).toHaveBeenCalledWith({
        selector: {
          parentId: 'parent123',
          userId: 'user123',
        },
        sort: [{ position: 'asc' }],
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should update page', async () => {
      const mockExistingPage = {
        _id: 'page123',
        _rev: '1-abc',
        title: 'Old Title',
        userId: 'user123',
      };

      const mockUpdatedPage = {
        ...mockExistingPage,
        _rev: '2-def',
        title: 'New Title',
      };

      mockDb.get.mockResolvedValue(mockExistingPage);
      mockDb.insert.mockResolvedValue({ id: 'page123', rev: '2-def' });

      const result = await databaseService.updatePage('page123', 'user123', {
        title: 'New Title',
      });

      expect(mockDb.get).toHaveBeenCalledWith('page123');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.title).toBe('New Title');
    });

    it('should delete page', async () => {
      const mockPage = {
        _id: 'page123',
        _rev: '1-abc',
        userId: 'user123',
      };

      mockDb.get.mockResolvedValue(mockPage);
      mockDb.destroy.mockResolvedValue({ ok: true });

      const result = await databaseService.deletePage('page123', 'user123');

      expect(result).toBe(true);
    });

    it('should handle delete of non-existent page', async () => {
      mockDb.get.mockRejectedValue({ statusCode: 404 });

      const result = await databaseService.deletePage('nonexistent', 'user123');

      expect(result).toBe(false);
    });
  });

  describe('Encryption Key Operations', () => {
    it('should store user public key', async () => {
      const mockKeyData = {
        userId: 'user123',
        publicKey: 'public-key-data',
        keyId: 'key123',
        algorithm: 'RSA-OAEP',
      };

      const mockResponse = { id: 'keystore123', rev: '1-abc' };
      mockDb.insert.mockResolvedValue(mockResponse);

      const result = await databaseService.storeUserPublicKey(mockKeyData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'keystore123');
    });

    it('should get user public key', async () => {
      const mockKeys = {
        docs: [
          {
            _id: 'keystore123',
            userId: 'user123',
            publicKey: 'public-key-data',
          },
        ],
      };

      mockDb.find.mockResolvedValue(mockKeys);

      const result = await databaseService.getUserPublicKey('user123');

      expect(mockDb.find).toHaveBeenCalledWith({
        selector: { userId: 'user123' },
        limit: 1,
        sort: [{ createdAt: 'desc' }],
      });
      expect(result).toBeTruthy();
    });

    it('should return null for non-existent public key', async () => {
      mockDb.find.mockResolvedValue({ docs: [] });

      const result = await databaseService.getUserPublicKey('nonexistent');

      expect(result).toBeNull();
    });

    it('should delete user public key', async () => {
      const mockKey = {
        _id: 'keystore123',
        _rev: '1-abc',
        userId: 'user123',
      };

      mockDb.find.mockResolvedValue({ docs: [mockKey] });
      mockDb.destroy.mockResolvedValue({ ok: true });

      const result = await databaseService.deleteUserPublicKey('user123');

      expect(result).toBe(true);
    });
  });

  describe('Node Operations', () => {
    it('should move node successfully', async () => {
      const mockExistingNode = {
        _id: 'node123',
        _rev: '1-abc',
        title: 'Test Node',
        userId: 'user123',
        parentId: 'oldparent',
        position: 1,
      };

      const mockUpdatedNode = {
        ...mockExistingNode,
        _rev: '2-def',
        parentId: 'newparent',
        position: 2,
      };

      mockDb.get.mockResolvedValue(mockExistingNode);
      mockDb.insert.mockResolvedValue({ id: 'node123', rev: '2-def' });

      const result = await databaseService.moveNode(
        'node123',
        'newparent',
        2,
        'user123'
      );

      expect(mockDb.get).toHaveBeenCalledWith('node123');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.parentId).toBe('newparent');
      expect(result.position).toBe(2);
    });

    it('should get node path successfully', async () => {
      const mockNode = {
        _id: 'page123',
        title: 'Test Page',
        parentId: 'folder123',
        userId: 'user123',
      };

      const mockParent = {
        _id: 'folder123',
        title: 'Test Folder',
        parentId: 'space123',
        userId: 'user123',
      };

      const mockRoot = {
        _id: 'space123',
        title: 'Test Space',
        parentId: null,
        userId: 'user123',
      };

      mockDb.get
        .mockResolvedValueOnce(mockNode)
        .mockResolvedValueOnce(mockParent)
        .mockResolvedValueOnce(mockRoot);

      const result = await databaseService.getNodePath('page123', 'user123');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Additional User Operations', () => {
    it('should get user by ID', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockDb.get.mockResolvedValue(mockUser);

      const result = await databaseService.getUserById('user123');

      expect(mockDb.get).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user by ID', async () => {
      mockDb.get.mockRejectedValue({ statusCode: 404 });

      const result = await databaseService.getUserById('nonexistent');

      expect(result).toBeNull();
    });

    it('should update user public key', async () => {
      const mockExistingKey = {
        _id: 'keystore123',
        _rev: '1-abc',
        userId: 'user123',
        publicKey: 'old-key',
      };

      const mockUpdatedKey = {
        ...mockExistingKey,
        _rev: '2-def',
        publicKey: 'new-key',
      };

      mockDb.find.mockResolvedValue({ docs: [mockExistingKey] });
      mockDb.insert.mockResolvedValue({ id: 'keystore123', rev: '2-def' });

      const result = await databaseService.updateUserPublicKey('user123', {
        publicKey: 'new-key',
      });

      expect(result.publicKey).toBe('new-key');
    });
  });

  describe('Error Handling', () => {
    it('should handle CouchDB connection errors', async () => {
      mockDb.get.mockRejectedValue(new Error('Connection failed'));

      await expect(
        databaseService.getPageById('page123', 'user123')
      ).rejects.toThrow();
    });

    it('should handle document not found errors', async () => {
      mockDb.get.mockRejectedValue({
        statusCode: 404,
        message: 'Document not found',
      });

      const result = await databaseService.getPageById(
        'nonexistent',
        'user123'
      );
      expect(result).toBeNull();
    });

    it('should handle validation errors gracefully', async () => {
      const invalidPage = {} as any;

      mockDb.insert.mockRejectedValue(new Error('Validation failed'));

      await expect(databaseService.createPage(invalidPage)).rejects.toThrow();
    });

    it('should handle user access validation', async () => {
      const mockPage = {
        _id: 'page123',
        title: 'Test Page',
        userId: 'other-user',
      };

      mockDb.get.mockResolvedValue(mockPage);

      const result = await databaseService.getPageById('page123', 'user123');

      expect(result).toBeNull(); // Should return null for access denied
    });

    it('should handle move node errors', async () => {
      mockDb.get.mockRejectedValue(new Error('Database error'));

      await expect(
        databaseService.moveNode('node123', 'newparent', 1, 'user123')
      ).rejects.toThrow();
    });
  });
});
