// Notefinity Premium Plugin
// This plugin adds premium features to the open-source core
// It demonstrates how proprietary features integrate transparently

const { PremiumExtension } = require('@notefinity/main');

const plugin = {
  name: 'notefinity-premium',
  version: '1.0.0',
  enabled: true,

  async initialize(context) {
    context.logger.log('info', 'Notefinity Premium Plugin initialized');

    // Initialize premium extension with core services
    this.premiumExtension = new PremiumExtension(context.database, context.logger);
    this.context = context;
  },

  routes: [
    // AI-powered search
    {
      method: 'POST',
      path: '/api/premium/ai-search',
      middleware: [], // Add auth middleware from context if needed
      handler: async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: 'Unauthorized',
              message: 'Premium features require authentication',
            });
          }

          const { query } = req.body;
          if (!query || typeof query !== 'string') {
            return res.status(400).json({
              success: false,
              error: 'Bad Request',
              message: 'Query is required',
            });
          }

          // Get user's pages and perform AI search
          const pages = await plugin.context.database.getPagesByUser(req.user.userId);

          // Mock AI processing - in reality, this would call AI services
          const aiResults = pages
            .filter(page => {
              const content = (page.title + ' ' + page.content).toLowerCase();
              return (
                content.includes(query.toLowerCase()) ||
                content.match(new RegExp(query.split(' ').join('|'), 'i'))
              );
            })
            .map(page => ({
              id: page._id,
              title: page.title,
              content: page.content.substring(0, 200) + '...',
              createdAt: page.createdAt,
              tags: page.tags,
            }));

          res.json({
            success: true,
            data: {
              results: aiResults,
              query: query,
              totalResults: aiResults.length,
            },
            message: 'AI search completed',
          });
        } catch (error) {
          plugin.context.logger.log('error', 'AI search error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'AI search failed',
          });
        }
      },
    },

    // Auto-categorization
    {
      method: 'POST',
      path: '/api/premium/auto-categorize/:noteId',
      handler: async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: 'Unauthorized',
            });
          }

          const { noteId } = req.params;
          const page = await plugin.context.database.getPageById(noteId, req.user.userId);

          if (!page) {
            return res.status(404).json({
              success: false,
              error: 'Not Found',
              message: 'Page not found',
            });
          }

          // Mock AI categorization
          const content = page.title + ' ' + page.content;
          const categories = [];

          // Simple keyword-based categorization (mock AI)
          if (content.match(/meeting|call|agenda/i)) categories.push('meetings');
          if (content.match(/todo|task|deadline/i)) categories.push('tasks');
          if (content.match(/idea|inspiration|brainstorm/i)) categories.push('ideas');
          if (content.match(/personal|family|home/i)) categories.push('personal');
          if (content.match(/work|project|business/i)) categories.push('work');

          // Update page with AI-suggested categories
          const updatedPage = await plugin.context.database.updatePage(noteId, req.user.userId, {
            tags: [...(page.tags || []), ...categories],
          });

          res.json({
            success: true,
            data: {
              page: {
                id: updatedPage._id,
                title: updatedPage.title,
                tags: updatedPage.tags,
              },
              suggestedCategories: categories,
            },
            message: 'Auto-categorization completed',
          });
        } catch (error) {
          plugin.context.logger.log('error', 'Auto-categorize error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Auto-categorization failed',
          });
        }
      },
    },

    // Export functionality
    {
      method: 'GET',
      path: '/api/premium/export/:noteId/:format',
      handler: async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: 'Unauthorized',
            });
          }

          const { noteId, format } = req.params;
          const validFormats = ['pdf', 'docx', 'html', 'markdown'];

          if (!validFormats.includes(format)) {
            return res.status(400).json({
              success: false,
              error: 'Bad Request',
              message: 'Invalid format. Supported: ' + validFormats.join(', '),
            });
          }

          const page = await plugin.context.database.getPageById(noteId, req.user.userId);

          if (!page) {
            return res.status(404).json({
              success: false,
              error: 'Not Found',
            });
          }

          // Mock export generation
          let exportContent;
          let mimeType;
          let filename = `${page.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;

          switch (format) {
            case 'html':
              mimeType = 'text/html';
              exportContent = `
                <html>
                  <head><title>${page.title}</title></head>
                  <body>
                    <h1>${page.title}</h1>
                    <div>${page.content.replace(/\n/g, '<br>')}</div>
                    <p><small>Tags: ${(page.tags || []).join(', ')}</small></p>
                  </body>
                </html>
              `;
              break;
            case 'markdown':
              mimeType = 'text/markdown';
              exportContent = `# ${page.title}\n\n${page.content}\n\n**Tags:** ${(page.tags || []).join(', ')}`;
              break;
            default:
              // For PDF/DOCX, we'd generate binary content
              return res.json({
                success: true,
                data: {
                  downloadUrl: `/api/premium/download/${noteId}/${format}`,
                  filename: filename,
                },
                message: `${format.toUpperCase()} export prepared`,
              });
          }

          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(exportContent);
        } catch (error) {
          plugin.context.logger.log('error', 'Export error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Export failed',
          });
        }
      },
    },

    // Premium analytics
    {
      method: 'GET',
      path: '/api/premium/analytics',
      handler: async (req, res) => {
        try {
          if (!req.user) {
            return res.status(401).json({
              success: false,
              error: 'Unauthorized',
            });
          }

          const pages = await plugin.context.database.getPagesByUser(req.user.userId);

          // Calculate analytics
          const analytics = {
            totalPages: pages.length,
            totalWords: pages.reduce((sum, page) => {
              return sum + page.content.split(/\s+/).length;
            }, 0),
            averageWordsPerPage: pages.length
              ? Math.round(
                  pages.reduce((sum, page) => sum + page.content.split(/\s+/).length, 0) /
                    pages.length
                )
              : 0,
            mostUsedTags: this.getMostUsedTags(pages),
            pagesThisMonth: this.getPagesThisMonth(pages),
            writingStreak: this.calculateWritingStreak(pages),
          };

          res.json({
            success: true,
            data: analytics,
            message: 'Analytics generated',
          });
        } catch (error) {
          plugin.context.logger.log('error', 'Analytics error:', error);
          res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to generate analytics',
          });
        }
      },
    },
  ],

  // Helper methods
  getMostUsedTags(pages) {
    const tagCounts = {};
    pages.forEach(page => {
      (page.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  },

  getPagesThisMonth(pages) {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return pages.filter(page => {
      const pageDate = new Date(page.createdAt);
      return pageDate.getMonth() === thisMonth && pageDate.getFullYear() === thisYear;
    }).length;
  },

  calculateWritingStreak(pages) {
    if (pages.length === 0) return 0;

    // Sort pages by date
    const sortedPages = pages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const page of sortedPages) {
      const pageDate = new Date(page.createdAt);
      pageDate.setHours(0, 0, 0, 0);

      if (pageDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (pageDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  },

  middleware: [
    {
      name: 'premium-features-logger',
      handler: (req, res, next) => {
        if (req.path.startsWith('/api/premium/')) {
          plugin.context.logger.log('info', `Premium feature accessed: ${req.path}`, {
            userId: req.user?.userId,
            method: req.method,
          });
        }
        next();
      },
    },
  ],
};

module.exports = plugin;
