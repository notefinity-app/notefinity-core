import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { ApiResponse } from '../types';

const createNoteSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  content: Joi.string().allow('').max(1000000), // Allow empty content, max 1MB
  tags: Joi.array().items(Joi.string().max(50)).max(20), // Max 20 tags, 50 chars each
  type: Joi.string().valid('space', 'folder', 'page').default('page'),
  parentId: Joi.string().allow(null),
  position: Joi.number().integer().min(0).default(0),
});

const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(500),
  content: Joi.string().allow('').max(1000000),
  tags: Joi.array().items(Joi.string().max(50)).max(20),
  parentId: Joi.string().allow(null),
  position: Joi.number().integer().min(0),
}).min(1); // At least one field required

export function notesRoutes(databaseService: DatabaseService, logger: Logger): Router {
  const router = Router();

  // Get all notes for the authenticated user
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

      const notes = await databaseService.getNotesByUser(req.user.userId);

      res.json({
        success: true,
        data: {
          notes: notes.map(note => ({
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            type: note.type,
            parentId: note.parentId,
            position: note.position,
            children: note.children || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          })),
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get notes error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve notes',
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

  // Get a specific note
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

      const note = await databaseService.getNoteById(req.params.id, req.user.userId);

      if (!note) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Note not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          note: {
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            type: note.type,
            parentId: note.parentId,
            position: note.position,
            children: note.children || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          },
        },
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Get note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve note',
      } as ApiResponse);
    }
  });

  // Create a new note
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
      const { error, value } = createNoteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        } as ApiResponse);
        return;
      }

      const noteData = {
        ...value,
        userId: req.user.userId,
      };

      const note = await databaseService.createNote(noteData);

      logger.log('info', `Note created by user ${req.user.userId}: ${note._id}`);

      res.status(201).json({
        success: true,
        data: {
          note: {
            id: note._id,
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            type: note.type,
            parentId: note.parentId,
            position: note.position,
            children: note.children || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          },
        },
        message: 'Note created successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Create note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create note',
      } as ApiResponse);
    }
  });

  // Update a note
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
      const { error, value } = updateNoteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message,
        } as ApiResponse);
        return;
      }

      const updatedNote = await databaseService.updateNote(req.params.id, req.user.userId, value);

      logger.log('info', `Note updated by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        data: {
          note: {
            id: updatedNote._id,
            title: updatedNote.title,
            content: updatedNote.content,
            tags: updatedNote.tags || [],
            type: updatedNote.type,
            parentId: updatedNote.parentId,
            position: updatedNote.position,
            children: updatedNote.children || [],
            createdAt: updatedNote.createdAt,
            updatedAt: updatedNote.updatedAt,
          },
        },
        message: 'Note updated successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Update note error:', error);

      if (error instanceof Error && error.message === 'Note not found or access denied') {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Note not found',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update note',
        } as ApiResponse);
      }
    }
  });

  // Delete a note
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

      const deleted = await databaseService.deleteNote(req.params.id, req.user.userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Note not found',
        } as ApiResponse);
        return;
      }

      logger.log('info', `Note deleted by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Note deleted successfully',
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Delete note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete note',
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
          note: {
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
