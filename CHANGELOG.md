# Changelog

All notable changes to the Notefinity Core project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **📊 SIGNIFICANTLY IMPROVED TEST COVERAGE**: Enhanced testing infrastructure for better code reliability

  - **Server Class Testing**: Comprehensive test suite for `NotefinityServer` class (18 tests)

    - Server initialization and configuration validation
    - Middleware setup verification (CORS, security, rate limiting)
    - Route mounting and endpoint registration testing
    - Health endpoint and 404 handler validation
    - Database initialization and error handling
    - Startup procedure and logging verification

  - **Type System Validation**: Complete TypeScript interface testing (20 tests)

    - All core interfaces (`NodeType`, `Page`, `User`, `ApiResponse`)
    - Encryption types (`EncryptedBlob`, `UserPublicKey`)
    - Plugin system types (`Plugin`, `PluginContext`)
    - Logger interface validation with runtime verification
    - Comprehensive type safety assurance

  - **Enhanced Plugin Manager Testing**: Extended plugin system coverage (11 tests)

    - Plugin loading and validation scenarios
    - Configuration management testing
    - Error handling for invalid plugins
    - Plugin lifecycle management

  - **Type Re-export Organization**: Populated `src/types/index.ts` for better import structure

### Testing

- **Coverage Achievement**: Increased from 71.34% to **76.08%** (+4.74 percentage points)
- **Test Count Growth**: Expanded from 160 to 200 tests (+40 comprehensive tests)
- **Server Coverage**: `server.ts` improved from 17.79% to **90.67%** (+72.88pp)
- **Reliability**: All 200 tests pass consistently with stable execution
- **Strategic Focus**: Targeted lowest-coverage areas for maximum impact

### Developer Experience

- Enhanced test organization with dedicated test files for major components
- Improved mocking strategies for complex integration scenarios
- Better type safety validation in development workflow
- More reliable CI/CD pipeline with comprehensive test coverage

## [1.1.0] - 2025-10-05

### Added

- **🔒 END-TO-END ENCRYPTION SUPPORT**: Major privacy feature implementation

  - **Client-side only encryption/decryption** - Server has zero decrypt capability
  - **User-controlled key management** - Private keys stored in password managers
  - **Zero-knowledge server architecture** - Only encrypted blobs stored server-side
  - **Complete data transparency** - All server operations are auditable
  - **Optional collaboration features** - Public key registry for encrypted sharing
  - **Mixed content support** - Encrypted and unencrypted pages can coexist
  - **Full backward compatibility** - Existing unencrypted pages remain accessible

- **New Data Structures**:

  - `EncryptedBlob` interface for opaque encrypted data storage
  - Extended `Page` interface with encryption fields (`isEncrypted`, `encryptedContent`, `encryptedTitle`)
  - `UserPublicKey` interface for collaboration key registry
  - Enhanced database schemas with encryption support

- **Public Key Registry API** (`/api/keys/*`):

  - `POST /api/keys/store-public-key` - Store user's public key for collaboration
  - `GET /api/keys/public-key/:userId` - Retrieve another user's public key
  - `GET /api/keys/my-public-key` - Get own public key information
  - `DELETE /api/keys/my-public-key` - Remove public key from registry

- **Enhanced Pages API**: All existing `/api/pages/*` endpoints now support encrypted content

  - Automatic detection of encrypted vs unencrypted content
  - Proper validation schemas for both content types
  - Consistent API response serialization with encryption fields

- **Database Enhancements**:

  - New `notefinity_keystores` database for public key registry
  - Enhanced indexes for encrypted data operations
  - Keystore operations (create, read, update, delete public keys)
  - User isolation for all keystore operations

- **Comprehensive Documentation**:

  - `E2E_ENCRYPTION.md` - Complete implementation and usage guide
  - Client-side integration examples with Web Crypto API
  - Security architecture documentation
  - Migration strategy for existing users

- **Extensive Testing**: Added 6 new encryption tests (32 total tests)
  - Encrypted page storage and retrieval
  - Public key registry operations
  - Server transparency verification
  - Mixed encrypted/unencrypted scenarios

### Security

- **Ultimate Privacy Assurance**: Even if Notefinity servers are compromised, user data remains secure
- **No server-side decryption capability** - Server cannot access plaintext content under any circumstances
- **Private key protection** - Private keys never transmitted to or stored on server
- **Auditable operations** - All server code is transparent and verifiable
- **Zero data leakage** - Server only handles opaque encrypted blobs

### Changed

- Enhanced all API response serialization to include encryption metadata when present
- Updated validation schemas to handle encrypted content fields
- Refactored page serialization with helper functions for consistency
- Improved error handling for encryption-related operations

### Developer Experience

- Complete TypeScript type definitions for all encryption interfaces
- Comprehensive JSDoc documentation for all new APIs
- Client-side implementation examples and best practices
- Migration guides for adding encryption to existing applications

## [1.0.2] - 2025-10-05

### Added

- **Hierarchical Page Organization**: Complete tree structure support for pages
  - Three node types: Spaces (root), Folders (containers), and Pages (content)
  - Parent-child relationships with position ordering
  - Recursive deletion for folders with child cleanup
  - Tree navigation with path resolution
- **Enhanced API Endpoints**:
  - `GET /api/pages/spaces` - Get all spaces for user
  - `GET /api/pages/:id/children` - Get child nodes
  - `PATCH /api/pages/:id/move` - Move nodes between parents
  - `GET /api/pages/:id/path` - Get node path from root
- **Database Improvements**:
  - New indexes for efficient tree queries
  - Enhanced CouchDB selectors for parent-child relationships
  - Optimized position management within containers
- **Security Enhancement**: Updated `generateId()` to use `crypto.randomUUID()` for cryptographically secure IDs
- **Comprehensive Testing**: Added 7 new tests for tree structure operations (20 total tests)

### Changed

- Enhanced `Page` interface with tree structure fields (`type`, `parentId`, `position`, `children`)
- Updated all API responses to include tree structure metadata
- Improved validation schemas for node creation and updates

## [1.0.1] - 2025-10-05

### Changed

- **License**: Updated from MIT to AGPL v3.0-or-later for enhanced copyleft protection
- Prevents competitors from building proprietary services on our transparent foundation
- Ensures any modifications or services based on this code remain open source
- Updated documentation to explain AGPL licensing implications

## [1.0.0] - 2025-10-05

### Added

- Initial release of Notefinity Core (OSS)
- Express.js API server with comprehensive security middleware
- JWT-based authentication system with bcrypt password hashing
- CouchDB integration for user data isolation
- Plugin system for extensible premium features
- RESTful API endpoints for pages CRUD operations
- Synchronization endpoints for CouchDB compatibility
- Complete user data isolation and privacy protection
- Comprehensive test suite with 13 passing tests
- Docker Compose setup for easy CouchDB deployment
- Automated setup script for development environment
- Extensive documentation and development guides

### Security

- Rate limiting (100 requests per 15 minutes)
- CORS protection with configurable origins
- Helmet.js security headers
- Input validation with Joi schemas
- Secure JWT token handling
- Password hashing with 12 salt rounds

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - User profile retrieval
- `GET /api/pages` - List user pages
- `POST /api/pages` - Create new page
- `PUT /api/pages/:id` - Update existing page
- `DELETE /api/pages/:id` - Delete page
- `GET /api/sync/data` - Retrieve sync data
- `POST /api/sync/bulk` - Bulk sync operations
- `GET /api/sync/changes` - Real-time changes feed
- `GET /api/sync/info` - Database information
- `GET /health` - Health check endpoint

### Plugin System

- Dynamic plugin loading from plugins directory
- Plugin context API for controlled access to core services
- Sample premium plugin demonstrating integration
- Route and middleware registration for plugins
- Plugin documentation and templates

### Documentation

- Complete README with architecture overview
- Comprehensive development guide (DEVELOPMENT.md)
- API usage examples and troubleshooting
- Plugin development documentation
- Copilot instructions for contributors (COPILOT_INSTRUCTIONS.md)
- Docker setup and deployment guides

### Development Tools

- TypeScript configuration with strict type checking
- Vitest test framework with coverage reporting
- Prettier code formatting
- Automated dependency auditing
- Build and development scripts
- Environment configuration templates

### Transparency Features

- Complete source code visibility
- Auditable database operations
- User data isolation by design
- No hidden external API calls
- Plugin system transparency
- Comprehensive logging and error tracking

## Development Notes

This release establishes the foundation for a completely transparent, privacy-focused knowledge management backend. Every operation is auditable, user data is isolated by design, and premium features are added through the same transparent plugin system.

The codebase serves as proof that Notefinity cannot access user data inappropriately - all operations are visible and verifiable through this open-source implementation.
