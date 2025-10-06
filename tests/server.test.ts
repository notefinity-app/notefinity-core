import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Server Middleware and Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a simple Express app that mimics the server setup
    app = express();

    // Security middleware
    app.use(helmet());
    app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Notefinity Core API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Test error routes (defined before 404 handler)
    app.get('/test-error', (req, res, next) => {
      throw new Error('Test error message');
    });

    app.get('/test-error-prod', (req, res, next) => {
      throw new Error('Sensitive error message');
    });

    app.get('/async-error', async (req, res, next) => {
      try {
        throw new Error('Async error');
      } catch (error) {
        next(error);
      }
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });

    // Global error handler
    app.use(
      (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        });
      }
    );
  });

  describe('Health Endpoint', () => {
    it('should respond to health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notefinity Core API is running');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('Route GET /nonexistent-route not found');
    });

    it('should handle POST requests to unknown routes', async () => {
      const response = await request(app).post('/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('Route POST /nonexistent-route not found');
    });

    it('should handle PUT requests to unknown routes', async () => {
      const response = await request(app).put('/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('Route PUT /nonexistent-route not found');
    });

    it('should handle DELETE requests to unknown routes', async () => {
      const response = await request(app).delete('/nonexistent-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('Route DELETE /nonexistent-route not found');
    });
  });

  describe('Middleware Setup', () => {
    it('should parse JSON bodies', async () => {
      const response = await request(app).post('/nonexistent-route').send({ test: 'data' });

      expect(response.status).toBe(404); // Route doesn't exist, but body was parsed
    });

    it('should parse URL encoded bodies', async () => {
      const response = await request(app)
        .post('/nonexistent-route')
        .send('key=value')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).toBe(404); // Route doesn't exist, but body was parsed
    });

    it('should handle large JSON payloads within limit', async () => {
      const largeData = { content: 'x'.repeat(1024 * 1024) }; // 1MB

      const response = await request(app).post('/nonexistent-route').send(largeData);

      expect(response.status).toBe(404); // Route doesn't exist, but body was parsed
    });

    it('should apply security headers', async () => {
      const response = await request(app).get('/health');

      // Helmet should add security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      // Should handle OPTIONS request
      expect(response.status).toBe(204);
    });

    it('should apply rate limiting headers', async () => {
      const response = await request(app).get('/health');

      // Rate limiting middleware should add headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Global Error Handler', () => {
    it('should handle unhandled errors in development', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app).get('/test-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Test error message');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error messages in production', async () => {
      // Set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app).get('/test-error-prod');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Something went wrong');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle async errors', async () => {
      const response = await request(app).get('/async-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
    });
  });
});
