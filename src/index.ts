// Core exports
export * from './note-manager';
export * from './types';
export * from './utils';

// Server and services
export { NotefinityServer } from './server';
export { AuthService } from './services/auth-service';
export { DatabaseService } from './services/database-service';
export { Logger } from './services/logger';
export { PluginManager } from './services/plugin-manager';

// Middleware
export { authMiddleware } from './middleware/auth';

// Routes
export { authRoutes } from './routes/auth';
export { notesRoutes } from './routes/notes';
export { syncRoutes } from './routes/sync';
