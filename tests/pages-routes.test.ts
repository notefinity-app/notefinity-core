import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pagesRoutes } from '../src/routes/pages';
import { AuthService } from '../src/services/auth-service';
import { DatabaseService } from '../src/services/database-service';
import { Logger } from '../src/services/logger';

describe('Pages Routes', () => {
  let app: express.Application;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockLogger: Partial<Logger>;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    // Create mock services
    mockDatabaseService = {
      getPagesByUser: vi.fn(),
      createPage: vi.fn(),
      getPageById: vi.fn(),
      updatePage: vi.fn(),
      deletePage: vi.fn(),
      getSpacesByUser: vi.fn(),
      getChildNodes: vi.fn(),
      moveNode: vi.fn(),
      getNodePath: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
    };

    mockAuthService = {
      extractTokenFromHeader: vi.fn(),
      verifyToken: vi.fn(),
    };

    // Create Express app with routes
    app = express();
    app.use(express.json());

    // Add auth middleware mock
    app.use((req, res, next) => {
      req.user = { userId: 'user123', email: 'test@example.com' };
      next();
    });

    app.use('/pages', pagesRoutes(mockDatabaseService as DatabaseService, mockLogger as Logger));

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('GET /pages', () => {
    it('should get all pages for authenticated user', async () => {
      const mockPages = [
        {
          _id: 'page1',
          title: 'Page 1',
          content: 'Content 1',
          type: 'page',
          userId: 'user123',
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockDatabaseService.getPagesByUser as any).mockResolvedValue(mockPages);

      const response = await request(app).get('/pages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(1);
      expect(mockDatabaseService.getPagesByUser).toHaveBeenCalledWith('user123');
    });

    it('should handle database errors gracefully', async () => {
      (mockDatabaseService.getPagesByUser as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/pages');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(mockLogger.log).toHaveBeenCalledWith('error', 'Get pages error:', expect.any(Error));
    });
  });

  describe('POST /pages', () => {
    const validPageData = {
      title: 'New Page',
      content: 'Page content',
      type: 'page',
      position: 0,
    };

    it('should create a new page successfully', async () => {
      const mockCreatedPage = {
        _id: 'page123',
        title: 'New Page',
        content: 'Page content',
        type: 'page',
        userId: 'user123',
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDatabaseService.createPage as any).mockResolvedValue(mockCreatedPage);

      const response = await request(app).post('/pages').send(validPageData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page.id).toBe('page123'); // serializePage maps _id to id
      expect(mockDatabaseService.createPage).toHaveBeenCalled();
    });

    it('should return validation error for invalid input', async () => {
      const invalidData = {
        title: '', // Empty title
        type: 'invalid-type',
      };

      const response = await request(app).post('/pages').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle encrypted page creation', async () => {
      const encryptedPageData = {
        isEncrypted: true,
        encryptedTitle: {
          algorithm: 'RSA-OAEP+AES-256-GCM',
          data: 'encrypted-title',
          version: 1,
        },
        encryptedContent: {
          algorithm: 'RSA-OAEP+AES-256-GCM',
          data: 'encrypted-content',
          version: 1,
        },
        type: 'page',
      };

      const mockCreatedPage = {
        _id: 'page123',
        isEncrypted: true,
        encryptedTitle: encryptedPageData.encryptedTitle,
        encryptedContent: encryptedPageData.encryptedContent,
        type: 'page',
        userId: 'user123',
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDatabaseService.createPage as any).mockResolvedValue(mockCreatedPage);

      const response = await request(app).post('/pages').send(encryptedPageData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page.id).toBe('page123');
    });

    it('should handle database errors during creation', async () => {
      (mockDatabaseService.createPage as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/pages').send(validPageData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /pages/:id', () => {
    it('should get page by ID successfully', async () => {
      const mockPage = {
        _id: 'page123',
        title: 'Test Page',
        content: 'Test content',
        type: 'page',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDatabaseService.getPageById as any).mockResolvedValue(mockPage);

      const response = await request(app).get('/pages/page123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page.id).toBe('page123');
      expect(mockDatabaseService.getPageById).toHaveBeenCalledWith('page123', 'user123');
    });

    it('should return 404 for non-existent page', async () => {
      (mockDatabaseService.getPageById as any).mockResolvedValue(null);

      const response = await request(app).get('/pages/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Page not found');
    });

    it('should handle database errors', async () => {
      (mockDatabaseService.getPageById as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/pages/page123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /pages/:id', () => {
    const updateData = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('should update page successfully', async () => {
      const mockUpdatedPage = {
        _id: 'page123',
        title: 'Updated Title',
        content: 'Updated content',
        type: 'page',
        userId: 'user123',
        updatedAt: new Date(),
      };

      (mockDatabaseService.updatePage as any).mockResolvedValue(mockUpdatedPage);

      const response = await request(app).put('/pages/page123').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page.id).toBe('page123');
      expect(mockDatabaseService.updatePage).toHaveBeenCalledWith('page123', 'user123', updateData);
    });

    it('should return validation error for invalid update data', async () => {
      const invalidData = {
        title: '', // Empty title
        position: -1, // Invalid position
      };

      const response = await request(app).put('/pages/page123').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent page', async () => {
      (mockDatabaseService.updatePage as any).mockRejectedValue(
        new Error('Page not found or access denied')
      );

      const response = await request(app).put('/pages/nonexistent').send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /pages/:id', () => {
    it('should delete page successfully', async () => {
      (mockDatabaseService.deletePage as any).mockResolvedValue(true);

      const response = await request(app).delete('/pages/page123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Page deleted successfully');
      expect(mockDatabaseService.deletePage).toHaveBeenCalledWith('page123', 'user123');
    });

    it('should return 404 for non-existent page', async () => {
      (mockDatabaseService.deletePage as any).mockResolvedValue(false);

      const response = await request(app).delete('/pages/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      (mockDatabaseService.deletePage as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/pages/page123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /pages/spaces', () => {
    it('should get spaces for user', async () => {
      const mockSpaces = [
        {
          _id: 'space1',
          title: 'My Workspace',
          type: 'space',
          userId: 'user123',
        },
      ];

      (mockDatabaseService.getSpacesByUser as any).mockResolvedValue(mockSpaces);

      const response = await request(app).get('/pages/spaces');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.spaces).toHaveLength(1);
      expect(mockDatabaseService.getSpacesByUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('GET /pages/:id/children', () => {
    it('should get child nodes', async () => {
      const mockChildren = [
        {
          _id: 'child1',
          title: 'Child Page',
          parentId: 'parent123',
        },
      ];

      (mockDatabaseService.getChildNodes as any).mockResolvedValue(mockChildren);

      const response = await request(app).get('/pages/parent123/children');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockDatabaseService.getChildNodes).toHaveBeenCalledWith('parent123', 'user123');
    });
  });

  describe('POST /pages/:id/move', () => {
    it('should move node successfully', async () => {
      const moveData = {
        parentId: 'newparent123',
        position: 2,
      };

      const mockMovedPage = {
        _id: 'page123',
        parentId: 'newparent123',
        position: 2,
      };

      (mockDatabaseService.moveNode as any).mockResolvedValue(mockMovedPage);

      const response = await request(app).patch('/pages/page123/move').send(moveData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockDatabaseService.moveNode).toHaveBeenCalledWith(
        'page123',
        'newparent123',
        2,
        'user123'
      );
    });

    it('should return validation error for invalid move data', async () => {
      const invalidData = {
        position: -1, // Invalid position
      };

      const response = await request(app).patch('/pages/page123/move').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /pages/:id/path', () => {
    it('should get node path successfully', async () => {
      const mockPath = [
        { _id: 'space1', title: 'Workspace', type: 'space' },
        { _id: 'folder1', title: 'Projects', type: 'folder' },
        { _id: 'page1', title: 'My Page', type: 'page' },
      ];

      (mockDatabaseService.getNodePath as any).mockResolvedValue(mockPath);

      const response = await request(app).get('/pages/page1/path');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.path).toHaveLength(3);
      expect(mockDatabaseService.getNodePath).toHaveBeenCalledWith('page1', 'user123');
    });

    it('should handle errors when getting path', async () => {
      (mockDatabaseService.getNodePath as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/pages/page1/path');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
