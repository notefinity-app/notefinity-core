import { Request, Response, Router } from 'express';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { ApiResponse, SyncData } from '../types';

export function syncRoutes(
  databaseService: DatabaseService,
  logger: Logger
): Router {
  const router = Router();

  // Get sync data for the authenticated user
  router.get('/data', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const lastSync = req.query.lastSync
        ? new Date(req.query.lastSync as string)
        : new Date(0);
      const pages = await databaseService.getPagesByUser(req.user.userId);

      // Filter pages updated since last sync
      const syncedPages = pages.filter(
        (page) => new Date(page.updatedAt) > lastSync
      );

      const syncData: SyncData = {
        pages: syncedPages,
        lastSync: new Date(),
      };

      logger.log(
        'info',
        `Sync data requested by user ${req.user.userId}: ${syncedPages.length} pages`
      );

      res.json({
        success: true,
        data: syncData,
        message: `Synced ${syncedPages.length} pages`,
      } as ApiResponse<SyncData>);
    } catch (error) {
      logger.log('error', 'Sync data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve sync data',
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
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const { pages } = req.body;

      if (!Array.isArray(pages)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Pages must be an array',
        } as ApiResponse);
        return;
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as any[],
      };

      for (const pageData of pages) {
        try {
          // Ensure the page belongs to the authenticated user
          pageData.userId = req.user.userId;

          if (pageData._id && pageData._id.startsWith('page_')) {
            // Update existing page
            const { _id, _rev, ...updateData } = pageData;
            await databaseService.updatePage(_id, req.user.userId, updateData);
            results.updated++;
          } else {
            // Create new page
            const { _id, _rev, ...createData } = pageData;
            await databaseService.createPage(createData);
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            page: pageData._id || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.log(
        'info',
        `Bulk sync by user ${req.user.userId}: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`
      );

      res.json({
        success: true,
        data: results,
        message: `Processed ${pages.length} pages`,
      } as ApiResponse);
    } catch (error) {
      logger.log('error', 'Bulk sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process bulk sync',
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
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      // This is a simplified changes feed
      // In a real implementation, you'd use CouchDB's actual changes feed
      const since = req.query.since
        ? new Date(req.query.since as string)
        : new Date(0);
      const pages = await databaseService.getPagesByUser(req.user.userId);

      const changes = pages
        .filter((page) => new Date(page.updatedAt) > since)
        .map((page) => ({
          id: page._id,
          rev: page._rev,
          seq: new Date(page.updatedAt).getTime(),
          changes: [{ rev: page._rev }],
        }));

      const lastSeq =
        changes.length > 0
          ? Math.max(...changes.map((c) => c.seq))
          : Date.now();

      res.json({
        results: changes,
        last_seq: lastSeq,
        pending: 0,
      });

      logger.log(
        'info',
        `Changes feed requested by user ${req.user.userId}: ${changes.length} changes`
      );
    } catch (error) {
      logger.log('error', 'Changes feed error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve changes',
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
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const pages = await databaseService.getPagesByUser(req.user.userId);

      // CouchDB-style database info
      res.json({
        db_name: `user_${req.user.userId}`,
        doc_count: pages.length,
        doc_del_count: 0,
        update_seq: Date.now(),
        purge_seq: 0,
        compact_running: false,
        disk_size: 0,
        data_size: 0,
        instance_start_time: Date.now().toString(),
        disk_format_version: 8,
        committed_update_seq: Date.now(),
      });
    } catch (error) {
      logger.log('error', 'Database info error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve database info',
      } as ApiResponse);
    }
  });

  return router;
}
