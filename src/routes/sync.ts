import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { ApiResponse, SyncData } from '../types';

export function syncRoutes(databaseService: DatabaseService, logger: Logger): Router {
  const router = Router();

  // Get sync data for the authenticated user
  router.get('/data', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const lastSync = req.query.lastSync ? new Date(req.query.lastSync as string) : new Date(0);
      const notes = await databaseService.getNotesByUser(req.user.userId);

      // Filter notes updated since last sync
      const syncedNotes = notes.filter(note => 
        new Date(note.updatedAt) > lastSync
      );

      const syncData: SyncData = {
        notes: syncedNotes,
        lastSync: new Date()
      };

      logger.log('info', `Sync data requested by user ${req.user.userId}: ${syncedNotes.length} notes`);

      res.json({
        success: true,
        data: syncData,
        message: `Synced ${syncedNotes.length} notes`
      } as ApiResponse<SyncData>);

    } catch (error) {
      logger.log('error', 'Sync data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve sync data'
      } as ApiResponse);
    }
  });

  // Bulk sync endpoint for uploading changes
  router.post('/bulk', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      const { notes } = req.body;
      
      if (!Array.isArray(notes)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Notes must be an array'
        } as ApiResponse);
        return;
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as any[]
      };

      for (const noteData of notes) {
        try {
          // Ensure the note belongs to the authenticated user
          noteData.userId = req.user.userId;

          if (noteData._id && noteData._id.startsWith('note_')) {
            // Update existing note
            const { _id, _rev, ...updateData } = noteData;
            await databaseService.updateNote(_id, req.user.userId, updateData);
            results.updated++;
          } else {
            // Create new note
            const { _id, _rev, ...createData } = noteData;
            await databaseService.createNote(createData);
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            note: noteData._id || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.log('info', `Bulk sync by user ${req.user.userId}: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);

      res.json({
        success: true,
        data: results,
        message: `Processed ${notes.length} notes`
      } as ApiResponse);

    } catch (error) {
      logger.log('error', 'Bulk sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process bulk sync'
      } as ApiResponse);
    }
  });

  // CouchDB-style changes feed for real-time sync
  router.get('/changes', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        } as ApiResponse);
        return;
      }

      // This is a simplified changes feed
      // In a real implementation, you'd use CouchDB's actual changes feed
      const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
      const notes = await databaseService.getNotesByUser(req.user.userId);

      const changes = notes
        .filter(note => new Date(note.updatedAt) > since)
        .map(note => ({
          id: note._id,
          rev: note._rev,
          seq: new Date(note.updatedAt).getTime(),
          changes: [{ rev: note._rev }]
        }));

      const lastSeq = changes.length > 0 ? 
        Math.max(...changes.map(c => c.seq)) : 
        Date.now();

      res.json({
        results: changes,
        last_seq: lastSeq,
        pending: 0
      });

      logger.log('info', `Changes feed requested by user ${req.user.userId}: ${changes.length} changes`);

    } catch (error) {
      logger.log('error', 'Changes feed error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve changes'
      } as ApiResponse);
    }
  });

  // Database info endpoint (CouchDB compatibility)
  router.get('/info', async (req: Request, res: Response): Promise<void> => {
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

      // CouchDB-style database info
      res.json({
        db_name: `user_${req.user.userId}`,
        doc_count: notes.length,
        doc_del_count: 0,
        update_seq: Date.now(),
        purge_seq: 0,
        compact_running: false,
        disk_size: 0,
        data_size: 0,
        instance_start_time: Date.now().toString(),
        disk_format_version: 8,
        committed_update_seq: Date.now()
      });

    } catch (error) {
      logger.log('error', 'Database info error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve database info'
      } as ApiResponse);
    }
  });

  return router;
}