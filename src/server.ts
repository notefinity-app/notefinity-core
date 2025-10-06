import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { publicKeyRoutes } from './routes/encryption';
import { pagesRoutes } from './routes/pages';
import { syncRoutes } from './routes/sync';
import { AuthService } from './services/auth-service';
import { DatabaseService } from './services/database-service';
import { Logger } from './services/logger';
import { PluginManager } from './services/plugin-manager';

export class NotefinityServer {
  private app: express.Application;
  private logger: Logger;
  private authService: AuthService;
  private databaseService: DatabaseService;
  private pluginManager: PluginManager;

  constructor() {
    this.app = express();
    this.logger = new Logger();
    this.authService = new AuthService();
    this.databaseService = new DatabaseService();
    this.pluginManager = new PluginManager({
      app: this.app,
      database: this.databaseService,
      auth: this.authService,
      logger: this.logger,
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.log('info', `${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Serve static client files
    const clientDistPath = path.join(__dirname, '..', 'client-dist');
    this.app.use(express.static(clientDistPath));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Notefinity Core API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API routes
    this.app.use(
      '/api/auth',
      authRoutes(this.authService, this.databaseService, this.logger)
    );
    this.app.use(
      '/api/pages',
      authMiddleware(this.authService),
      pagesRoutes(this.databaseService, this.logger)
    );
    this.app.use(
      '/api/sync',
      authMiddleware(this.authService),
      syncRoutes(this.databaseService, this.logger)
    );
    this.app.use(
      '/api/keys',
      authMiddleware(this.authService),
      publicKeyRoutes(this.databaseService, this.logger)
    );

    // Plugin routes will be added here by the plugin manager
    this.pluginManager.loadPlugins();
  }

  private setupErrorHandling(): void {
    // API 404 handler for /api/* routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });

    // SPA fallback handler (only for GET requests to non-API routes)
    this.app.get('*', (req, res) => {
      const clientDistPath = path.join(__dirname, '..', 'client-dist');
      const indexPath = path.join(clientDistPath, 'index.html');

      // Check if client-dist exists and serve SPA, otherwise return 404
      if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Route ${req.method} ${req.originalUrl} not found`,
        });
      }
    });

    // 404 handler for non-GET requests to non-API routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });

    // Global error handler
    this.app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        this.logger.log('error', 'Unhandled error:', err);

        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message:
            process.env.NODE_ENV === 'development'
              ? err.message
              : 'Something went wrong',
        });
      }
    );
  }

  public async start(port: number = 3001): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.initialize();

      this.app.listen(port, () => {
        this.logger.log(
          'info',
          `Notefinity Core API server running on port ${port}`
        );
        this.logger.log(
          'info',
          `Health check available at: http://localhost:${port}/health`
        );
        this.logger.log(
          'info',
          `Environment: ${process.env.NODE_ENV || 'development'}`
        );
      });
    } catch (error) {
      this.logger.log('error', 'Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new NotefinityServer();
  const port = parseInt(process.env.PORT || '3001');
  server.start(port);
}
