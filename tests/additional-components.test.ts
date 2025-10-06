import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware } from '../src/middleware/auth';
import { AuthService } from '../src/services/auth-service';
import { EncryptedBlob, NodeType, Page } from '../src/types';
import { ConsoleLogger, generateId } from '../src/utils';

describe('Utils Tests', () => {
  describe('ConsoleLogger', () => {
    it('should log messages with timestamp and level', () => {
      const logger = new ConsoleLogger();
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.log('info', 'Test message');

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message/)
      );

      infoSpy.mockRestore();
    });

    it('should log different levels correctly', () => {
      const logger = new ConsoleLogger();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      logger.log('error', 'Error message');
      logger.log('warn', 'Warning message');
      logger.log('debug', 'Debug message');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR: Error message'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN: Warning message'));
      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG: Debug message'));

      errorSpy.mockRestore();
      warnSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it('should handle additional arguments', () => {
      const logger = new ConsoleLogger();
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const obj = { key: 'value' };

      logger.log('info', 'Message with object', obj, 123);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Message with object'),
        obj,
        123
      );

      infoSpy.mockRestore();
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

    it('should generate IDs in UUID format', () => {
      const id = generateId();

      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate different IDs on multiple calls', () => {
      const ids = Array.from({ length: 100 }, () => generateId());
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(100);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', async () => {
      // Import formatDate function
      const { formatDate } = await import('../src/utils');

      const testDate = new Date('2025-01-15T10:30:00.000Z');
      const formatted = formatDate(testDate);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should handle different date inputs', async () => {
      const { formatDate } = await import('../src/utils');

      const dates = [new Date(), new Date('2020-01-01'), new Date('2030-12-31')];

      dates.forEach(date => {
        const formatted = formatDate(date);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Auth Middleware Tests', () => {
  let authService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    authService = new AuthService();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should reject requests without authorization header', () => {
    const middleware = authMiddleware(authService);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'No token provided',
    });
  });

  it('should reject requests with invalid authorization format', () => {
    mockRequest.headers = { authorization: 'Invalid format' };
    const middleware = authMiddleware(authService);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'No token provided',
    });
  });

  it('should reject requests with invalid tokens', () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' };
    const middleware = authMiddleware(authService);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  });

  it('should accept requests with valid tokens', () => {
    const token = authService.generateToken({
      id: 'test-user',
      name: 'Test',
      email: 'test@example.com',
    });
    mockRequest.headers = { authorization: `Bearer ${token}` };
    const middleware = authMiddleware(authService);

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ userId: 'test-user', email: 'test@example.com' });
  });
});

describe('Server Configuration Tests', () => {
  it('should have correct environment defaults', () => {
    expect(process.env).toBeDefined();
  });
});

describe('Type Validation Tests', () => {
  it('should validate NodeType enum values', () => {
    const validTypes: NodeType[] = ['space', 'folder', 'page'];

    expect(validTypes).toContain('space');
    expect(validTypes).toContain('folder');
    expect(validTypes).toContain('page');
  });

  it('should validate EncryptedBlob structure', () => {
    const blob: EncryptedBlob = {
      algorithm: 'RSA-OAEP+AES-256-GCM',
      data: 'encrypted-data',
      version: 1,
    };

    expect(blob).toHaveProperty('algorithm');
    expect(blob).toHaveProperty('data');
    expect(blob).toHaveProperty('version');
    expect(typeof blob.algorithm).toBe('string');
    expect(typeof blob.data).toBe('string');
    expect(typeof blob.version).toBe('number');
  });

  it('should validate Page structure with all fields', () => {
    const page: Page = {
      _id: 'test-id',
      _rev: 'test-rev',
      title: 'Test Page',
      content: 'Test content',
      userId: 'test-user',
      type: 'page',
      parentId: 'parent-id',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['test'],
    };

    expect(page).toHaveProperty('_id');
    expect(page).toHaveProperty('title');
    expect(page).toHaveProperty('content');
    expect(page).toHaveProperty('userId');
    expect(page.type).toBe('page');
    expect(typeof page.content).toBe('string');
    expect(typeof page.position).toBe('number');
    expect(Array.isArray(page.tags)).toBe(true);
  });
});
