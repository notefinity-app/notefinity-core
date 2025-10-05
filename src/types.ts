// Core types and interfaces for Notefinity
export type NodeType = 'space' | 'folder' | 'page';

export interface Page {
  _id: string;
  _rev?: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  userId: string;
  // Tree structure fields
  type: NodeType;
  parentId?: string; // null/undefined for root nodes (spaces)
  position: number; // Order within parent
  children?: string[]; // Array of child node IDs
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
  createPage(page: Omit<Page, '_id' | '_rev' | 'createdAt' | 'updatedAt'>): Promise<Page>;
  getPageById(id: string, userId: string): Promise<Page | null>;
  getPagesByUser(userId: string): Promise<Page[]>;
  updatePage(id: string, userId: string, updates: Partial<Page>): Promise<Page>;
  deletePage(id: string, userId: string): Promise<boolean>;
  // Tree operations
  getSpacesByUser(userId: string): Promise<Page[]>;
  getChildNodes(parentId: string, userId: string): Promise<Page[]>;
  moveNode(
    nodeId: string,
    newParentId: string | undefined,
    newPosition: number,
    userId: string
  ): Promise<Page>;
  getNodePath(nodeId: string, userId: string): Promise<Page[]>;
  // User operations
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
  pages: Page[];
  lastSync: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
