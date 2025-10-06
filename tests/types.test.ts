import { describe, expect, it } from 'vitest';
import type {
  ApiResponse,
  EncryptedBlob,
  JwtPayload,
  Logger,
  NodeType,
  Page,
  Plugin,
  PluginContext,
  SyncData,
  User,
  UserPublicKey,
} from '../src/types';

describe('Type Definitions and Interfaces', () => {
  describe('NodeType', () => {
    it('should accept valid node types', () => {
      const validTypes: NodeType[] = ['space', 'folder', 'page'];

      validTypes.forEach((type) => {
        expect(['space', 'folder', 'page']).toContain(type);
      });
    });

    it('should be used in type checking', () => {
      const nodeType: NodeType = 'page';
      expect(typeof nodeType).toBe('string');
      expect(nodeType).toBe('page');
    });
  });

  describe('Page Interface', () => {
    it('should validate complete page structure', () => {
      const page: Page = {
        _id: 'page123',
        _rev: '1-abc123',
        title: 'Test Page',
        content: 'Test content',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        tags: ['tag1', 'tag2'],
        userId: 'user123',
        type: 'page',
        parentId: 'folder123',
        position: 1,
        children: ['child1', 'child2'],
        isEncrypted: false,
      };

      expect(page._id).toBe('page123');
      expect(page.title).toBe('Test Page');
      expect(page.type).toBe('page');
      expect(page.tags).toEqual(['tag1', 'tag2']);
      expect(page.children).toEqual(['child1', 'child2']);
      expect(page.position).toBe(1);
      expect(page.isEncrypted).toBe(false);
    });

    it('should support encrypted page structure', () => {
      const encryptedPage: Page = {
        _id: 'page123',
        title: '', // Empty when encrypted
        content: '', // Empty when encrypted
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
        type: 'page',
        position: 0,
        isEncrypted: true,
        encryptedTitle: {
          algorithm: 'RSA-OAEP+AES-256-GCM',
          data: 'encrypted-title-data',
          version: 1,
        },
        encryptedContent: {
          algorithm: 'RSA-OAEP+AES-256-GCM',
          data: 'encrypted-content-data',
          version: 1,
        },
      };

      expect(encryptedPage.isEncrypted).toBe(true);
      expect(encryptedPage.encryptedTitle?.algorithm).toBe(
        'RSA-OAEP+AES-256-GCM'
      );
      expect(encryptedPage.encryptedContent?.data).toBe(
        'encrypted-content-data'
      );
    });

    it('should support different node types', () => {
      const space: Page = {
        _id: 'space123',
        title: 'My Workspace',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
        type: 'space',
        position: 0,
      };

      const folder: Page = {
        _id: 'folder123',
        title: 'My Folder',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
        type: 'folder',
        parentId: 'space123',
        position: 1,
      };

      expect(space.type).toBe('space');
      expect(folder.type).toBe('folder');
      expect(folder.parentId).toBe('space123');
    });
  });

  describe('User Interface', () => {
    it('should validate complete user structure', () => {
      const user: User = {
        _id: 'user123',
        _rev: '1-def456',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      expect(user._id).toBe('user123');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.passwordHash).toBe('hashed-password');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('EncryptedBlob Interface', () => {
    it('should validate encrypted blob structure', () => {
      const blob: EncryptedBlob = {
        algorithm: 'RSA-OAEP+AES-256-GCM',
        data: 'base64-encrypted-data',
        version: 1,
      };

      expect(blob.algorithm).toBe('RSA-OAEP+AES-256-GCM');
      expect(blob.data).toBe('base64-encrypted-data');
      expect(blob.version).toBe(1);
    });

    it('should support different encryption algorithms', () => {
      const rsaBlob: EncryptedBlob = {
        algorithm: 'RSA-OAEP',
        data: 'rsa-encrypted-data',
        version: 1,
      };

      const aesBlob: EncryptedBlob = {
        algorithm: 'AES-256-GCM',
        data: 'aes-encrypted-data',
        version: 1,
      };

      expect(rsaBlob.algorithm).toBe('RSA-OAEP');
      expect(aesBlob.algorithm).toBe('AES-256-GCM');
    });
  });

  describe('UserPublicKey Interface', () => {
    it('should validate public key data structure', () => {
      const keyData: UserPublicKey = {
        _id: 'key123',
        userId: 'user123',
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
        keyId: 'key123',
        algorithm: 'RSA-OAEP',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(keyData.userId).toBe('user123');
      expect(keyData.publicKey).toContain('MII');
      expect(keyData.keyId).toBe('key123');
      expect(keyData.algorithm).toBe('RSA-OAEP');
      expect(keyData.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('JwtPayload Interface', () => {
    it('should validate JWT payload structure', () => {
      const payload: JwtPayload = {
        userId: 'user123',
        email: 'john@example.com',
      };

      expect(payload.userId).toBe('user123');
      expect(payload.email).toBe('john@example.com');
    });
  });

  describe('ApiResponse Interface', () => {
    it('should validate successful API response', () => {
      const successResponse: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Operation successful' },
        message: 'Success',
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data?.message).toBe('Operation successful');
      expect(successResponse.message).toBe('Success');
    });

    it('should validate error API response', () => {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: 'Bad Request',
        message: 'Invalid input data',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Bad Request');
      expect(errorResponse.message).toBe('Invalid input data');
    });
  });

  describe('SyncData Interface', () => {
    it('should validate sync data structure', () => {
      const syncData: SyncData = {
        pages: [
          {
            _id: 'page1',
            title: 'Synced Page',
            content: 'Content',
            userId: 'user123',
            type: 'page',
            position: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        lastSync: new Date('2023-01-01T12:00:00Z'),
      };

      expect(Array.isArray(syncData.pages)).toBe(true);
      expect(syncData.pages).toHaveLength(1);
      expect(syncData.pages[0].title).toBe('Synced Page');
      expect(syncData.lastSync).toBeInstanceOf(Date);
    });
  });

  describe('Plugin Types', () => {
    it('should validate Plugin interface', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        enabled: true,
        initialize: () => {},
      };

      expect(plugin.name).toBe('test-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.enabled).toBe(true);
      expect(typeof plugin.initialize).toBe('function');
    });

    it('should validate PluginContext interface', () => {
      const mockApp = {} as any;
      const mockDatabase = {} as any;
      const mockAuth = {} as any;
      const mockLogger = {} as any;

      const context: PluginContext = {
        app: mockApp,
        database: mockDatabase,
        auth: mockAuth,
        logger: mockLogger,
      };

      expect(context.app).toBe(mockApp);
      expect(context.database).toBe(mockDatabase);
      expect(context.auth).toBe(mockAuth);
      expect(context.logger).toBe(mockLogger);
    });
  });

  describe('Logger Interface', () => {
    it('should validate Logger interface', () => {
      const mockLogger: Logger = {
        log: (level: string, message: string, ...args: any[]) => {
          console.log(`[${level}] ${message}`, ...args);
        },
      };

      expect(typeof mockLogger.log).toBe('function');

      // Test that the method can be called
      expect(() => {
        mockLogger.log('info', 'Test message', { extra: 'data' });
      }).not.toThrow();
    });
  });

  describe('Type Utility Functions', () => {
    it('should work with type guards', () => {
      function isPage(obj: any): obj is Page {
        return (
          obj && typeof obj._id === 'string' && typeof obj.title === 'string'
        );
      }

      const validPage = {
        _id: 'page123',
        title: 'Test Page',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
        type: 'page' as NodeType,
        position: 0,
      };

      const invalidPage = {
        id: 'page123', // Wrong field name
        title: 123, // Wrong type
      };

      expect(isPage(validPage)).toBe(true);
      expect(isPage(invalidPage)).toBe(false);
    });

    it('should work with generic types', () => {
      function createResponse<T>(data: T): ApiResponse<T> {
        return {
          success: true,
          data,
          message: 'Success',
        };
      }

      const pageResponse = createResponse<Page>({
        _id: 'page123',
        title: 'Test',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
        type: 'page',
        position: 0,
      });

      expect(pageResponse.success).toBe(true);
      expect(pageResponse.data?.title).toBe('Test');
    });
  });

  describe('Optional and Required Fields', () => {
    it('should handle optional fields correctly', () => {
      // Minimal page with only required fields
      const minimalPage: Page = {
        _id: 'page123',
        title: 'Test',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user123',
        type: 'page',
        position: 0,
      };

      expect(minimalPage._rev).toBeUndefined();
      expect(minimalPage.tags).toBeUndefined();
      expect(minimalPage.parentId).toBeUndefined();
    });

    it('should handle partial updates correctly', () => {
      const partialUpdate: Partial<Page> = {
        title: 'Updated Title',
        updatedAt: new Date(),
      };

      expect(partialUpdate.title).toBe('Updated Title');
      expect(partialUpdate.content).toBeUndefined();
    });
  });
});
