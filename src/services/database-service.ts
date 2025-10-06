import nano from 'nano';
import {
  DatabaseService as IDatabaseService,
  Page,
  User,
  UserPublicKey,
} from '../types';

export class DatabaseService implements IDatabaseService {
  private db: nano.ServerScope;
  private pagesDb!: nano.DocumentScope<Page>;
  private usersDb!: nano.DocumentScope<User>;
  private keystoreDb!: nano.DocumentScope<UserPublicKey>;

  constructor() {
    const couchDbUrl =
      process.env.COUCHDB_URL || 'http://admin:password@localhost:5984';
    this.db = nano(couchDbUrl);
  }

  async initialize(): Promise<void> {
    try {
      // Create databases if they don't exist
      await this.createDatabaseIfNotExists('notefinity_pages');
      await this.createDatabaseIfNotExists('notefinity_users');
      await this.createDatabaseIfNotExists('notefinity_keystores');

      // Get database references
      this.pagesDb = this.db.db.use<Page>('notefinity_pages');
      this.usersDb = this.db.db.use<User>('notefinity_users');
      this.keystoreDb = this.db.db.use<UserPublicKey>('notefinity_keystores');

      // Create indexes for better performance
      await this.createIndexes();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createDatabaseIfNotExists(dbName: string): Promise<void> {
    try {
      await this.db.db.create(dbName);
      console.log(`Created database: ${dbName}`);
    } catch (error: any) {
      if (error.statusCode === 412) {
        // Database already exists
        console.log(`Database already exists: ${dbName}`);
      } else {
        throw error;
      }
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Index for pages by userId
      await this.pagesDb.createIndex({
        index: {
          fields: ['userId'],
        },
        name: 'user-index',
      });

      // Index for pages by updatedAt (for sync)
      await this.pagesDb.createIndex({
        index: {
          fields: ['updatedAt'],
        },
        name: 'updated-index',
      });

      // Index for pages by type (spaces, folders, pages)
      await this.pagesDb.createIndex({
        index: {
          fields: ['type'],
        },
        name: 'type-index',
      });

      // Index for users by email
      await this.usersDb.createIndex({
        index: {
          fields: ['email'],
        },
        name: 'by-email',
      });

      // Index for keystores by userId
      await this.keystoreDb.createIndex({
        index: {
          fields: ['userId'],
        },
        name: 'by-userId',
      });

      // Index for keystores by keyId
      await this.keystoreDb.createIndex({
        index: {
          fields: ['keyId'],
        },
        name: 'by-keyId',
      });
    } catch (error) {
      console.warn('Failed to create some indexes:', error);
    }
  }

  async createPage(
    pageData: Omit<Page, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<Page> {
    const now = new Date();
    const page: Page = {
      _id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...pageData,
      createdAt: now,
      updatedAt: now,
    };

    const response = await this.pagesDb.insert(page);
    return {
      ...page,
      _id: response.id,
      _rev: response.rev,
    };
  }

  async getPageById(id: string, userId: string): Promise<Page | null> {
    try {
      const page = await this.pagesDb.get(id);

      // Ensure user can only access their own pages
      if (page.userId !== userId) {
        return null;
      }

      return page;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getPagesByUser(userId: string): Promise<Page[]> {
    try {
      const response = await this.pagesDb.find({
        selector: {
          userId: userId,
        },
        sort: [{ updatedAt: 'desc' }],
      });

      return response.docs;
    } catch (error) {
      console.error('Failed to get pages by user:', error);
      return [];
    }
  }

  async updatePage(
    id: string,
    userId: string,
    updates: Partial<Page>
  ): Promise<Page> {
    try {
      const existingPage = await this.getPageById(id, userId);
      if (!existingPage) {
        throw new Error('Page not found or access denied');
      }

      const updatedPage: Page = {
        ...existingPage,
        ...updates,
        _id: existingPage._id,
        _rev: existingPage._rev,
        userId: existingPage.userId, // Prevent userId from being changed
        createdAt: existingPage.createdAt,
        updatedAt: new Date(),
      };

      const response = await this.pagesDb.insert(updatedPage);
      return {
        ...updatedPage,
        _rev: response.rev,
      };
    } catch (error) {
      console.error('Failed to update page:', error);
      throw error;
    }
  }

  async deletePage(id: string, userId: string): Promise<boolean> {
    try {
      const page = await this.getPageById(id, userId);
      if (!page) {
        return false;
      }

      // If deleting a folder, also delete all children recursively
      if (page.type === 'folder' && page.children && page.children.length > 0) {
        for (const childId of page.children) {
          await this.deletePage(childId, userId);
        }
      }

      // Remove this node from parent's children array
      if (page.parentId) {
        const parent = await this.getPageById(page.parentId, userId);
        if (parent && parent.children) {
          parent.children = parent.children.filter(
            (childId) => childId !== page._id
          );
          await this.updatePage(parent._id, userId, {
            children: parent.children,
          });
        }
      }

      await this.pagesDb.destroy(page._id, page._rev!);
      return true;
    } catch (error) {
      console.error('Failed to delete page:', error);
      return false;
    }
  }

  async getSpacesByUser(userId: string): Promise<Page[]> {
    try {
      const response = await this.pagesDb.find({
        selector: {
          userId: userId,
          type: 'space',
          $or: [{ parentId: { $exists: false } }, { parentId: null }],
        },
        sort: [{ position: 'asc' }],
      });

      return response.docs;
    } catch (error) {
      console.error('Failed to get spaces by user:', error);
      return [];
    }
  }

  async getChildNodes(parentId: string, userId: string): Promise<Page[]> {
    try {
      const response = await this.pagesDb.find({
        selector: {
          userId: userId,
          parentId: parentId,
        },
        sort: [{ position: 'asc' }],
      });

      return response.docs;
    } catch (error) {
      console.error('Failed to get child nodes:', error);
      return [];
    }
  }

  async moveNode(
    nodeId: string,
    newParentId: string | undefined,
    newPosition: number,
    userId: string
  ): Promise<Page> {
    try {
      const node = await this.getPageById(nodeId, userId);
      if (!node) {
        throw new Error('Node not found or access denied');
      }

      // Remove from old parent's children
      if (node.parentId) {
        const oldParent = await this.getPageById(node.parentId, userId);
        if (oldParent && oldParent.children) {
          oldParent.children = oldParent.children.filter(
            (childId) => childId !== nodeId
          );
          await this.updatePage(oldParent._id, userId, {
            children: oldParent.children,
          });
        }
      }

      // Add to new parent's children
      if (newParentId) {
        const newParent = await this.getPageById(newParentId, userId);
        if (!newParent) {
          throw new Error('New parent not found or access denied');
        }

        const children = newParent.children || [];
        children.splice(newPosition, 0, nodeId);
        await this.updatePage(newParent._id, userId, { children });
      }

      // Update the node itself
      return await this.updatePage(nodeId, userId, {
        parentId: newParentId,
        position: newPosition,
      });
    } catch (error) {
      console.error('Failed to move node:', error);
      throw error;
    }
  }

  async getNodePath(nodeId: string, userId: string): Promise<Page[]> {
    try {
      const path: Page[] = [];
      let currentNode = await this.getPageById(nodeId, userId);

      while (currentNode) {
        path.unshift(currentNode);
        if (!currentNode.parentId) {
          break;
        }
        currentNode = await this.getPageById(currentNode.parentId, userId);
      }

      return path;
    } catch (error) {
      console.error('Failed to get node path:', error);
      return [];
    }
  }

  async createUser(
    userData: Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const now = new Date();
    const user: User = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const response = await this.usersDb.insert(user);
    return {
      ...user,
      _id: response.id,
      _rev: response.rev,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.usersDb.find({
        selector: {
          email: email,
        },
        limit: 1,
      });

      return response.docs.length > 0 ? response.docs[0] : null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.usersDb.get(id);
      return user;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async storeUserPublicKey(
    keystoreData: Omit<
      UserPublicKey,
      '_id' | '_rev' | 'createdAt' | 'updatedAt'
    >
  ): Promise<UserPublicKey> {
    const now = new Date();
    const keystore: UserPublicKey = {
      _id: `keystore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...keystoreData,
      createdAt: now,
      updatedAt: now,
    };

    const response = await this.keystoreDb.insert(keystore);
    return {
      ...keystore,
      _id: response.id,
      _rev: response.rev,
    };
  }

  async getUserPublicKey(userId: string): Promise<UserPublicKey | null> {
    try {
      const response = await this.keystoreDb.find({
        selector: {
          userId: userId,
        },
        limit: 1,
        sort: [{ createdAt: 'desc' }], // Get the most recent key
      });

      return response.docs.length > 0 ? response.docs[0] : null;
    } catch (error) {
      console.error('Failed to get user public key:', error);
      return null;
    }
  }

  async updateUserPublicKey(
    userId: string,
    updates: Partial<UserPublicKey>
  ): Promise<UserPublicKey> {
    try {
      const existingKeystore = await this.getUserPublicKey(userId);
      if (!existingKeystore) {
        throw new Error('User keystore not found');
      }

      const updatedKeystore: UserPublicKey = {
        ...existingKeystore,
        ...updates,
        _id: existingKeystore._id,
        _rev: existingKeystore._rev,
        userId: existingKeystore.userId, // Prevent userId from being changed
        createdAt: existingKeystore.createdAt,
        updatedAt: new Date(),
      };

      const response = await this.keystoreDb.insert(updatedKeystore);
      return {
        ...updatedKeystore,
        _rev: response.rev,
      };
    } catch (error) {
      console.error('Failed to update user public key:', error);
      throw error;
    }
  }

  async deleteUserPublicKey(userId: string): Promise<boolean> {
    try {
      const keystore = await this.getUserPublicKey(userId);
      if (!keystore) {
        return false;
      }

      await this.keystoreDb.destroy(keystore._id, keystore._rev!);
      return true;
    } catch (error) {
      console.error('Failed to delete user public key:', error);
      return false;
    }
  }
}
