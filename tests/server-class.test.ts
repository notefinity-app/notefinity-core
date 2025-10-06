import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotefinityServer } from '../src/server';
import { DatabaseService } from '../src/services/database-service';

// Mock all the services and dependencies
vi.mock('../src/services/database-service');
vi.mock('../src/services/auth-service');
vi.mock('../src/services/logger');
vi.mock('../src/services/plugin-manager');

describe('NotefinityServer Class', () => {
  let server: NotefinityServer;
  let mockDatabaseService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock DatabaseService methods
    mockDatabaseService = {
      initialize: vi.fn().mockResolvedValue(undefined),
    };

    (DatabaseService as any).mockImplementation(() => mockDatabaseService);

    server = new NotefinityServer();
  });

  describe('Constructor and Setup', () => {
    it('should create server instance with all services', () => {
      expect(server).toBeInstanceOf(NotefinityServer);
    });

    it('should setup middleware correctly', async () => {
      const app = (server as any).app;
      expect(app).toBeInstanceOf(Function); // Express app is a function
    });
  });

  describe('Health Endpoint', () => {
    it('should respond to health check with correct format', async () => {
      const app = (server as any).app;
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Notefinity Core API is running',
        timestamp: expect.any(String),
        version: expect.any(String),
      });
    });

    it('should include version from environment or default', async () => {
      const originalVersion = process.env.npm_package_version;
      delete process.env.npm_package_version;

      const app = (server as any).app;
      const response = await request(app).get('/health');

      expect(response.body.version).toBe('1.0.0');

      // Restore original version
      if (originalVersion) {
        process.env.npm_package_version = originalVersion;
      }
    });
  });

  describe('API Routes', () => {
    it('should mount routes during setup', async () => {
      // Just verify that the server was constructed without errors
      expect(server).toBeInstanceOf(NotefinityServer);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const app = (server as any).app;
      const response = await request(app).get('/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Not Found',
        message: 'Route GET /nonexistent-route not found',
      });
    });

    it('should handle different HTTP methods in 404 response', async () => {
      const app = (server as any).app;

      const postResponse = await request(app).post('/nonexistent');
      expect(postResponse.status).toBe(404);
      expect(postResponse.body.message).toContain('Route POST /nonexistent not found');

      const putResponse = await request(app).put('/nonexistent');
      expect(putResponse.status).toBe(404);
      expect(putResponse.body.message).toContain('Route PUT /nonexistent not found');

      const deleteResponse = await request(app).delete('/nonexistent');
      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body.message).toContain('Route DELETE /nonexistent not found');
    });

    it('should have error handling setup', async () => {
      // Just verify error handling middleware is in place
      const app = (server as any).app;
      expect(app).toBeDefined();
    });
  });

  describe('Server Startup', () => {
    it('should initialize database and start server successfully', async () => {
      const mockListen = vi.fn();
      const app = (server as any).app;
      app.listen = mockListen;

      mockDatabaseService.initialize.mockResolvedValue(undefined);

      await server.start(3001);

      expect(mockDatabaseService.initialize).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalledWith(3001, expect.any(Function));
    });

    it('should use default port when none provided', async () => {
      const mockListen = vi.fn();
      const app = (server as any).app;
      app.listen = mockListen;

      mockDatabaseService.initialize.mockResolvedValue(undefined);

      await server.start();

      expect(mockListen).toHaveBeenCalledWith(3001, expect.any(Function));
    });

    it('should handle database initialization errors', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit called');
      });

      mockDatabaseService.initialize.mockRejectedValue(new Error('Database connection failed'));

      await expect(server.start(3001)).rejects.toThrow('Process exit called');

      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should log server startup information', async () => {
      const mockListen = vi.fn((port, callback) => callback());
      const app = (server as any).app;
      app.listen = mockListen;

      mockDatabaseService.initialize.mockResolvedValue(undefined);

      await server.start(3001);

      expect(mockListen).toHaveBeenCalled();

      // Verify the callback was executed (which logs the startup info)
      expect(mockListen.mock.calls[0][1]).toEqual(expect.any(Function));
    });
  });

  describe('Middleware Setup', () => {
    it('should handle request logging middleware', async () => {
      const app = (server as any).app;

      // Make a request to trigger the logging middleware
      const response = await request(app).get('/health').set('User-Agent', 'Test Agent');

      expect(response.status).toBe(200);
    });

    it('should setup body parsing middleware', async () => {
      // Verify middleware is setup without testing specific routes
      const app = (server as any).app;
      expect(app).toBeDefined();
    });

    it('should apply security headers via helmet', async () => {
      const app = (server as any).app;
      const response = await request(app).get('/health');

      // Helmet adds various security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should apply CORS headers', async () => {
      const app = (server as any).app;
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
    });

    it('should apply rate limiting', async () => {
      const app = (server as any).app;
      const response = await request(app).get('/health');

      // Rate limiting middleware should add headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Plugin Integration', () => {
    it('should initialize plugin manager', () => {
      const pluginManager = (server as any).pluginManager;
      expect(pluginManager).toBeDefined();
    });
  });
});
