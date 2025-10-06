import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncRoutes } from '../src/routes/sync';

describe('Sync Routes', () => {
  let app: express.Application;
  let mockDatabaseService: any;
  let mockLogger: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockLogger = {
      log: vi.fn(),
    };

    mockDatabaseService = {
      getPagesByUser: vi.fn(),
      uploadSyncData: vi.fn(),
      updatePage: vi.fn(),
      createPage: vi.fn(),
    };

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = { userId: 'user123' };
      next();
    });

    app.use('/sync', syncRoutes(mockDatabaseService, mockLogger));

    vi.clearAllMocks();
  });

  describe('GET /data', () => {
    it('should get sync data without lastSync parameter', async () => {
      const mockPages = [
        {
          _id: 'page1',
          title: 'Page 1',
          content: 'Content 1',
          updatedAt: new Date('2023-01-02'),
          createdAt: new Date('2023-01-01'),
        },
        {
          _id: 'page2',
          title: 'Page 2',
          content: 'Content 2',
          updatedAt: new Date('2023-01-03'),
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const response = await request(app).get('/sync/data');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(2);
      expect(response.body.data.pages[0]._id).toBe('page1');
      expect(response.body.data.pages[1]._id).toBe('page2');
      expect(response.body.data.lastSync).toBeDefined();
      expect(response.body.message).toBe('Synced 2 pages');
      expect(mockDatabaseService.getPagesByUser).toHaveBeenCalledWith('user123');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        'Sync data requested by user user123: 2 pages'
      );
    });

    it('should filter pages by lastSync parameter', async () => {
      const mockPages = [
        {
          _id: 'page1',
          title: 'Page 1',
          content: 'Content 1',
          updatedAt: new Date('2023-01-01T10:00:00Z'), // Before lastSync
          createdAt: new Date('2023-01-01'),
        },
        {
          _id: 'page2',
          title: 'Page 2',
          content: 'Content 2',
          updatedAt: new Date('2023-01-02T10:00:00Z'), // After lastSync
          createdAt: new Date('2023-01-01'),
        },
        {
          _id: 'page3',
          title: 'Page 3',
          content: 'Content 3',
          updatedAt: new Date('2023-01-03T10:00:00Z'), // After lastSync
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const lastSync = '2023-01-01T12:00:00Z';
      const response = await request(app).get(`/sync/data?lastSync=${lastSync}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(2); // Only page2 and page3
      expect(response.body.data.pages[0]._id).toBe('page2');
      expect(response.body.data.pages[1]._id).toBe('page3');
      expect(response.body.message).toBe('Synced 2 pages');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        'Sync data requested by user user123: 2 pages'
      );
    });

    it('should return empty pages when all are older than lastSync', async () => {
      const mockPages = [
        {
          _id: 'page1',
          title: 'Page 1',
          content: 'Content 1',
          updatedAt: new Date('2023-01-01T10:00:00Z'),
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const lastSync = '2023-01-02T10:00:00Z'; // After all pages
      const response = await request(app).get(`/sync/data?lastSync=${lastSync}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(0);
      expect(response.body.message).toBe('Synced 0 pages');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        'Sync data requested by user user123: 0 pages'
      );
    });

    it('should handle invalid lastSync date gracefully', async () => {
      const mockPages = [
        {
          _id: 'page1',
          title: 'Page 1',
          content: 'Content 1',
          updatedAt: new Date('2023-01-02'),
          createdAt: new Date('2023-01-01'),
        },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const response = await request(app).get('/sync/data?lastSync=invalid-date');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(0); // Invalid date becomes NaN, all pages are filtered out
      expect(response.body.message).toBe('Synced 0 pages');
    });

    it('should handle database errors during sync', async () => {
      mockDatabaseService.getPagesByUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/sync/data');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to retrieve sync data');
      expect(mockLogger.log).toHaveBeenCalledWith('error', 'Sync data error:', expect.any(Error));
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/sync', syncRoutes(mockDatabaseService, mockLogger));

      const response = await request(appNoAuth).get('/sync/data');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Authentication required');
    });

    it('should handle empty pages array', async () => {
      mockDatabaseService.getPagesByUser.mockResolvedValue([]);

      const response = await request(app).get('/sync/data');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pages).toHaveLength(0);
      expect(response.body.message).toBe('Synced 0 pages');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        'Sync data requested by user user123: 0 pages'
      );
    });
  });

  describe('POST /bulk', () => {
    const validSyncData = {
      pages: [
        {
          _id: 'page_existing123',
          title: 'Updated Page 1',
          content: 'Updated content',
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    it('should process bulk sync data successfully', async () => {
      mockDatabaseService.updatePage.mockResolvedValue({});

      const response = await request(app).post('/sync/bulk').send(validSyncData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(1);
      expect(response.body.data.created).toBe(0);
      expect(response.body.data.errors).toHaveLength(0);
      expect(response.body.message).toBe('Processed 1 pages');
      expect(mockDatabaseService.updatePage).toHaveBeenCalledWith(
        'page_existing123',
        'user123',
        expect.objectContaining({
          title: 'Updated Page 1',
          content: 'Updated content',
          userId: 'user123',
        })
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        'Bulk sync by user user123: 0 created, 1 updated, 0 errors'
      );
    });

    it('should handle empty sync data', async () => {
      const emptySyncData = {
        pages: [],
      };

      const response = await request(app).post('/sync/bulk').send(emptySyncData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(0);
      expect(response.body.data.updated).toBe(0);
      expect(response.body.data.errors).toHaveLength(0);
      expect(response.body.message).toBe('Processed 0 pages');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'info',
        'Bulk sync by user user123: 0 created, 0 updated, 0 errors'
      );
    });

    it('should handle database errors during bulk sync', async () => {
      mockDatabaseService.updatePage.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/sync/bulk').send(validSyncData);

      expect(response.status).toBe(200); // Still returns 200 but with errors in results
      expect(response.body.success).toBe(true);
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.errors[0].page).toBe('page_existing123');
      expect(response.body.data.errors[0].error).toBe('Database error');
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/sync', syncRoutes(mockDatabaseService, mockLogger));

      const response = await request(appNoAuth).post('/sync/bulk').send(validSyncData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Authentication required');
    });

    it('should create new pages for pages without existing IDs', async () => {
      const newPageData = {
        pages: [
          {
            title: 'New Page',
            content: 'New content',
            type: 'page',
          },
        ],
      };

      mockDatabaseService.createPage.mockResolvedValue({ _id: 'page123' });

      const response = await request(app).post('/sync/bulk').send(newPageData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.updated).toBe(0);
      expect(mockDatabaseService.createPage).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Page',
          content: 'New content',
          userId: 'user123',
        })
      );
    });

    it('should return validation error for invalid pages data', async () => {
      const invalidData = {
        pages: 'not-an-array',
      };

      const response = await request(app).post('/sync/bulk').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Pages must be an array');
    });
  });

  describe('GET /changes', () => {
    it('should get changes feed without since parameter', async () => {
      const mockPages = [
        {
          _id: 'page1',
          _rev: '1-abc123',
          title: 'Page 1',
          updatedAt: new Date('2023-01-02'),
        },
        {
          _id: 'page2',
          _rev: '2-def456',
          title: 'Page 2',
          updatedAt: new Date('2023-01-03'),
        },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const response = await request(app).get('/sync/changes');

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].id).toBe('page1');
      expect(response.body.results[0].rev).toBe('1-abc123');
      expect(response.body.results[1].id).toBe('page2');
      expect(response.body.last_seq).toBeDefined();
      expect(response.body.pending).toBe(0);
    });

    it('should filter changes by since parameter', async () => {
      const mockPages = [
        {
          _id: 'page1',
          _rev: '1-abc123',
          title: 'Page 1',
          updatedAt: new Date('2023-01-01T10:00:00Z'),
        },
        {
          _id: 'page2',
          _rev: '2-def456',
          title: 'Page 2',
          updatedAt: new Date('2023-01-02T10:00:00Z'),
        },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const since = '2023-01-01T12:00:00Z';
      const response = await request(app).get(`/sync/changes?since=${since}`);

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(1); // Only page2
      expect(response.body.results[0].id).toBe('page2');
    });

    it('should require authentication for changes feed', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/sync', syncRoutes(mockDatabaseService, mockLogger));

      const response = await request(appNoAuth).get('/sync/changes');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /info', () => {
    it('should get database info successfully', async () => {
      const mockPages = [
        { _id: 'page1', title: 'Page 1' },
        { _id: 'page2', title: 'Page 2' },
        { _id: 'page3', title: 'Page 3' },
      ];

      mockDatabaseService.getPagesByUser.mockResolvedValue(mockPages);

      const response = await request(app).get('/sync/info');

      expect(response.status).toBe(200);
      expect(response.body.db_name).toBe('user_user123');
      expect(response.body.doc_count).toBe(3);
      expect(response.body.doc_del_count).toBe(0);
      expect(response.body.update_seq).toBeDefined();
      expect(response.body.disk_format_version).toBe(8);
      expect(response.body.compact_running).toBe(false);
    });

    it('should handle empty database', async () => {
      mockDatabaseService.getPagesByUser.mockResolvedValue([]);

      const response = await request(app).get('/sync/info');

      expect(response.status).toBe(200);
      expect(response.body.db_name).toBe('user_user123');
      expect(response.body.doc_count).toBe(0);
    });

    it('should require authentication for database info', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/sync', syncRoutes(mockDatabaseService, mockLogger));

      const response = await request(appNoAuth).get('/sync/info');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle database errors during info retrieval', async () => {
      mockDatabaseService.getPagesByUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/sync/info');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to retrieve database info');
    });
  });
});
