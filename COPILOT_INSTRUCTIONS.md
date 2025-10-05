# Copilot Instructions for Notefinity Core (OSS)

## Project Context

This is the **open-source core** of Notefinity, a privacy-focused knowledge management system. The primary purpose of this codebase is to demonstrate **complete transparency** - proving that the backend cannot access user data inappropriately.

**License**: AGPL v3.0-or-later - This copyleft license ensures that any modifications or services built on this code must also be open source, protecting against competitors building proprietary services on our transparent foundation.

## Architecture Overview

### Core Components

- **Express.js API Server**: RESTful endpoints with security middleware
- **JWT Authentication**: Stateless, secure token-based auth
- **CouchDB Integration**: Document database for user data isolation
- **Plugin System**: Extensible architecture for premium features
- **Transparency Layer**: All operations are auditable and visible

### Key Design Principles

1. **User Data Isolation**: Each user's data is completely separated
2. **No Hidden Operations**: Every database query and API call is explicit
3. **Plugin Transparency**: Premium features use the same auditable codebase
4. **Security by Design**: Multiple layers of protection and validation

## File Structure Guide

```
src/
├── server.ts              # Main Express application and startup
├── index.ts               # Public API exports
├── types.ts               # TypeScript interfaces and types
├── page-manager.ts        # In-memory page management
├── services/
│   ├── auth-service.ts    # JWT authentication and password hashing
│   ├── database-service.ts # CouchDB operations and user isolation
│   ├── logger.ts          # Structured logging service
│   └── plugin-manager.ts  # Plugin discovery and loading
├── routes/
│   ├── auth.ts           # Authentication endpoints (login/register)
│   ├── pages.ts          # CRUD operations for pages
│   └── sync.ts           # Synchronization and CouchDB compatibility
├── middleware/
│   └── auth.ts           # JWT token validation middleware
└── utils/               # Utility functions and helpers
```

## Development Guidelines

### When Adding New Features

1. **Maintain Transparency**: All operations must be auditable
2. **User Isolation**: Always validate user access to data
3. **Error Handling**: Comprehensive error handling with logging
4. **Type Safety**: Use TypeScript types for all interfaces
5. **Security**: Input validation, rate limiting, auth checks

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
- **Rate Limiting**: Prevent abuse with express-rate-limit
- **CORS**: Configure allowed origins properly
- **JWT**: Secure token generation and validation
- **Password Hashing**: Use bcrypt with proper salt rounds

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
interface Page {
  _id: string;
  _rev?: string;
  title: string; // Page title
  content: string; // Page content (Markdown/plain text)
```

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

## Future Development

### Planned Enhancements

- Real-time collaboration features (transparent implementation)
- Advanced search capabilities (local processing only)
- Export/import functionality (user-controlled)
- Enhanced plugin API (maintaining transparency)

### Maintaining Transparency

When adding features:

1. Document all new data flows
2. Maintain user isolation boundaries
3. Keep plugin system auditable
4. Ensure no hidden operations are introduced

---

This codebase serves as proof that Notefinity cannot access user data inappropriately. Every operation is visible, auditable, and designed with privacy as the primary concern.
