import { Logger, NodeType, Page } from './types';
import { ConsoleLogger, generateId } from './utils';

export class PageManager {
  private pages: Map<string, Page> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  createPage(
    title: string,
    content: string,
    userId: string,
    type: NodeType = 'page',
    parentId?: string
  ): Page {
    const page: Page = {
      _id: generateId(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      userId,
      type,
      parentId,
      position: 0, // Will be updated when added to parent
      children: type === 'page' ? undefined : [],
    };

    this.pages.set(page._id, page);

    // If this has a parent, add it to the parent's children
    if (parentId) {
      const parent = this.pages.get(parentId);
      if (parent && parent.children) {
        parent.children.push(page._id);
        page.position = parent.children.length - 1;
      }
    }

    this.logger.log('info', `Created ${type}: ${page.title}`);
    return page;
  }

  getPage(id: string): Page | undefined {
    return this.pages.get(id);
  }

  getAllPages(): Page[] {
    return Array.from(this.pages.values());
  }

  updatePage(
    id: string,
    updates: Partial<Pick<Page, 'title' | 'content' | 'tags'>>
  ): Page | undefined {
    const page = this.pages.get(id);
    if (!page) {
      this.logger.log('warn', `Page not found: ${id}`);
      return undefined;
    }

    const updatedPage = {
      ...page,
      ...updates,
      updatedAt: new Date(),
    };

    this.pages.set(id, updatedPage);
    this.logger.log('info', `Updated page: ${updatedPage.title}`);
    return updatedPage;
  }

  deletePage(id: string): boolean {
    const deleted = this.pages.delete(id);
    if (deleted) {
      this.logger.log('info', `Deleted page: ${id}`);
    } else {
      this.logger.log('warn', `Page not found for deletion: ${id}`);
    }
    return deleted;
  }

  getPagesByUserId(userId: string): Page[] {
    return Array.from(this.pages.values()).filter(page => page.userId === userId);
  }

  getSpacesByUserId(userId: string): Page[] {
    return Array.from(this.pages.values()).filter(
      page => page.userId === userId && page.type === 'space' && !page.parentId
    );
  }

  getChildNodes(parentId: string): Page[] {
    return Array.from(this.pages.values())
      .filter(page => page.parentId === parentId)
      .sort((a, b) => a.position - b.position);
  }

  moveNode(nodeId: string, newParentId?: string, newPosition?: number): boolean {
    const node = this.pages.get(nodeId);
    if (!node) {
      this.logger.log('warn', `Node not found for move: ${nodeId}`);
      return false;
    }

    // Remove from old parent's children
    if (node.parentId) {
      const oldParent = this.pages.get(node.parentId);
      if (oldParent && oldParent.children) {
        oldParent.children = oldParent.children.filter(childId => childId !== nodeId);
        // Update positions of remaining children
        oldParent.children.forEach((childId, index) => {
          const child = this.pages.get(childId);
          if (child) {
            child.position = index;
          }
        });
      }
    }

    // Update node's parent
    node.parentId = newParentId;

    // Add to new parent's children
    if (newParentId) {
      const newParent = this.pages.get(newParentId);
      if (!newParent) {
        this.logger.log('warn', `New parent not found: ${newParentId}`);
        return false;
      }

      if (!newParent.children) {
        newParent.children = [];
      }

      const insertPosition = newPosition !== undefined ? newPosition : newParent.children.length;
      newParent.children.splice(insertPosition, 0, nodeId);

      // Update positions of all children
      newParent.children.forEach((childId, index) => {
        const child = this.pages.get(childId);
        if (child) {
          child.position = index;
        }
      });
    } else {
      node.position = newPosition || 0;
    }

    node.updatedAt = new Date();
    this.logger.log('info', `Moved node: ${node.title}`);
    return true;
  }

  getNodePath(nodeId: string): Page[] {
    const path: Page[] = [];
    let currentNode = this.pages.get(nodeId);

    while (currentNode) {
      path.unshift(currentNode);
      if (!currentNode.parentId) {
        break;
      }
      currentNode = this.pages.get(currentNode.parentId);
    }

    return path;
  }

  createSpace(title: string, userId: string): Page {
    return this.createPage(title, '', userId, 'space');
  }

  createFolder(title: string, userId: string, parentId?: string): Page {
    return this.createPage(title, '', userId, 'folder', parentId);
  }

  createPageNode(title: string, content: string, userId: string, parentId?: string): Page {
    return this.createPage(title, content, userId, 'page', parentId);
  }
}
