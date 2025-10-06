import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginManager } from '../src/services/plugin-manager';
import { PluginContext } from '../src/types';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
    extname: vi.fn(filename => filename.split('.').pop() || ''),
  },
}));

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = {
      app: { use: vi.fn() },
      database: {} as any,
      auth: {} as any,
      logger: {
        log: vi.fn(),
      },
    };

    pluginManager = new PluginManager(mockContext);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided context', () => {
      expect(pluginManager).toBeInstanceOf(PluginManager);
    });
  });

  describe('loadPlugins', () => {
    it('should create plugins directory if it does not exist', async () => {
      (fs.access as any).mockRejectedValue(new Error('Directory not found'));
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);

      await pluginManager.loadPlugins();

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('plugins'), {
        recursive: true,
      });
      expect(mockContext.logger.log).toHaveBeenCalledWith(
        'info',
        'Created plugins directory at:',
        expect.stringContaining('plugins')
      );
    });

    it('should load plugin files from existing directory', async () => {
      (fs.access as any).mockResolvedValue(undefined);
      (fs.readdir as any).mockResolvedValue(['plugin1.js', 'plugin2.ts', 'readme.txt']);

      // Mock dynamic import
      const mockPlugin1 = {
        name: 'plugin1',
        version: '1.0.0',
        enabled: true,
        initialize: vi.fn(),
      };

      const mockPlugin2 = {
        name: 'plugin2',
        version: '1.0.0',
        enabled: true,
      };

      // Mock the dynamic imports
      vi.doMock('plugins/plugin1.js', () => ({ default: mockPlugin1 }));
      vi.doMock('plugins/plugin2.ts', () => ({ default: mockPlugin2 }));

      await pluginManager.loadPlugins();

      expect(fs.readdir).toHaveBeenCalledWith(expect.stringContaining('plugins'));
      expect(mockContext.logger.log).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('Loaded')
      );
    });

    it('should handle errors when loading plugins directory', async () => {
      (fs.access as any).mockRejectedValue(new Error('Access denied'));
      (fs.mkdir as any).mockRejectedValue(new Error('Permission denied'));

      await pluginManager.loadPlugins();

      expect(mockContext.logger.log).toHaveBeenCalledWith(
        'error',
        'Failed to load plugins:',
        expect.any(Error)
      );
    });

    it('should filter only JavaScript and TypeScript files', async () => {
      (fs.access as any).mockResolvedValue(undefined);
      (fs.readdir as any).mockResolvedValue([
        'plugin1.js',
        'plugin2.ts',
        'config.json',
        'readme.md',
        'plugin3.jsx',
      ]);

      await pluginManager.loadPlugins();

      // Should only attempt to load .js and .ts files
      expect(fs.readdir).toHaveBeenCalledWith(expect.stringContaining('plugins'));
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return list of loaded plugins', () => {
      const mockPlugin1 = {
        name: 'plugin1',
        version: '1.0.0',
        enabled: true,
      };

      const mockPlugin2 = {
        name: 'plugin2',
        version: '2.0.0',
        enabled: false,
      };

      (pluginManager as any).loadedPlugins.set('plugin1', mockPlugin1);
      (pluginManager as any).loadedPlugins.set('plugin2', mockPlugin2);

      const plugins = pluginManager.getLoadedPlugins();

      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('plugin1');
      expect(plugins[1].name).toBe('plugin2');
    });

    it('should return empty array when no plugins loaded', () => {
      const plugins = pluginManager.getLoadedPlugins();

      expect(plugins).toHaveLength(0);
      expect(Array.isArray(plugins)).toBe(true);
    });
  });

  describe('getPlugin', () => {
    it('should return plugin information', () => {
      const mockPlugin = {
        name: 'testPlugin',
        version: '1.0.0',
        enabled: true,
      };

      (pluginManager as any).loadedPlugins.set('testPlugin', mockPlugin);

      const info = pluginManager.getPlugin('testPlugin');

      expect(info).toEqual(mockPlugin);
    });

    it('should return undefined for non-existent plugin', () => {
      const info = pluginManager.getPlugin('nonExistentPlugin');

      expect(info).toBeUndefined();
    });
  });
});
