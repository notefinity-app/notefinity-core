import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth-service';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware for protecting routes with JWT tokens.
 *
 * Development Mode:
 * When NODE_ENV=development and SKIP_AUTH=true, bypasses authentication
 * and sets a default development user (dev-user-123) for easier testing.
 *
 * Production Mode:
 * Validates JWT tokens and extracts user information from the token payload.
 *
 * @param authService - Service for token validation and extraction
 * @returns Express middleware function
 */
export function authMiddleware(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip authentication in development mode for easier API testing
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.SKIP_AUTH === 'true'
    ) {
      // Set a default user for development
      req.user = {
        userId: 'dev-user-123',
        email: 'dev@example.com',
      };
      next();
      return;
    }

    const token = authService.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  };
}
