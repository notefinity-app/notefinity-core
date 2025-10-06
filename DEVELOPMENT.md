# Notefinity Core - Development Guide

This guide helps you get the Notefinity Core backend up and running for development and demonstration purposes.

## Key Features

- 🔒 **End-to-End Encryption** - Client-side encryption with zero-knowledge server
- 🌳 **Hierarchical Organization** - Spaces → Folders → Pages structure  
- 🔐 **User Data Isolation** - Complete separation of user data
- 🔌 **Transparent Plugin System** - Auditable premium feature architecture
- 📊 **CouchDB Integration** - Document-based storage with sync capabilities
- 🔑 **JWT Authentication** - Secure, stateless authentication

## Quick Start (5 minutes)

### 1. Prerequisites

- **Node.js 18+** (check with `node --version`)
- **npm 8+** (check with `npm --version`)
- **CouchDB** (we'll help you set this up)

### 2. Automated Setup

Run our setup script:

```bash
./setup.sh
````

This will:

- Install all dependencies
- Create environment configuration
- Build the project
- Provide next steps for CouchDB

### 3. Start CouchDB

Choose one option:

**Option A: Docker (Recommended)**

```bash
docker-compose up -d
```

**Option B: Docker without docker-compose**

```bash
docker run -d --name notefinity-couchdb -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=password \
  couchdb:latest
```

**Option C: Local Installation**

```bash
# macOS
brew install couchdb
brew services start couchdb

# Ubuntu/Debian
sudo apt-get install couchdb

# Windows
# Download from: https://couchdb.apache.org/
```

### 4. Start the API Server

```bash
npm start
```

🎉 **That's it!** Your API is now running at http://localhost:3001

## Verification

Test your setup:

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"success":true,"message":"Notefinity Core API is running","timestamp":"...","version":"1.0.0"}
```

## API Usage Examples

### 1. Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

Save the token from the response for the next steps.

### 3. Create a Hierarchical Structure

```bash
# Create a root space
curl -X POST http://localhost:3001/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "My Workspace",
    "content": "",
    "type": "space",
    "tags": ["workspace"]
  }'

# Create a folder in the space (use the space ID from previous response)
curl -X POST http://localhost:3001/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Personal Notes",
    "content": "",
    "type": "folder",
    "parentId": "SPACE_ID_HERE",
    "tags": ["personal"]
  }'

# Create a page in the folder (use the folder ID from previous response)
curl -X POST http://localhost:3001/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "My First Page",
    "content": "This is the content of my page",
    "type": "page",
    "parentId": "FOLDER_ID_HERE",
    "tags": ["test", "development"]
  }'
```

### 4. Create an Encrypted Page

```bash
# Store your public key for collaboration (optional)
curl -X POST http://localhost:3001/api/keys/store-public-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "publicKey": "-----BEGIN PUBLIC KEY-----\nYOUR_PUBLIC_KEY_HERE\n-----END PUBLIC KEY-----",
    "keyId": "my-key-2024",
    "algorithm": "RSA-OAEP+AES-256-GCM"
  }'

# Create an encrypted page (content encrypted client-side before sending)
curl -X POST http://localhost:3001/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "",
    "content": "",
    "type": "page",
    "parentId": "FOLDER_ID_HERE",
    "isEncrypted": true,
    "encryptedTitle": {
      "algorithm": "RSA-OAEP+AES-256-GCM",
      "data": "base64-encrypted-title-data",
      "version": 1
    },
    "encryptedContent": {
      "algorithm": "RSA-OAEP+AES-256-GCM", 
      "data": "base64-encrypted-content-data",
      "version": 1
    }
  }'
```

### 5. Get All Pages

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  http://localhost:3001/api/pages
```

### 6. Get User's Spaces (Root Nodes)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  http://localhost:3001/api/pages/spaces
```

### 7. Get Child Nodes of a Parent

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  http://localhost:3001/api/pages/PARENT_ID/children
```

### 8. Sync Data

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  http://localhost:3001/api/sync/data
```

## Development Workflow

### Running in Development Mode

```bash
# Build and run once
npm run dev

# Watch mode (rebuild on changes)
npm run dev:watch
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# View test UI
npm run test:ui
```

### Code Quality

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Security audit
npm run security:check
```

## Plugin Development

Create a plugin in the `plugins/` directory:

```javascript
// plugins/my-plugin.js
module.exports = {
  name: 'my-premium-feature',
  version: '1.0.0',
  enabled: true,

  async initialize(context) {
    console.log('Premium plugin initialized');
  },

  routes: [
    {
      method: 'GET',
      path: '/api/premium/analytics',
      handler: (req, res) => {
        res.json({
          success: true,
          data: {
            totalNotes: 42,
            activeUsers: 1,
            premiumFeature: 'This could be advanced analytics',
          },
        });
      },
    },
  ],
};
```

## Database Access

CouchDB admin interface: http://localhost:5984/\_utils

Default credentials:

- **Username**: admin
- **Password**: password

You can see the actual databases created by the application and inspect the data structure.

## Environment Configuration

Edit `.env` file to customize:

```bash
# Server
PORT=3001
NODE_ENV=development

# JWT (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Database
COUCHDB_URL=http://admin:password@localhost:5984

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Transparency Features

### Database Inspection

```bash
# View all databases
curl http://admin:password@localhost:5984/_all_dbs

# View specific database info
curl http://admin:password@localhost:5984/notefinity_users

# View all users (admin only)
curl http://admin:password@localhost:5984/notefinity_users/_all_docs?include_docs=true
```

### Log Analysis

All operations are logged with timestamps:

- User registrations and logins
- Page operations (create, read, update, delete)
- Plugin loading and route registration
- Database operations

### Code Audit Points

1. **No Hidden Data Collection**: Search codebase for any external API calls
2. **User Isolation**: Every database query includes user ID validation
3. **No Data Leakage**: Cross-user data access is impossible by design
4. **Plugin Transparency**: All plugins operate on the same auditable codebase

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 PID_NUMBER

# Or change port in .env
echo "PORT=3002" >> .env
```

### CouchDB Connection Issues

```bash
# Check if CouchDB is running
curl http://localhost:5984

# Check Docker container
docker ps | grep couchdb

# View container logs
docker logs notefinity-couchdb
```

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Test Failures

```bash
# Run specific test file
npx vitest tests/services.test.ts

# Run with verbose output
npm test -- --reporter=verbose
```

## Production Deployment

### Security Checklist

- [ ] Change JWT_SECRET to a strong, random value
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Use HTTPS in production
- [ ] Secure CouchDB with proper authentication
- [ ] Set up proper logging and monitoring

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=generate-a-very-secure-random-string
COUCHDB_URL=https://username:password@your-couchdb-server.com
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3001
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["npm", "start"]
```

## Support & Contributing

- **Issues**: Create GitHub issues for bugs or feature requests
- **Security**: Email security issues privately
- **Contributing**: See CONTRIBUTING.md for guidelines
- **License**: MIT - use freely with attribution

---

**Remember**: This is a complete, transparent backend. Every database operation, API call, and data flow is visible in this codebase. Premium features are added through the same transparent plugin mechanism.
