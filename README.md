# Notefinity Core (OSS)

[![CI/CD Pipeline](https://github.com/notefinity-app/notefinity-core/actions/workflows/ci.yml/badge.svg)](https://github.com/notefinity-app/notefinity-core/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-76.27%25-brightgreen.svg)](https://github.com/notefinity-app/notefinity-core/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@notefinity%2Fcore.svg)](https://badge.fury.io/js/@notefinity%2Fcore)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

Open source core of Notefinity - A transparent, privacy-focused knowledge management system.

## 🎯 Transparency Promise

This open-source core demonstrates **exactly** what our backend does, proving we cannot access your data. Every API endpoint, database interaction, and data flow is visible and auditable.

> 🏠 **Want complete data control?** [Self-host Notefinity Core](#-self-hosting) on your own infrastructure with our one-click deployment options. Your data, your servers, your rules.

## 🏗️ Architecture

### Express.js API Server

- RESTful API endpoints for pages, authentication, and encryption
- Hierarchical page management with tree structure support
- End-to-end encryption with client-side key management

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

- Node.js 20+
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

### Pages Management

- `GET /api/pages` - Get all user pages
- `GET /api/pages/:id` - Get specific page
- `POST /api/pages` - Create new page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page

### Tree Structure (Hierarchical Organization)

- `GET /api/pages/spaces` - Get all spaces (root nodes) for user
- `GET /api/pages/:id/children` - Get child nodes of a parent
- `PATCH /api/pages/:id/move` - Move node to new parent/position
- `GET /api/pages/:id/path` - Get path from root to specific node

### Synchronization

- `GET /api/sync/data` - Get sync data
- `POST /api/sync/bulk` - Bulk upload changes
- `GET /api/sync/changes` - CouchDB-style changes feed
- `GET /api/sync/info` - Database information

### End-to-End Encryption (Optional Collaboration)

- `POST /api/keys/store-public-key` - Store user's public key
- `GET /api/keys/public-key/:userId` - Get another user's public key
- `GET /api/keys/my-public-key` - Get own public key info
- `DELETE /api/keys/my-public-key` - Delete public key

### System

- `GET /health` - Health check endpoint

## 🌳 Hierarchical Page Organization

Notefinity supports organizing pages in a tree structure with three types of nodes:

### Node Types

- **Spaces**: Root-level containers that organize your entire workspace
- **Folders**: Intermediate containers that can hold other folders and pages
- **Pages**: Individual pages that contain your actual content

### Structure Example

```
📁 My Workspace (Space)
├── 📁 Projects (Folder)
│   ├── 📁 Web Development (Folder)
│   │   ├── 📄 React Best Practices (Page)
│   │   └── 📄 TypeScript Guide (Page)
│   └── 📄 Project Ideas (Page)
└── 📁 Personal (Folder)
    ├── 📄 Daily Journal (Page)
    └── 📄 Reading List (Page)
```

### API Usage Examples

```javascript
// Create a space
POST /api/pages
{
  "title": "My Workspace",
  "content": "",
  "type": "space"
}

// Create a folder in a space
POST /api/pages
{
  "title": "Projects",
  "content": "",
  "type": "folder",
  "parentId": "space-id-here",
  "position": 0
}

// Create a page in a folder
POST /api/pages
{
  "title": "React Best Practices",
  "content": "# React Best Practices\n\n...",
  "type": "page",
  "parentId": "folder-id-here",
  "position": 0
}

// Create an encrypted page (client encrypts before sending)
POST /api/pages
{
  "title": "",
  "content": "",
  "isEncrypted": true,
  "encryptedTitle": {
    "algorithm": "RSA-OAEP+AES-256-GCM",
    "data": "base64-encrypted-title",
    "version": 1
  },
  "encryptedContent": {
    "algorithm": "RSA-OAEP+AES-256-GCM",
    "data": "base64-encrypted-content",
    "version": 1
  }
}

// Move a node to a different parent
PATCH /api/pages/node-id/move
{
  "parentId": "new-parent-id",
  "position": 1
}
```

## 🔒 Privacy & Security Features

### End-to-End Encryption (E2E)

- **Client-side encryption only** - Server cannot decrypt user data
- **User-controlled keys** - Private keys stored in password managers
- **Transparent server** - Only encrypted blobs stored server-side
- **Optional collaboration** - Public key registry for sharing
- See [E2E_ENCRYPTION.md](E2E_ENCRYPTION.md) for full details

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

The comprehensive test suite ensures all functionality works as expected with **76.08% code coverage** across 200 tests:

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

### Test Coverage Areas

- **Server Class Testing**: Complete `NotefinityServer` initialization, middleware, and routing (18 tests)
- **Type System Validation**: TypeScript interface verification and runtime type checking (20 tests)
- **API Endpoints**: All REST endpoints with authentication and error handling (80+ tests)
- **Database Operations**: CouchDB integration, CRUD operations, and tree structures (29 tests)
- **Plugin System**: Plugin loading, configuration, and lifecycle management (11 tests)
- **Security Features**: Authentication, encryption, and access control (30+ tests)
- **Utility Functions**: Helper functions and shared components (6+ tests)

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

## 🏠 Self-Hosting

Take full control of your data by hosting Notefinity Core on your own infrastructure. Our self-hosting options provide complete transparency and data sovereignty.

### 🚀 Quick Start - CapRover (Recommended)

**Perfect for beginners** - One-click deployment with web dashboard:

```bash
# Install CapRover CLI
npm install -g caprover

# Deploy instantly
npm run deploy:caprover
```

### 🐳 Docker Deployment

**For advanced users** - Maximum control and flexibility:

```bash
# Build and run
npm run docker:build
npm run docker:run

# Or manually
docker build -t notefinity-core .
docker run -p 3000:3000 --env-file .env notefinity-core
```

### 📋 Deployment Methods Comparison

| Method       | Difficulty  | Best For                      | Features                              |
| ------------ | ----------- | ----------------------------- | ------------------------------------- |
| **CapRover** | ⭐ Easy     | Beginners, small-medium apps  | Web dashboard, auto SSL, scaling      |
| **Docker**   | ⭐⭐ Medium | Advanced users, custom setups | Full control, container orchestration |

### 🛠️ Prerequisites

All deployment methods require:

1. **CouchDB Instance** - Your database (can be self-hosted or cloud)
2. **Environment Setup** - Configure from `.env.example`
3. **Domain/Server** - Where your app will live

### ⚙️ Essential Configuration

```bash
# Copy and configure environment
cp .env.example .env
```

**Required Variables:**

- `COUCHDB_URL` - Your CouchDB instance URL
- `COUCHDB_USERNAME` & `COUCHDB_PASSWORD` - Database credentials
- `JWT_SECRET` - Strong authentication secret (32+ characters)

### 📖 Comprehensive Self-Hosting Guide

For detailed instructions, troubleshooting, and advanced configurations:

**📁 [Complete Self-Hosting Documentation](self-hosting/)**

- **CapRover Guide:** [self-hosting/caprover/](self-hosting/caprover/) - Step-by-step CapRover deployment
- **Docker Setup:** [Dockerfile](Dockerfile) - Production-ready containerization
- **All Options:** [self-hosting/README.md](self-hosting/README.md) - Compare all deployment methods

### 🔐 Why Self-Host?

✅ **Complete Data Control** - Your data never leaves your servers  
✅ **Full Transparency** - Audit every line of code that handles your data  
✅ **Cost Effective** - No recurring SaaS fees  
✅ **Customizable** - Modify and extend as needed  
✅ **Privacy Compliant** - Meet any regulatory requirements

### 🆘 Self-Hosting Support

- **Setup Issues:** Check [self-hosting documentation](self-hosting/)
- **Configuration Help:** Review [environment examples](.env.example)
- **Community Support:** Create an issue in this repository

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

This is the open source core package of Notefinity. It provides the fundamental page management functionality that can be extended with proprietary plugins and features.

## Features

- **Page Management**: Create, read, update, and delete pages
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
import { PageManager } from '@notefinity/core';

// Create a page manager instance
const pageManager = new PageManager();

// Create a root space
const space = pageManager.createPage('My Workspace', '', 'user123', 'space');

// Create a folder in the space
const folder = pageManager.createPage(
  'Documents',
  '',
  'user123',
  'folder',
  space._id
);

// Create a page in the folder
const page = pageManager.createPage(
  'My First Page',
  'This is the content of my page.',
  'user123',
  'page',
  folder._id
);

// Get all pages for a user
const userPages = pageManager.getPagesByUserId('user123');

// Get root spaces for a user
const spaces = pageManager.getSpacesByUserId('user123');

// Get children of a node
const folderContents = pageManager.getChildNodes(folder._id);

// Update a page
pageManager.updatePage(page._id, {
  title: 'Updated Title',
  content: 'Updated content',
});

// Delete a page
pageManager.deletePage(page._id);
```

## API Documentation

### PageManager

The main class for managing pages.

#### Constructor

```typescript
constructor(logger?: Logger)
```

- `logger` (optional): Custom logger implementation. Defaults to `ConsoleLogger`.

#### Methods

##### `createPage(title: string, content: string, userId: string, type?: NodeType, parentId?: string): Page`

Creates a new page with hierarchical structure support. The `type` defaults to 'page', and `parentId` can be specified to create nested nodes.

##### `getPage(id: string): Page | undefined`

Retrieves a page by its ID.

##### `getAllPages(): Page[]`

Returns an array of all pages.

##### `getPagesByUserId(userId: string): Page[]`

Returns all pages belonging to a specific user.

##### `getSpacesByUserId(userId: string): Page[]`

Returns root-level spaces for a user (nodes with no parent).

##### `getChildNodes(parentId: string): Page[]`

Returns child nodes of a parent, sorted by position.

##### `updatePage(id: string, updates: Partial<Pick<Page, 'title' | 'content' | 'tags'>>): Page | undefined`

Updates an existing page with the provided changes.

##### `deletePage(id: string): boolean`

Deletes a page by its ID. Returns `true` if successful, `false` if page not found.

### Types

```typescript
type NodeType = 'space' | 'folder' | 'page';

interface Page {
  _id: string;
  _rev?: string; // CouchDB revision
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  userId: string;
  // Hierarchical tree structure
  type: NodeType;
  parentId?: string; // Parent node ID (undefined for root spaces)
  position: number; // Order within parent
  children?: string[]; // Array of child node IDs
  // End-to-end encryption support
  isEncrypted?: boolean; // Whether content is encrypted
  encryptedContent?: EncryptedBlob; // Encrypted content blob
  encryptedTitle?: EncryptedBlob; // Encrypted title blob
}

interface EncryptedBlob {
  algorithm: string; // e.g., "RSA-OAEP+AES-256-GCM"
  data: string; // Base64 encoded encrypted data
  keyHint?: string; // Optional key identifier hint
  version: number; // Encryption format version
}

interface UserPublicKey {
  _id: string;
  _rev?: string;
  userId: string;
  publicKey: string; // User's public key
  keyId: string; // Client-defined key identifier
  algorithm: string; // Supported encryption algorithm
  createdAt: Date;
  updatedAt: Date;
}

interface Logger {
  log(level: LogLevel, message: string, ...args: any[]): void;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

## Development

### Prerequisites

- Node.js >= 20.0.0
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
├── page-manager.ts    # Main PageManager class
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

const pageManager = new PageManager(new CustomLogger());
```

### Plugin Architecture

The PageManager can be extended to support plugins:

```typescript
import { PageManager, Page } from '@notefinity/core';

class ExtendedPageManager extends PageManager {
  private plugins: Plugin[] = [];

  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  // Override methods to call plugins
  createPage(
    title: string,
    content: string,
    userId: string,
    type?: NodeType,
    parentId?: string
  ): Page {
    const page = super.createPage(title, content, userId, type, parentId);

    // Call plugin hooks
    this.plugins.forEach((plugin) => {
      if (plugin.onPageCreated) {
        plugin.onPageCreated(page);
      }
    });

    return page;
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
