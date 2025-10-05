// Core types and interfaces for Notefinity
export interface Note {
  _id: string;
  _rev?: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  userId: string;
}

export interface User {
  _id: string;
  _rev?: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  initialize?: (context: PluginContext) => void | Promise<void>;
  routes?: PluginRoute[];
  middleware?: PluginMiddleware[];
}

export interface PluginContext {
  app: any; // Express app
  database: DatabaseService;
  auth: AuthService;
  logger: Logger;
}

export interface PluginRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: (req: any, res: any, next: any) => void | Promise<void>;
  middleware?: any[];
}

export interface PluginMiddleware {
  name: string;
  handler: (req: any, res: any, next: any) => void | Promise<void>;
  priority?: number;
}

export interface DatabaseService {
  createNote(note: Omit<Note, '_id' | '_rev' | 'createdAt' | 'updatedAt'>): Promise<Note>;
  getNoteById(id: string, userId: string): Promise<Note | null>;
  getNotesByUser(userId: string): Promise<Note[]>;
  updateNote(id: string, userId: string, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: string, userId: string): Promise<boolean>;
  createUser(user: Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
}

export interface AuthService {
  generateToken(user: AuthUser): string;
  verifyToken(token: string): JwtPayload | null;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: LogLevel, message: string, ...args: any[]): void;
}

export interface SyncData {
  notes: Note[];
  lastSync: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
