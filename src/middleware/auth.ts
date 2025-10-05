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

export function authMiddleware(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
