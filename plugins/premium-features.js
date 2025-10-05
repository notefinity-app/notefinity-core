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

          // Get user's notes and perform AI search
          const notes = await plugin.context.database.getNotesByUser(req.user.userId);

          // Mock AI processing - in reality, this would call AI services
          const aiResults = notes
            .filter(note => {
              const content = (note.title + ' ' + note.content).toLowerCase();
              return (
                content.includes(query.toLowerCase()) ||
                content.match(new RegExp(query.split(' ').join('|'), 'i'))
              );
            })
            .map(note => ({
              id: note._id,
              title: note.title,
              content: note.content.substring(0, 200) + '...',
              relevanceScore: Math.random() * 0.5 + 0.5, // Mock score
              tags: note.tags,
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
          const note = await plugin.context.database.getNoteById(noteId, req.user.userId);

          if (!note) {
            return res.status(404).json({
              success: false,
              error: 'Not Found',
              message: 'Note not found',
            });
          }

          // Mock AI categorization
          const content = note.title + ' ' + note.content;
          const categories = [];

          // Simple keyword-based categorization (mock AI)
          if (content.match(/meeting|call|agenda/i)) categories.push('meetings');
          if (content.match(/todo|task|deadline/i)) categories.push('tasks');
          if (content.match(/idea|inspiration|brainstorm/i)) categories.push('ideas');
          if (content.match(/personal|family|home/i)) categories.push('personal');
          if (content.match(/work|project|business/i)) categories.push('work');

          // Update note with AI-suggested categories
          const updatedNote = await plugin.context.database.updateNote(noteId, req.user.userId, {
            tags: [...(note.tags || []), ...categories],
          });

          res.json({
            success: true,
            data: {
              note: {
                id: updatedNote._id,
                title: updatedNote.title,
                tags: updatedNote.tags,
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

          const note = await plugin.context.database.getNoteById(noteId, req.user.userId);

          if (!note) {
            return res.status(404).json({
              success: false,
              error: 'Not Found',
            });
          }

          // Mock export generation
          let exportContent;
          let mimeType;
          let filename = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;

          switch (format) {
            case 'html':
              mimeType = 'text/html';
              exportContent = `
                <html>
                  <head><title>${note.title}</title></head>
                  <body>
                    <h1>${note.title}</h1>
                    <div>${note.content.replace(/\n/g, '<br>')}</div>
                    <p><small>Tags: ${(note.tags || []).join(', ')}</small></p>
                  </body>
                </html>
              `;
              break;
            case 'markdown':
              mimeType = 'text/markdown';
              exportContent = `# ${note.title}\n\n${note.content}\n\n**Tags:** ${(note.tags || []).join(', ')}`;
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

          const notes = await plugin.context.database.getNotesByUser(req.user.userId);

          // Calculate analytics
          const analytics = {
            totalNotes: notes.length,
            totalWords: notes.reduce((sum, note) => {
              return sum + note.content.split(/\s+/).length;
            }, 0),
            averageWordsPerNote: notes.length
              ? Math.round(
                  notes.reduce((sum, note) => sum + note.content.split(/\s+/).length, 0) /
                    notes.length
                )
              : 0,
            mostUsedTags: this.getMostUsedTags(notes),
            notesThisMonth: this.getNotesThisMonth(notes),
            writingStreak: this.calculateWritingStreak(notes),
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
  getMostUsedTags(notes) {
    const tagCounts = {};
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  },

  getNotesThisMonth(notes) {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return notes.filter(note => {
      const noteDate = new Date(note.createdAt);
      return noteDate.getMonth() === thisMonth && noteDate.getFullYear() === thisYear;
    }).length;
  },

  calculateWritingStreak(notes) {
    if (notes.length === 0) return 0;

    // Sort notes by date
    const sortedNotes = notes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const note of sortedNotes) {
      const noteDate = new Date(note.createdAt);
      noteDate.setHours(0, 0, 0, 0);

      if (noteDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (noteDate.getTime() < currentDate.getTime()) {
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
