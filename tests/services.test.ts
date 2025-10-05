import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/services/auth-service';
import { Logger } from '../src/services/logger';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should hash and compare passwords correctly', async () => {
    const password = 'testpassword123';
    const hash = await authService.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isValid = await authService.comparePassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await authService.comparePassword('wrongpassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate and verify JWT tokens', () => {
    const user = {
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
    };

    const token = authService.generateToken(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = authService.verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded!.userId).toBe(user.id);
    expect(decoded!.email).toBe(user.email);
  });

  it('should reject invalid tokens', () => {
    const decoded = authService.verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });

  it('should extract tokens from authorization headers', () => {
    const token = 'sample-token';
    const authHeader = `Bearer ${token}`;

    const extracted = authService.extractTokenFromHeader(authHeader);
    expect(extracted).toBe(token);

    const noBearer = authService.extractTokenFromHeader('sample-token');
    expect(noBearer).toBeNull();

    const empty = authService.extractTokenFromHeader('');
    expect(empty).toBeNull();

    const undefined_header = authService.extractTokenFromHeader(undefined);
    expect(undefined_header).toBeNull();
  });
});

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new Logger();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log messages with different levels', () => {
    logger.log('info', 'Test message');
    expect(consoleSpy).toHaveBeenCalled();

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    expect(consoleSpy).toHaveBeenCalledTimes(5);
  });
});
