import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicKeyRoutes } from '../src/routes/encryption';

describe('Encryption Routes', () => {
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
      getUserPublicKey: vi.fn(),
      storeUserPublicKey: vi.fn(),
      updateUserPublicKey: vi.fn(),
    };

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = { userId: 'user123' };
      next();
    });

    app.use('/keys', publicKeyRoutes(mockDatabaseService, mockLogger));

    vi.clearAllMocks();
  });

  describe('POST /store-public-key', () => {
    const validKeyData = {
      publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890',
      keyId: 'key123',
      algorithm: 'RSA-OAEP-256',
    };

    it('should store new public key successfully', async () => {
      const mockKeystore = {
        keyId: 'key123',
        algorithm: 'RSA-OAEP-256',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDatabaseService.getUserPublicKey.mockResolvedValue(null);
      mockDatabaseService.storeUserPublicKey.mockResolvedValue(mockKeystore);

      const response = await request(app).post('/keys/store-public-key').send(validKeyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.keystore.keyId).toBe('key123');
      expect(response.body.message).toBe('Public key stored successfully');
      expect(mockDatabaseService.storeUserPublicKey).toHaveBeenCalledWith({
        userId: 'user123',
        ...validKeyData,
      });
      expect(mockLogger.log).toHaveBeenCalledWith('info', 'Stored public key for user user123');
    });

    it('should update existing public key successfully', async () => {
      const existingKeystore = { keyId: 'oldkey' };
      const updatedKeystore = {
        keyId: 'key123',
        algorithm: 'RSA-OAEP-256',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDatabaseService.getUserPublicKey.mockResolvedValue(existingKeystore);
      mockDatabaseService.updateUserPublicKey.mockResolvedValue(updatedKeystore);

      const response = await request(app).post('/keys/store-public-key').send(validKeyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.keystore.keyId).toBe('key123');
      expect(response.body.message).toBe('Public key updated successfully');
      expect(mockDatabaseService.updateUserPublicKey).toHaveBeenCalledWith('user123', validKeyData);
      expect(mockLogger.log).toHaveBeenCalledWith('info', 'Updated public key for user user123');
    });

    it('should return validation error for invalid public key', async () => {
      const invalidData = {
        publicKey: 'short', // Too short
        keyId: 'key123',
        algorithm: 'RSA-OAEP-256',
      };

      const response = await request(app).post('/keys/store-public-key').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('publicKey');
    });

    it('should return validation error for missing keyId', async () => {
      const invalidData = {
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890',
        algorithm: 'RSA-OAEP-256',
      };

      const response = await request(app).post('/keys/store-public-key').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('keyId');
    });

    it('should return validation error for missing algorithm', async () => {
      const invalidData = {
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890',
        keyId: 'key123',
      };

      const response = await request(app).post('/keys/store-public-key').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('algorithm');
    });

    it('should handle database errors during storage', async () => {
      mockDatabaseService.getUserPublicKey.mockResolvedValue(null);
      mockDatabaseService.storeUserPublicKey.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/keys/store-public-key').send(validKeyData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to store public key');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Store public key error:',
        expect.any(Error)
      );
    });

    it('should handle database errors during update', async () => {
      const existingKeystore = { keyId: 'oldkey' };
      mockDatabaseService.getUserPublicKey.mockResolvedValue(existingKeystore);
      mockDatabaseService.updateUserPublicKey.mockRejectedValue(new Error('Update failed'));

      const response = await request(app).post('/keys/store-public-key').send(validKeyData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to store public key');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Store public key error:',
        expect.any(Error)
      );
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/keys', publicKeyRoutes(mockDatabaseService, mockLogger));

      const response = await request(appNoAuth).post('/keys/store-public-key').send(validKeyData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('GET /public-key/:userId', () => {
    it('should get public key successfully', async () => {
      const mockKeystore = {
        keyId: 'key123',
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890',
        algorithm: 'RSA-OAEP-256',
        createdAt: new Date().toISOString(),
      };

      mockDatabaseService.getUserPublicKey.mockResolvedValue(mockKeystore);

      const response = await request(app).get('/keys/public-key/user456');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.publicKey).toBe(mockKeystore.publicKey);
      expect(response.body.data.keyId).toBe('key123');
      expect(response.body.data.algorithm).toBe('RSA-OAEP-256');
      expect(mockDatabaseService.getUserPublicKey).toHaveBeenCalledWith('user456');
    });

    it('should return 404 when user has no public key', async () => {
      mockDatabaseService.getUserPublicKey.mockResolvedValue(null);

      const response = await request(app).get('/keys/public-key/user456');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Public key not found for this user');
    });

    it('should handle database errors during retrieval', async () => {
      mockDatabaseService.getUserPublicKey.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/keys/public-key/user456');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to retrieve public key');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Get public key error:',
        expect.any(Error)
      );
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/keys', publicKeyRoutes(mockDatabaseService, mockLogger));

      const response = await request(appNoAuth).get('/keys/public-key/user456');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Authentication required');
    });
  });
});
