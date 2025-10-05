# Changelog

All notable changes to the Notefinity Core project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
