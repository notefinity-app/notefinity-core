import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { ApiResponse } from '../types';

const createPageSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  content: Joi.string().allow('').max(1000000), // Allow empty content, max 1MB
  tags: Joi.array().items(Joi.string().max(50)).max(20), // Max 20 tags, 50 chars each
  type: Joi.string().valid('space', 'folder', 'page').default('page'),
  parentId: Joi.string().allow(null),
  position: Joi.number().integer().min(0).default(0),
});

const updatePageSchema = Joi.object({
  title: Joi.string().min(1).max(500),
  content: Joi.string().allow('').max(1000000),
  tags: Joi.array().items(Joi.string().max(50)).max(20),
  parentId: Joi.string().allow(null),
  position: Joi.number().integer().min(0),
}).min(1); // At least one field required

export function pagesRoutes(databaseService: DatabaseService, logger: Logger): Router {
  const router = Router();

  // Get all pages for the authenticated user
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const pages = await databaseService.getPagesByUser(req.user.userId);

      res.json({
        success: true,
        data: {
          pages: pages.map(page => ({
            id: page._id,
            title: page.title,
            content: page.content,
            tags: page.tags || [],
            type: page.type,
            parentId: page.parentId,
            position: page.position,
            children: page.children || [],
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
          })),
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get pages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve pages',
      } as ApiResponse);
    }
  });

  // Get spaces (root nodes) for the user
  router.get('/spaces', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const spaces = await databaseService.getSpacesByUser(req.user.userId);

      res.json({
        success: true,
        data: {
          spaces: spaces.map(space => ({
            id: space._id,
            title: space.title,
            content: space.content,
            tags: space.tags || [],
            type: space.type,
            parentId: space.parentId,
            position: space.position,
            children: space.children || [],
            createdAt: space.createdAt,
            updatedAt: space.updatedAt,
          })),
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get spaces error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve spaces',
      } as ApiResponse);
    }
  });

  // Get a specific page
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const page = await databaseService.getPageById(req.params.id, req.user.userId);

      if (!page) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Page not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          page: {
            id: page._id,
            title: page.title,
            content: page.content,
            tags: page.tags || [],
            type: page.type,
            parentId: page.parentId,
            position: page.position,
            children: page.children || [],
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
          },
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get page error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve page',
      } as ApiResponse);
    }
  });

  // Create a new page
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      // Validate input
      const { error, value } = createPageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        } as ApiResponse);
        return;
      }

      const pageData = {
        ...value,
        userId: req.user.userId,
      };

      const page = await databaseService.createPage(pageData);

      logger.log('info', `Page created by user ${req.user.userId}: ${page._id}`);

      res.status(201).json({
        success: true,
        data: {
          page: {
            id: page._id,
            title: page.title,
            content: page.content,
            tags: page.tags || [],
            type: page.type,
            parentId: page.parentId,
            position: page.position,
            children: page.children || [],
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
          },
        },
        message: 'Page created successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Create page error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create page',
      } as ApiResponse);
    }
  });

  // Update a page
  router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      // Validate input
      const { error, value } = updatePageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        } as ApiResponse);
        return;
      }

      const updatedPage = await databaseService.updatePage(req.params.id, req.user.userId, value);

      logger.log('info', `Page updated by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        data: {
          page: {
            id: updatedPage._id,
            title: updatedPage.title,
            content: updatedPage.content,
            tags: updatedPage.tags || [],
            type: updatedPage.type,
            parentId: updatedPage.parentId,
            position: updatedPage.position,
            children: updatedPage.children || [],
            createdAt: updatedPage.createdAt,
            updatedAt: updatedPage.updatedAt,
          },
        },
        message: 'Page updated successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Update page error:', error);

      if (error instanceof Error && error.message === 'Page not found or access denied') {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Page not found',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update page',
        } as ApiResponse);
      }
    }
  });

  // Delete a page
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const deleted = await databaseService.deletePage(req.params.id, req.user.userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Page not found',
        } as ApiResponse);
        return;
      }

      logger.log('info', `Page deleted by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Page deleted successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Delete page error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete page',
      } as ApiResponse);
    }
  });

  // Get child nodes of a parent
  router.get('/:id/children', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const children = await databaseService.getChildNodes(req.params.id, req.user.userId);

      res.json({
        success: true,
        data: {
          children: children.map(child => ({
            id: child._id,
            title: child.title,
            content: child.content,
            tags: child.tags || [],
            type: child.type,
            parentId: child.parentId,
            position: child.position,
            children: child.children || [],
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
          })),
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get children error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve child nodes',
      } as ApiResponse);
    }
  });

  // Move a node to a new parent/position
  router.patch('/:id/move', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const moveSchema = Joi.object({
        parentId: Joi.string().allow(null),
        position: Joi.number().integer().min(0).required(),
      });

      const { error, value } = moveSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        } as ApiResponse);
        return;
      }

      const movedNote = await databaseService.moveNode(
        req.params.id,
        value.parentId,
        value.position,
        req.user.userId
      );

      logger.log('info', `Node moved by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        data: {
          page: {
            id: movedNote._id,
            title: movedNote.title,
            content: movedNote.content,
            tags: movedNote.tags || [],
            type: movedNote.type,
            parentId: movedNote.parentId,
            position: movedNote.position,
            children: movedNote.children || [],
            createdAt: movedNote.createdAt,
            updatedAt: movedNote.updatedAt,
          },
        },
        message: 'Node moved successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Move node error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to move node',
      } as ApiResponse);
    }
  });

  // Get path from root to a specific node
  router.get('/:id/path', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const path = await databaseService.getNodePath(req.params.id, req.user.userId);

      if (path.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Node not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          path: path.map(node => ({
            id: node._id,
            title: node.title,
            content: node.content,
            tags: node.tags || [],
            type: node.type,
            parentId: node.parentId,
            position: node.position,
            children: node.children || [],
            createdAt: node.createdAt,
            updatedAt: node.updatedAt,
          })),
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get path error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve node path',
      } as ApiResponse);
    }
  });

  return router;
}
