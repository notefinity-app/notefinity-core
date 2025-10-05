import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { ApiResponse } from '../types';

const createNoteSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  content: Joi.string().allow('').max(1000000), // Allow empty content, max 1MB
  tags: Joi.array().items(Joi.string().max(50)).max(20) // Max 20 tags, 50 chars each
});

const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(500),
  content: Joi.string().allow('').max(1000000),
  tags: Joi.array().items(Joi.string().max(50)).max(20)
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
          message: 'Authentication required'
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
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }))
        }
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Get notes error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve notes'
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
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const note = await databaseService.getNoteById(req.params.id, req.user.userId);
      
      if (!note) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Note not found'
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
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        }
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Get note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve note'
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
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      // Validate input
      const { error, value } = createNoteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message
        } as ApiResponse);
        return;
      }

      const noteData = {
        ...value,
        userId: req.user.userId
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
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
          }
        },
        message: 'Note created successfully'
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Create note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create note'
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
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      // Validate input
      const { error, value } = updateNoteSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message
        } as ApiResponse);
        return;
      }

      const updatedNote = await databaseService.updateNote(
        req.params.id, 
        req.user.userId, 
        value
      );

      logger.log('info', `Note updated by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        data: {
          note: {
            id: updatedNote._id,
            title: updatedNote.title,
            content: updatedNote.content,
            tags: updatedNote.tags || [],
            createdAt: updatedNote.createdAt,
            updatedAt: updatedNote.updatedAt
          }
        },
        message: 'Note updated successfully'
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Update note error:', error);
      
      if (error instanceof Error && error.message === 'Note not found or access denied') {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Note not found'
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to update note'
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
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const deleted = await databaseService.deleteNote(req.params.id, req.user.userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Note not found'
        } as ApiResponse);
        return;
      }

      logger.log('info', `Note deleted by user ${req.user.userId}: ${req.params.id}`);

      res.json({
        success: true,
        message: 'Note deleted successfully'
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Delete note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete note'
      } as ApiResponse);
    }
  });

  return router;
}