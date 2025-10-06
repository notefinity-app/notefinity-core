import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthUser, AuthService as IAuthService, JwtPayload } from '../types';

export class AuthService implements IAuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret =
      process.env.JWT_SECRET || 'fallback-secret-for-development-only';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // Warn if using fallback secret in production
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.warn(
        'WARNING: Using fallback JWT secret in production. Please set JWT_SECRET environment variable.'
      );
    }
  }

  generateToken(user: AuthUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'notefinity-core',
      audience: 'notefinity-client',
    } as SignOptions);
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'notefinity-core',
        audience: 'notefinity-client',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      // Token is invalid, expired, or malformed
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7); // Remove 'Bearer ' prefix
  }
}
