import { promises as fs } from 'fs';
import path from 'path';
import { Plugin, PluginContext } from '../types';

export class PluginManager {
  private context: PluginContext;
  private loadedPlugins: Map<string, Plugin> = new Map();

  constructor(context: PluginContext) {
    this.context = context;
  }

  async loadPlugins(): Promise<void> {
    try {
      const pluginsDir = path.join(process.cwd(), 'plugins');

      // Check if plugins directory exists
      try {
        await fs.access(pluginsDir);
      } catch {
        // Plugins directory doesn't exist, create it
        await fs.mkdir(pluginsDir, { recursive: true });
        this.context.logger.log(
          'info',
          'Created plugins directory at:',
          pluginsDir
        );

        // Create a sample plugin file for demonstration
        await this.createSamplePlugin(pluginsDir);
        return;
      }

      // Load plugins from directory
      const files = await fs.readdir(pluginsDir);
      const pluginFiles = files.filter(
        (file) => file.endsWith('.js') || file.endsWith('.ts')
      );

      for (const file of pluginFiles) {
        try {
          await this.loadPlugin(path.join(pluginsDir, file));
        } catch (error) {
          this.context.logger.log(
            'error',
            `Failed to load plugin ${file}:`,
            error
          );
        }
      }

      this.context.logger.log(
        'info',
        `Loaded ${this.loadedPlugins.size} plugins`
      );
    } catch (error) {
      this.context.logger.log('error', 'Failed to load plugins:', error);
    }
  }

  private async loadPlugin(pluginPath: string): Promise<void> {
    try {
      // Dynamically import the plugin
      const pluginModule = await import(pluginPath);
      const plugin: Plugin = pluginModule.default || pluginModule;

      if (!this.isValidPlugin(plugin)) {
        throw new Error('Invalid plugin structure');
      }

      // Check if plugin is enabled
      if (!plugin.enabled) {
        this.context.logger.log(
          'info',
          `Plugin ${plugin.name} is disabled, skipping`
        );
        return;
      }

      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize(this.context);
      }

      // Register plugin routes
      if (plugin.routes) {
        for (const route of plugin.routes) {
          const middleware = route.middleware || [];

          switch (route.method) {
            case 'GET':
              this.context.app.get(route.path, ...middleware, route.handler);
              break;
            case 'POST':
              this.context.app.post(route.path, ...middleware, route.handler);
              break;
            case 'PUT':
              this.context.app.put(route.path, ...middleware, route.handler);
              break;
            case 'DELETE':
              this.context.app.delete(route.path, ...middleware, route.handler);
              break;
            case 'PATCH':
              this.context.app.patch(route.path, ...middleware, route.handler);
              break;
          }

          this.context.logger.log(
            'info',
            `Registered plugin route: ${route.method} ${route.path}`
          );
        }
      }

      // Register plugin middleware
      if (plugin.middleware) {
        for (const middleware of plugin.middleware) {
          this.context.app.use(middleware.handler);
          this.context.logger.log(
            'info',
            `Registered plugin middleware: ${middleware.name}`
          );
        }
      }

      this.loadedPlugins.set(plugin.name, plugin);
      this.context.logger.log(
        'info',
        `Successfully loaded plugin: ${plugin.name} v${plugin.version}`
      );
    } catch (error) {
      throw new Error(`Failed to load plugin from ${pluginPath}: ${error}`);
    }
  }

  private isValidPlugin(plugin: any): plugin is Plugin {
    return (
      typeof plugin === 'object' &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.enabled === 'boolean'
    );
  }

  private async createSamplePlugin(pluginsDir: string): Promise<void> {
    const samplePluginContent = `// Sample Notefinity Plugin
// This demonstrates how premium features can be added through the plugin system

const plugin = {
  name: 'sample-plugin',
  version: '1.0.0',
  enabled: false, // Set to true to enable this sample plugin

  async initialize(context) {
    context.logger.log('info', 'Sample plugin initialized');
    
    // Here you can access:
    // - context.app (Express app)
    // - context.database (Database service)
    // - context.auth (Auth service)
    // - context.logger (Logger)
  },

  routes: [
    {
      method: 'GET',
      path: '/api/premium/sample',
      handler: (req, res) => {
        res.json({
          success: true,
          message: 'This is a sample premium feature',
          features: ['Advanced analytics', 'Export functionality', 'Team collaboration']
        });
      },
      middleware: [] // Add auth middleware here if needed
    }
  ],

  middleware: [
    {
      name: 'sample-middleware',
      handler: (req, res, next) => {
        // Add custom headers or modify requests
        res.setHeader('X-Plugin-Sample', 'active');
        next();
      }
    }
  ]
};

module.exports = plugin;
`;

    const samplePluginPath = path.join(pluginsDir, 'sample-plugin.js');
    await fs.writeFile(samplePluginPath, samplePluginContent);

    const readmePath = path.join(pluginsDir, 'README.md');
    const readmeContent = `# Notefinity Plugins

This directory contains plugins for extending Notefinity functionality.

## Creating Plugins

Plugins should export an object with the following structure:

\`\`\`javascript
{
  name: 'plugin-name',
  version: '1.0.0',
  enabled: true,
  
  // Optional: initialization function
  initialize: async (context) => {
    // Setup code here
  },
  
  // Optional: API routes
  routes: [
    {
      method: 'GET',
      path: '/api/plugin/route',
      handler: (req, res) => { /* route handler */ },
      middleware: [] // optional middleware array
    }
  ],
  
  // Optional: middleware functions
  middleware: [
    {
      name: 'middleware-name',
      handler: (req, res, next) => { /* middleware logic */ }
    }
  ]
}
\`\`\`

## Plugin Context

The \`context\` object passed to plugins contains:
- \`app\`: Express application instance
- \`database\`: Database service for data operations
- \`auth\`: Authentication service
- \`logger\`: Logging service

## Security Notice

This plugin system demonstrates that the core system cannot access user data
without explicit implementation. Premium features are added through plugins
that operate on the same transparent, auditable codebase.
`;

    await fs.writeFile(readmePath, readmeContent);
    this.context.logger.log(
      'info',
      'Created sample plugin and documentation in plugins directory'
    );
  }

  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  getPlugin(name: string): Plugin | undefined {
    return this.loadedPlugins.get(name);
  }
}
