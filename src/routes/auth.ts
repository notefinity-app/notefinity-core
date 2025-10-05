import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { AuthService } from '../services/auth-service';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { RegisterData, LoginCredentials, ApiResponse, AuthUser } from '../types';

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export function authRoutes(
  authService: AuthService, 
  databaseService: DatabaseService, 
  logger: Logger
): Router {
  const router = Router();

  // Register endpoint
  router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message
        } as ApiResponse);
        return;
      }

      const { name, email, password }: RegisterData = value;

      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'User already exists with this email'
        } as ApiResponse);
        return;
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Create user
      const user = await databaseService.createUser({
        name,
        email,
        passwordHash
      });

      // Generate token
      const authUser: AuthUser = {
        id: user._id,
        name: user.name,
        email: user.email
      };
      const token = authService.generateToken(authUser);

      logger.log('info', `New user registered: ${email}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          token
        },
        message: 'User registered successfully'
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to register user'
      } as ApiResponse);
    }
  });

  // Login endpoint
  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message
        } as ApiResponse);
        return;
      }

      const { email, password }: LoginCredentials = value;

      // Get user by email
      const user = await databaseService.getUserByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        } as ApiResponse);
        return;
      }

      // Verify password
      const isValidPassword = await authService.comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        } as ApiResponse);
        return;
      }

      // Generate token
      const authUser: AuthUser = {
        id: user._id,
        name: user.name,
        email: user.email
      };
      const token = authService.generateToken(authUser);

      logger.log('info', `User logged in: ${email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          token
        },
        message: 'Login successful'
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to login'
      } as ApiResponse);
    }
  });

  // Get current user profile
  router.get('/profile', async (req: Request, res: Response): Promise<void> => {
    try {
      // This route would typically be protected by auth middleware
      // For demonstration, we'll extract token manually here
      const authService_instance = authService;
      const token = authService_instance.extractTokenFromHeader(req.headers.authorization);
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'No token provided'
        } as ApiResponse);
        return;
      }

      const decoded = authService_instance.verifyToken(token);
      if (!decoded) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token'
        } as ApiResponse);
        return;
      }

      const user = await databaseService.getUserById(decoded.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        }
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get profile'
      } as ApiResponse);
    }
  });

  return router;
}