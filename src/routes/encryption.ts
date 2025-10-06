import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/database-service';
import { Logger } from '../services/logger';
import { ApiResponse } from '../types';

const storePublicKeySchema = Joi.object({
  publicKey: Joi.string().min(50).required(), // Client-defined public key
  keyId: Joi.string().min(1).max(64).required(), // Client-defined key identifier
  algorithm: Joi.string().min(1).max(64).required(), // Algorithm this key supports
});

export function publicKeyRoutes(
  databaseService: DatabaseService,
  logger: Logger
): Router {
  const router = Router();

  // Store user's public key (for optional collaboration features)
  router.post(
    '/store-public-key',
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          } as ApiResponse);
          return;
        }

        const { error, value } = storePublicKeySchema.validate(req.body);
        if (error) {
          res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: error.details[0].message,
          } as ApiResponse);
          return;
        }

        const { publicKey, keyId, algorithm } = value;

        // Check if user already has a key stored
        const existingKeystore = await databaseService.getUserPublicKey(
          req.user.userId
        );

        if (existingKeystore) {
          // Update existing key
          const updatedKeystore = await databaseService.updateUserPublicKey(
            req.user.userId,
            {
              publicKey,
              keyId,
              algorithm,
            }
          );

          logger.log('info', `Updated public key for user ${req.user.userId}`);

          res.json({
            success: true,
            data: {
              keystore: {
                keyId: updatedKeystore.keyId,
                algorithm: updatedKeystore.algorithm,
                createdAt: updatedKeystore.createdAt,
                updatedAt: updatedKeystore.updatedAt,
              },
            },
            message: 'Public key updated successfully',
          } as ApiResponse);
        } else {
          // Store new key
          const keystore = await databaseService.storeUserPublicKey({
            userId: req.user.userId,
            publicKey,
            keyId,
            algorithm,
          });

          logger.log('info', `Stored public key for user ${req.user.userId}`);

          res.json({
            success: true,
            data: {
              keystore: {
                keyId: keystore.keyId,
                algorithm: keystore.algorithm,
                createdAt: keystore.createdAt,
                updatedAt: keystore.updatedAt,
              },
            },
            message: 'Public key stored successfully',
          } as ApiResponse);
        }
      } catch (error) {
        logger.log('error', 'Store public key error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to store public key',
        } as ApiResponse);
      }
    }
  );

  // Get user's public key (for others to encrypt data for this user)
  router.get(
    '/public-key/:userId',
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          } as ApiResponse);
          return;
        }

        const { userId } = req.params;
        const keystore = await databaseService.getUserPublicKey(userId);

        if (!keystore) {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: 'Public key not found for this user',
          } as ApiResponse);
          return;
        }

        res.json({
          success: true,
          data: {
            publicKey: keystore.publicKey,
            keyId: keystore.keyId,
            algorithm: keystore.algorithm,
            userId: keystore.userId,
          },
          message: 'Public key retrieved successfully',
        } as ApiResponse);
      } catch (error) {
        logger.log('error', 'Get public key error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to retrieve public key',
        } as ApiResponse);
      }
    }
  );

  // Get current user's own public key info
  router.get(
    '/my-public-key',
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          } as ApiResponse);
          return;
        }

        const keystore = await databaseService.getUserPublicKey(
          req.user.userId
        );

        if (!keystore) {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: 'You have not registered a public key yet',
          } as ApiResponse);
          return;
        }

        res.json({
          success: true,
          data: {
            keyId: keystore.keyId,
            algorithm: keystore.algorithm,
            publicKey: keystore.publicKey, // Include the actual public key for the user
            createdAt: keystore.createdAt,
            updatedAt: keystore.updatedAt,
            hasPublicKey: true,
          },
          message: 'Your public key information',
        } as ApiResponse);
      } catch (error) {
        logger.log('error', 'Get my public key error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to retrieve your public key information',
        } as ApiResponse);
      }
    }
  );

  // Delete user's public key
  router.delete(
    '/my-public-key',
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          } as ApiResponse);
          return;
        }

        const deleted = await databaseService.deleteUserPublicKey(
          req.user.userId
        );

        if (!deleted) {
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: 'No public key found to delete',
          } as ApiResponse);
          return;
        }

        logger.log('info', `Public key deleted for user ${req.user.userId}`);

        res.json({
          success: true,
          message: 'Public key deleted successfully',
        } as ApiResponse);
      } catch (error) {
        logger.log('error', 'Delete public key error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to delete public key',
        } as ApiResponse);
      }
    }
  );

  return router;
}
