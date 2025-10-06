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
  // End-to-end encryption fields
  isEncrypted?: boolean; // Whether the content is encrypted
  encryptedContent?: EncryptedBlob; // Encrypted content data (when isEncrypted is true)
  encryptedTitle?: EncryptedBlob; // Encrypted title data (when isEncrypted is true)
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
  createPage(
    page: Omit<Page, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<Page>;
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
  createUser(
    user: Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  // Public key registry operations (optional for collaboration)
  storeUserPublicKey(
    keyData: Omit<UserPublicKey, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<UserPublicKey>;
  getUserPublicKey(userId: string): Promise<UserPublicKey | null>;
  updateUserPublicKey(
    userId: string,
    updates: Partial<UserPublicKey>
  ): Promise<UserPublicKey>;
  deleteUserPublicKey(userId: string): Promise<boolean>;
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

// End-to-end encryption types
export interface EncryptedBlob {
  algorithm: string; // e.g., "RSA-OAEP+AES-256-GCM"
  data: string; // Base64 encoded encrypted data (whatever the client sends)
  keyHint?: string; // Optional hint about which key was used
  version: number; // Version of encryption format for future compatibility
}

export interface UserPublicKey {
  _id: string;
  _rev?: string;
  userId: string;
  publicKey: string; // User's public key (client-defined format)
  keyId: string; // Client-defined unique identifier for the key
  algorithm: string; // Encryption algorithm this key supports
  createdAt: Date;
  updatedAt: Date;
}
