# Notefinity Core

Open source core of Notefinity - a modern note-taking and productivity system.

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
  content: 'Updated content'
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

MIT License - see the [LICENSE](LICENSE) file for details.

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