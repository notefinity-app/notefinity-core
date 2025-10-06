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

## 🏗️ Full-Stack Architecture

### Integrated Server & Client

- **Express.js API Server** - RESTful endpoints with security middleware
- **React SPA Integration** - Serves compiled client from single port
- **Static File Serving** - Optimized asset delivery with caching
- **SPA Routing Support** - Client-side routing with fallback handling

### API & Authentication

- **JWT Authentication** - Secure token-based auth system
- **RESTful API** - All endpoints under `/api/*` namespace
- **Rate Limiting** - Protection against abuse and attacks

## 🔄 Version Compatibility

This project uses **hybrid versioning** for independent yet compatible releases:

- **Core (Backend)**: v1.3.1 - This open-source server
- **Main (Frontend)**: v1.3.1 - Proprietary React client

**Compatibility**: Major.Minor versions are coordinated, patches are independent. Use `npm run release:status` to check compatibility. See [VERSION_STRATEGY.md](../VERSION_STRATEGY.md) for full strategy.

- **CORS Configuration** - Secure cross-origin resource sharing

### Data Layer

- **CouchDB Integration** - Document-based storage for user isolation
- **Hierarchical Pages** - Tree structure support (spaces → folders → pages)
- **End-to-End Encryption** - Client-side encryption with zero-knowledge server
- **Real-time Sync** - CouchDB changes feed for live collaboration

### Plugin Architecture

- **Extensible System** - Add premium features through auditable plugins
- **Transparent Operations** - All plugin code uses same visible APIs
- **Context Isolation** - Controlled access to server resources
- **Monorepo Integration** - Seamless integration with proprietary extensions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- CouchDB 3.x running locally or accessible URL

### Installation & Setup

This project is part of a monorepo structure. For full functionality, you'll need both projects:

```bash
# Clone both repositories
git clone https://github.com/notefinity-app/notefinity-core.git core
git clone https://github.com/your-org/notefinity-main-private.git main

# Install dependencies
cd core && npm install
cd ../main && npm install

# Configure environment
cd ../core
cp .env.example .env
# Edit .env: Set JWT_SECRET, COUCHDB_URL, etc.

# Full build process
cd ../
./build-all.sh

# Start the integrated server
cd core && npm start
```

### Development Modes

```bash
# Option 1: Full build and start
./build-all.sh && cd core && npm start

# Option 2: Development with auto-rebuild
cd core && npm run dev:watch     # Server with auto-restart
cd main && npm run dev:client    # React dev server (port 3000)

# Option 3: Development without authentication (fastest)
cd core && npm run dev:no-auth   # No auth required for API testing
cd main && npm run dev:full      # Client + API with auth bypass

# Option 4: Individual builds
cd main && npm run build         # Build React SPA + server extensions
cd ../core && npm run build      # Build API server + copy client
```

**🔐 Authentication in Development:**

For faster development, authentication can be disabled:

```bash
# Skip authentication (recommended for development)
NODE_ENV=development SKIP_AUTH=true npm run dev

# All API endpoints work without tokens
curl http://localhost:3001/api/pages
curl http://localhost:3001/api/sync/data
```

### Testing

```bash
# Run server tests
cd core && npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🌐 URL Structure

The server serves both API and React SPA from a single port:

- **`http://localhost:3001/`** - React SPA (root and client-side routes)
- **`http://localhost:3001/api/*`** - RESTful API endpoints
- **`http://localhost:3001/health`** - Server health check
- **`http://localhost:3001/assets/*`** - Static assets (CSS, JS, images)

All non-API routes serve the React SPA, enabling client-side routing.

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)

### Pages Management (`/api/pages`)

- `GET /api/pages` - Get all user pages (authenticated)
- `GET /api/pages/:id` - Get specific page (authenticated)
- `POST /api/pages` - Create new page (authenticated)
- `PUT /api/pages/:id` - Update page (authenticated)
- `DELETE /api/pages/:id` - Delete page (authenticated)

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

## � Documentation

- **[Self-Hosting Guide](./self-hosting/README.md)** - Deploy your own instance
- **[End-to-End Encryption](./E2E_ENCRYPTION.md)** - Security implementation details

## �🔍 Audit & Verification

This codebase is designed for complete auditability:

1. **No Hidden Operations**: Every database operation is explicit
2. **Clear Data Flow**: Follow data from API to database
3. **Minimal Dependencies**: Carefully chosen, well-maintained packages
4. **Full-Stack Transparency**: Client and server code both visible
5. **Comprehensive Tests**: All functionality is tested
6. **Plugin Transparency**: Extensions operate on same codebase

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
