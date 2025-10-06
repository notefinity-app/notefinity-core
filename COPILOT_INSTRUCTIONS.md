# Copilot Instructions for Notefinity Core (OSS)

## Project Context

This is the **open-source core** of Notefinity, a privacy-focused knowledge management system. The primary purpose of this codebase is to demonstrate **complete transparency** - proving that the backend cannot access user data inappropriately.

**License**: AGPL v3.0-or-later - This copyleft license ensures that any modifications or services built on this code must also be open source, protecting against competitors building proprietary services on our transparent foundation.

## Architecture Overview

### Core Components

- **Express.js API Server**: RESTful endpoints with security middleware
- **JWT Authentication**: Stateless, secure token-based auth
- **CouchDB Integration**: Document database for user data isolation
- **End-to-End Encryption**: Client-side only, zero-knowledge server architecture
- **Plugin System**: Extensible architecture for premium features
- **Transparency Layer**: All operations are auditable and visible

### Key Design Principles

1. **User Data Isolation**: Each user's data is completely separated
2. **Zero-Knowledge Server**: Server cannot decrypt user data under any circumstances
3. **Client-Side Encryption**: All encryption/decryption happens in the browser
4. **Hierarchical Organization**: Tree-structured content (spaces → folders → pages)
5. **No Hidden Operations**: Every database query and API call is explicit
6. **Plugin Transparency**: Premium features use the same auditable codebase
7. **Security by Design**: Multiple layers of protection and validation

## File Structure Guide

```
src/
├── server.ts              # Main Express application and startup
├── index.ts               # Public API exports
├── types.ts               # TypeScript interfaces and types
├── page-manager.ts        # Hierarchical page management with tree operations
├── services/
│   ├── auth-service.ts    # JWT authentication and password hashing
│   ├── database-service.ts # CouchDB operations and user isolation
│   ├── logger.ts          # Structured logging service
│   └── plugin-manager.ts  # Plugin discovery and loading
├── routes/
│   ├── auth.ts           # Authentication endpoints (login/register)
│   ├── pages.ts          # Hierarchical page CRUD with encryption support
│   ├── encryption.ts     # Public key registry for collaboration
│   └── sync.ts           # Synchronization and CouchDB compatibility
├── middleware/
│   └── auth.ts           # JWT token validation middleware
└── utils/               # Utility functions and helpers
```

## Development Guidelines

### When Adding New Features

1. **Maintain Transparency**: All operations must be auditable
2. **Zero-Knowledge Principle**: Server must never handle plaintext of encrypted data
3. **User Isolation**: Always validate user access to data
4. **Hierarchical Integrity**: Respect parent-child relationships and user boundaries
5. **Client-Side First**: Encryption/decryption only on client side
6. **Error Handling**: Comprehensive error handling with logging
7. **Type Safety**: Use TypeScript types for all interfaces
8. **Security**: Input validation, rate limiting, auth checks

### Code Patterns to Follow

#### Database Operations

```typescript
// Always include userId validation
async getPageById(id: string, userId: string): Promise<Page | null> {
  const page = await this.pagesDb.get(id);
  if (page.userId !== userId) {
    throw new Error('Access denied');
  }
  return page;
}

// Hierarchical operations require parent validation
async createChildNode(parentId: string, nodeData: Partial<Page>, userId: string): Promise<Page> {
  const parent = await this.getPageById(parentId, userId);
  if (!parent) {
    throw new Error('Parent not found or access denied');
  }
  if (parent.type === 'page') {
    throw new Error('Cannot create children under page nodes');
  }

  // Create child with proper hierarchy
  const child = await this.createPage({
    ...nodeData,
    parentId,
    userId,
    position: parent.children?.length || 0
  });

  // Update parent's children array
  parent.children = parent.children || [];
  parent.children.push(child._id);
  await this.updatePage(parent._id, { children: parent.children });

  return child;
}
```

#### API Endpoints

```typescript
// Always check authentication
if (!req.user) {
  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Authentication required',
  });
  return;
}
```

#### Plugin Integration

```typescript
// Plugins receive context with controlled access
const context: PluginContext = {
  app: expressApp,
  database: databaseService,
  auth: authService,
  logger: loggerService,
};
```

### Testing Requirements

- All new features must have corresponding tests
- Test both success and failure scenarios
- Mock external dependencies (CouchDB, JWT)
- Verify user isolation in multi-user scenarios

### Security Considerations

- **Input Validation**: Use Joi schemas for all user input
- **End-to-End Encryption**: Server only handles opaque encrypted blobs
- **Zero-Knowledge Architecture**: No server-side decryption capability
- **Rate Limiting**: Prevent abuse with express-rate-limit
- **CORS**: Configure allowed origins properly
- **JWT**: Secure token generation and validation
- **Password Hashing**: Use bcrypt with proper salt rounds
- **Client-Side Keys**: Private keys never transmitted to server

## API Design Patterns

### Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Error Handling

- 400: Validation errors (with specific message)
- 401: Authentication required or invalid token
- 403: Access denied (user doesn't own resource)
- 404: Resource not found
- 500: Server errors (with generic message in production)

### Authentication Flow

1. User registers/logs in → receives JWT token
2. Client includes token in `Authorization: Bearer <token>` header
3. Middleware validates token and attaches user info to request
4. Routes check `req.user` for authentication status

## Database Schema

### Users Collection (notefinity_users)

```typescript
interface User {
  _id: string; // CouchDB document ID
  _rev?: string; // CouchDB revision
  name: string; // User's display name
  email: string; // Unique identifier for login
  passwordHash: string; // bcrypt hashed password
  createdAt: Date;
  updatedAt: Date;
}
```

### Pages Collection (notefinity_pages)

```typescript
type NodeType = 'space' | 'folder' | 'page';

interface Page {
  _id: string;
  _rev?: string;
  title: string; // Page title (plaintext or encrypted)
  content: string; // Page content (plaintext or encrypted blob)
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  userId: string; // Owner of this node
  // Hierarchical tree structure
  type: NodeType; // Type of node in the hierarchy
  parentId?: string; // Parent node ID (undefined for root spaces)
  position: number; // Order within parent for sorting
  children?: string[]; // Array of child node IDs (undefined for pages)
  // End-to-end encryption support
  isEncrypted?: boolean; // True if content is encrypted
  encryptedContent?: EncryptedBlob; // Opaque encrypted data
  encryptedTitle?: EncryptedBlob; // Encrypted title if privacy needed
}
```

### Keystores Collection (notefinity_keystores)

```typescript
interface UserPublicKey {
  _id: string;
  _rev?: string;
  userId: string; // Owner of this public key
  publicKey: string; // User's public key (client-defined format)
  keyId: string; // Client-defined unique identifier for the key
  algorithm: string; // Encryption algorithm this key supports
  createdAt: Date;
  updatedAt: Date;
}
```

## Hierarchical Page Organization

### Tree Structure

Notefinity organizes content in a three-level hierarchy:

1. **Spaces** (`type: 'space'`) - Root level containers (like workspaces)
2. **Folders** (`type: 'folder'`) - Organizational containers within spaces
3. **Pages** (`type: 'page'`) - Actual content nodes (leaves in the tree)

### Node Relationships

- **Root Nodes**: Spaces with no `parentId` (top-level containers)
- **Parent-Child**: Each node (except roots) has a `parentId` pointing to its parent
- **Siblings**: Nodes with the same `parentId` are ordered by `position`
- **Children Array**: Non-page nodes maintain a `children` array for quick access

### Implementation Patterns

#### Creating Hierarchical Content

```typescript
// Create a root space for a user
const space = pageManager.createPage('My Workspace', '', userId, 'space');

// Create a folder in the space
const folder = pageManager.createPage(
  'Projects',
  '',
  userId,
  'folder',
  space._id
);

// Create a page in the folder
const page = pageManager.createPage(
  'Project Notes',
  'Content...',
  userId,
  'page',
  folder._id
);
```

#### Querying Hierarchical Data

```typescript
// Get all root spaces for a user
const spaces = pageManager.getSpacesByUserId(userId);

// Get children of a specific node (ordered by position)
const children = pageManager.getChildNodes(parentId);

// Get all pages for a user (flat list)
const allPages = pageManager.getPagesByUserId(userId);
```

#### Tree Navigation Rules

1. **User Isolation**: Always filter by `userId` first
2. **Position Ordering**: Sort siblings by `position` field
3. **Lazy Loading**: Load children on-demand rather than full tree
4. **Parent Validation**: Ensure parent exists and user has access before creating children

### Database Operations

#### Tree Integrity

- **Parent Existence**: Validate parent exists before creating child
- **User Boundary**: Children must belong to same user as parent
- **Position Management**: Automatically assign positions when adding to parent
- **Orphan Prevention**: Handle parent deletion by moving or deleting children

#### Performance Considerations

- **Index by User**: Primary queries filter by `userId` first
- **Index by Parent**: Secondary index on `parentId` for child queries
- **Denormalized Children**: Store `children` array for quick access to child IDs

## Plugin Development

### Plugin Structure

```javascript
module.exports = {
  name: 'plugin-name',
  version: '1.0.0',
  enabled: true,

  async initialize(context) {
    // Setup code with access to app, database, auth, logger
  },

  routes: [
    {
      method: 'GET',
      path: '/api/premium/feature',
      handler: async (req, res) => {
        /* implementation */
      },
      middleware: [], // optional middleware stack
    },
  ],

  middleware: [
    {
      name: 'feature-middleware',
      handler: (req, res, next) => {
        /* implementation */
      },
    },
  ],
};
```

### Plugin Best Practices

- Use the same authentication patterns as core routes
- Maintain user data isolation
- Log operations for transparency
- Handle errors gracefully
- Validate input data

## Environment Configuration

### Required Environment Variables

- `JWT_SECRET`: Secure random string for token signing
- `COUCHDB_URL`: CouchDB connection string with credentials
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

### Optional Configuration

- `JWT_EXPIRES_IN`: Token expiration (default: 7d)
- `ALLOWED_ORIGINS`: CORS allowed origins
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## Debugging and Troubleshooting

### Common Issues

1. **CouchDB Connection**: Check COUCHDB_URL and database availability
2. **JWT Errors**: Verify JWT_SECRET is set and consistent
3. **CORS Issues**: Configure ALLOWED_ORIGINS properly
4. **Plugin Loading**: Check plugins directory and file structure

### Logging

All operations are logged with timestamps and context:

- User authentication attempts
- Database operations
- Plugin loading and route registration
- API requests and responses
- Error conditions

## Transparency and Auditability

### What Makes This Transparent

1. **Complete Source Code**: All backend operations are visible
2. **No External API Calls**: No hidden data collection or analytics
3. **User Isolation**: Impossible to access other users' data
4. **Plugin System**: Premium features use the same transparent base
5. **Database Access**: Direct CouchDB queries are auditable

### Verification Points

- Search codebase for any external HTTP requests
- Verify all database queries include user ID validation
- Check that plugin context provides controlled access only
- Confirm no session storage or hidden state management

## Encryption Implementation

### End-to-End Encryption Architecture

- **Client-Side Only**: All encryption/decryption happens in browser using Web Crypto API
- **Zero-Knowledge Server**: Backend only stores opaque encrypted blobs
- **User-Controlled Keys**: Private keys stored in password managers, never on server
- **Optional Collaboration**: Public key registry enables encrypted sharing
- **Backward Compatible**: Encrypted and unencrypted content coexist seamlessly

### Key Management

```typescript
interface EncryptedBlob {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt?: string; // Optional salt for key derivation
}

interface UserPublicKey {
  _id: string;
  _rev?: string;
  userId: string;
  publicKey: string; // PEM-formatted public key
  keyId?: string; // Optional key identifier
  createdAt: Date;
  updatedAt: Date;
}
```

### Encryption Best Practices

1. **Never Store Private Keys**: Client generates and manages all private keys
2. **Opaque Blob Storage**: Server treats all encrypted data as black boxes
3. **Public Key Validation**: Verify key format and ownership before storage
4. **Mixed Content Support**: Handle both encrypted and unencrypted pages transparently
5. **Audit Trail**: Log all encryption-related operations for transparency

## Self-Hosting & Deployment

### Deployment Architecture

The core is designed for **transparent self-hosting**, enabling users to:

- **Verify Operations**: Run the exact same code that handles their data
- **Data Sovereignty**: Maintain complete control over their information
- **Compliance**: Meet regulatory requirements through self-hosting
- **Cost Control**: Avoid recurring SaaS fees

### Available Deployment Methods

#### CapRover (Recommended for Beginners)

- **Location**: `self-hosting/caprover/`
- **Features**: One-click deployment, web dashboard, automatic SSL
- **Files**: `captain-definition`, deployment script, comprehensive docs
- **Usage**: `npm run deploy:caprover`

#### Docker (For Advanced Users)

- **Location**: Root `Dockerfile` with multi-stage build
- **Features**: Production optimization, security hardening, health checks
- **Usage**: `npm run docker:build && npm run docker:run`

### Deployment Security Considerations

1. **Environment Isolation**: All sensitive config via environment variables
2. **Non-Root User**: Container runs as dedicated user for security
3. **Health Monitoring**: Built-in health check endpoints
4. **Database Security**: CouchDB credentials and access control
5. **JWT Security**: Strong secret generation and rotation

### Self-Hosting File Structure

```
self-hosting/
├── README.md                    # Overview of all deployment options
└── caprover/
    ├── captain-definition       # CapRover deployment config
    ├── deploy-caprover.sh      # Automated deployment script
    ├── caprover-app-config.json # App configuration template
    └── CAPROVER_DEPLOYMENT.md  # Detailed deployment guide
```

### Transparency in Deployment

- **No Hidden Dependencies**: All deployment configs are version controlled
- **Auditable Containers**: Dockerfile shows exact production environment
- **Open Configuration**: All deployment scripts and configs are transparent
- **Self-Contained**: No external services or hidden API calls during deployment

## Future Development

### Planned Enhancements

- Real-time collaboration features with encrypted synchronization
- Advanced search capabilities (client-side indexing of encrypted content)
- Export/import functionality with encryption support
- Enhanced plugin API (maintaining zero-knowledge architecture)
- Multi-device key synchronization via secure channels

### Maintaining Transparency

When adding features:

1. Document all new data flows
2. Maintain user isolation boundaries
3. Preserve zero-knowledge architecture
4. Keep plugin system auditable
5. Ensure no hidden operations are introduced
6. Never add server-side decryption capabilities

---

This codebase serves as proof that Notefinity cannot access user data inappropriately. Every operation is visible, auditable, and designed with privacy as the primary concern.
