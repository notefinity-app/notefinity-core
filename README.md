# Notefinity Core (OSS)

Open source core of Notefinity - A transparent, privacy-focused note-taking application.

## 🎯 Transparency Promise

This open-source core demonstrates **exactly** what our backend does, proving we cannot access your data. Every API endpoint, database interaction, and data flow is visible and auditable.

## 🏗️ Architecture

### Express.js API Server

- RESTful API with comprehensive endpoints
- JWT-based authentication
- Rate limiting and security middleware
- Structured error handling and logging

### JWT Authentication System

- Secure token-based authentication
- Password hashing with bcrypt
- Token expiration and validation
- No session storage - stateless design

### CouchDB Integration

- Document-based storage for user isolation
- Authenticated sync API endpoints
- Changes feed for real-time synchronization
- User data never crosses boundaries

### Plugin System

- Extensible architecture for premium features
- Plugins operate on the same transparent codebase
- Clear plugin API with context isolation
- Premium features added through auditable plugins

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- CouchDB 3.x running locally or accessible URL

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment (edit .env file)
# At minimum, set your JWT_SECRET and COUCHDB_URL

# Build the project
npm run build

# Start the server
npm start
```

### Development

```bash
# Development mode with auto-restart
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Notes Management

- `GET /api/notes` - Get all user notes
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Synchronization

- `GET /api/sync/data` - Get sync data
- `POST /api/sync/bulk` - Bulk upload changes
- `GET /api/sync/changes` - CouchDB-style changes feed
- `GET /api/sync/info` - Database information

### System

- `GET /health` - Health check endpoint

## 🔒 Privacy & Security Features

### Data Isolation

- Each user's data is completely isolated
- No cross-user data access possible
- User IDs validate all operations

### Transparent Operations

- All database queries are visible in source code
- No hidden data collection or analytics
- Clear audit trail in logs

### Security Measures

- JWT tokens with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Rate limiting to prevent abuse
- CORS protection
- Security headers with Helmet.js

## 🔌 Plugin System

The plugin system allows extending functionality while maintaining transparency:

```javascript
// Example plugin structure
const plugin = {
  name: 'example-plugin',
  version: '1.0.0',
  enabled: true,

  async initialize(context) {
    // Access to app, database, auth, logger
  },

  routes: [
    {
      method: 'GET',
      path: '/api/premium/feature',
      handler: (req, res) => {
        /* handler */
      },
    },
  ],
};
```

### Plugin Context

Plugins receive a context object with:

- `app`: Express application instance
- `database`: Database service for data operations
- `auth`: Authentication service
- `logger`: Logging service

## 🧪 Testing

The test suite ensures all functionality works as expected:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:ui
```

## 🌍 Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: JWT signing secret (required for production)
- `JWT_EXPIRES_IN`: Token expiration (default: 7d)
- `COUCHDB_URL`: CouchDB connection URL
- `ALLOWED_ORIGINS`: CORS allowed origins
- `NODE_ENV`: Environment (development/production)

## 📊 CouchDB Setup

### Local CouchDB Installation

```bash
# macOS with Homebrew
brew install couchdb
brew services start couchdb

# Ubuntu/Debian
sudo apt-get install couchdb

# Docker
docker run -d --name couchdb -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  couchdb:latest
```

### CouchDB Configuration

Access CouchDB admin at `http://localhost:5984/_utils` and:

1. Create admin user
2. Enable CORS if needed
3. Databases are created automatically by the application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📋 Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Build and start server (single run)
- `npm run dev:watch` - Watch mode for development
- `npm start` - Start the compiled server
- `npm test` - Run test suite
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean build artifacts

## 🔍 Audit & Verification

This codebase is designed for complete auditability:

1. **No Hidden Operations**: Every database operation is explicit
2. **Clear Data Flow**: Follow data from API to database
3. **Minimal Dependencies**: Carefully chosen, well-maintained packages
4. **Comprehensive Tests**: All functionality is tested
5. **Plugin Transparency**: Extensions operate on same codebase

## 📄 License

**AGPL v3.0 or later** - See [LICENSE](LICENSE) for details.

This project is licensed under the GNU Affero General Public License v3.0 or later. This ensures that:

- ✅ You can freely use, modify, and distribute this software
- ✅ You must provide source code for any modifications
- ⚖️ **Network copyleft**: If you run this software as a service, you must make your complete source code available to users
- 🛡️ Protects against competitors building proprietary services on our transparent foundation

**Why AGPL?** This license ensures that the transparency we've built into this core remains transparent forever, even when used in web services. Anyone offering a competing service based on this code must also open source their modifications, maintaining the privacy-first ecosystem we've created.

## 🆘 Support

- Create an issue for bugs or feature requests
- Check existing issues before creating new ones
- Provide minimal reproduction cases for bugs

---

**This is the complete, unmodified backend that powers Notefinity. Premium features are added through the same transparent plugin system shown here.**

## Overview

This is the open source core package of Notefinity. It provides the fundamental note management functionality that can be extended with proprietary plugins and features.

## Features

- **Note Management**: Create, read, update, and delete notes
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Extensible Architecture**: Plugin-friendly design for adding custom functionality
- **Logging**: Built-in logging system with configurable levels
- **Lightweight**: Minimal dependencies, focused on core functionality

## Installation

```bash
npm install @notefinity/core
```

## Quick Start

```typescript
import { NoteManager } from '@notefinity/core';

// Create a note manager instance
const noteManager = new NoteManager();

// Create a new note
const note = noteManager.createNote('My First Note', 'This is the content of my note.');

// Get all notes
const allNotes = noteManager.getAllNotes();

// Update a note
noteManager.updateNote(note.id, {
  title: 'Updated Title',
  content: 'Updated content',
});

// Delete a note
noteManager.deleteNote(note.id);
```

## API Documentation

### NoteManager

The main class for managing notes.

#### Constructor

```typescript
constructor(logger?: Logger)
```

- `logger` (optional): Custom logger implementation. Defaults to `ConsoleLogger`.

#### Methods

##### `createNote(title: string, content: string): Note`

Creates a new note with the specified title and content.

##### `getNote(id: string): Note | undefined`

Retrieves a note by its ID.

##### `getAllNotes(): Note[]`

Returns an array of all notes.

##### `updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>): Note | undefined`

Updates an existing note with the provided changes.

##### `deleteNote(id: string): boolean`

Deletes a note by its ID. Returns `true` if successful, `false` if note not found.

### Types

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

interface Logger {
  log(level: LogLevel, message: string, ...args: any[]): void;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/notefinity-core.git
cd notefinity-core

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Format code
npm run format
```

### Scripts

- `npm run build` - Build the TypeScript code
- `npm run dev` - Build in watch mode
- `npm run test` - Run Jest tests
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Remove build artifacts

### Project Structure

```
src/
├── note-manager.ts    # Main NoteManager class
├── index.ts          # Package exports
└── types.ts          # TypeScript type definitions
```

## Extending Notefinity

The core is designed to be extended with additional functionality. Here's how you can build on top of it:

### Custom Logger

```typescript
import { Logger, LogLevel, NoteManager } from '@notefinity/core';

class CustomLogger implements Logger {
  log(level: LogLevel, message: string, ...args: any[]): void {
    // Your custom logging implementation
    console.log(`[${level}] ${message}`, ...args);
  }
}

const noteManager = new NoteManager(new CustomLogger());
```

### Plugin Architecture

The NoteManager can be extended to support plugins:

```typescript
import { NoteManager, Note } from '@notefinity/core';

class ExtendedNoteManager extends NoteManager {
  private plugins: Plugin[] = [];

  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  // Override methods to call plugins
  createNote(title: string, content: string): Note {
    const note = super.createNote(title, content);

    // Call plugin hooks
    this.plugins.forEach(plugin => {
      if (plugin.onNoteCreated) {
        plugin.onNoteCreated(note);
      }
    });

    return note;
  }
}
```

## Contributing

We welcome contributions to the Notefinity core! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Issues and Feature Requests

- Report bugs via [GitHub Issues](https://github.com/your-org/notefinity-core/issues)
- Request features via [GitHub Discussions](https://github.com/your-org/notefinity-core/discussions)

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Format your code: `npm run format`
7. Commit your changes: `git commit -am 'Add some feature'`
8. Push to the branch: `git push origin feature/my-feature`
9. Submit a pull request

## License

**AGPL v3.0 or later** - see the [LICENSE](LICENSE) file for details.

This copyleft license ensures that any service built using this code must also be open source, protecting the transparent ecosystem.

## Related Projects

- **Notefinity Main**: Main application with advanced features (private repository)
- **Notefinity CLI**: Command-line interface for Notefinity
- **Notefinity Web**: Web application built on Notefinity core

## Support

- 📖 [Documentation](https://docs.notefinity.com)
- 💬 [Community Discussions](https://github.com/your-org/notefinity-core/discussions)
- 🐛 [Report Issues](https://github.com/your-org/notefinity-core/issues)

---

Built with ❤️ by the Notefinity team
