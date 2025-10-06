import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authRoutes } from '../src/routes/auth';
import { AuthService } from '../src/services/auth-service';
import { DatabaseService } from '../src/services/database-service';
import { Logger } from '../src/services/logger';

describe('Auth Routes', () => {
  let app: express.Application;
  let mockAuthService: Partial<AuthService>;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockLogger: Partial<Logger>;

  beforeEach(() => {
    // Create mock services
    mockAuthService = {
      hashPassword: vi.fn(),
      generateToken: vi.fn(),
      comparePassword: vi.fn(),
    };

    mockDatabaseService = {
      getUserByEmail: vi.fn(),
      createUser: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
    };

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use(
      '/auth',
      authRoutes(
        mockAuthService as AuthService,
        mockDatabaseService as DatabaseService,
        mockLogger as Logger
      )
    );

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      // Setup mocks
      (mockDatabaseService.getUserByEmail as any).mockResolvedValue(null);
      (mockAuthService.hashPassword as any).mockResolvedValue(
        'hashed-password'
      );
      (mockDatabaseService.createUser as any).mockResolvedValue({
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      });
      (mockAuthService.generateToken as any).mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
          },
          token: 'jwt-token',
        },
        message: 'User registered successfully',
      });

      expect(mockDatabaseService.getUserByEmail).toHaveBeenCalledWith(
        'john@example.com'
      );
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockDatabaseService.createUser).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      });
    });

    it('should return validation error for invalid input', async () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'invalid-email',
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return validation error for missing fields', async () => {
      const response = await request(app).post('/auth/register').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return conflict error if user already exists', async () => {
      (mockDatabaseService.getUserByEmail as any).mockResolvedValue({
        _id: 'existing-user',
        email: 'john@example.com',
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        error: 'Conflict',
        message: 'User already exists with this email',
      });
    });

    it('should handle database errors gracefully', async () => {
      (mockDatabaseService.getUserByEmail as any).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal Server Error');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Registration error:',
        expect.any(Error)
      );
    });

    it('should handle password hashing errors', async () => {
      (mockDatabaseService.getUserByEmail as any).mockResolvedValue(null);
      (mockAuthService.hashPassword as any).mockRejectedValue(
        new Error('Hashing error')
      );

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      (mockDatabaseService.getUserByEmail as any).mockResolvedValue(mockUser);
      (mockAuthService.comparePassword as any).mockResolvedValue(true);
      (mockAuthService.generateToken as any).mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
          },
          token: 'jwt-token',
        },
        message: 'Login successful',
      });

      expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
    });

    it('should return validation error for invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app).post('/auth/login').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return validation error for missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' }); // Missing password

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return unauthorized for non-existent user', async () => {
      (mockDatabaseService.getUserByEmail as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('should return unauthorized for wrong password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      (mockDatabaseService.getUserByEmail as any).mockResolvedValue(mockUser);
      (mockAuthService.comparePassword as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('should handle database errors gracefully', async () => {
      (mockDatabaseService.getUserByEmail as any).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(mockLogger.log).toHaveBeenCalledWith(
        'error',
        'Login error:',
        expect.any(Error)
      );
    });

    it('should handle password comparison errors', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      (mockDatabaseService.getUserByEmail as any).mockResolvedValue(mockUser);
      (mockAuthService.comparePassword as any).mockRejectedValue(
        new Error('Comparison error')
      );

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
