# Realtime Collaboration Architecture Overview

> **📖 TECHNICAL OVERVIEW**
>
> This document provides a high-level explanation of how the proprietary realtime collaboration architecture it built on top of Notefinity Core's end-to-end encryption infrastructure and how it keeps its communication completely private.
>
> **For complete implementation details, see:** `/main/REALTIME_COLLABORATION_IMPLEMENTATION.md`

## Overview

This document outlines the architectural principles for implementing Yjs-based realtime collaboration while maintaining Notefinity's zero-knowledge end-to-end encryption. The solution enables Google Docs-level collaborative editing with Signal-level privacy guarantees.

## Architecture Principles

### Zero-Knowledge Collaboration

- **Server Role**: Pure encrypted message relay with no decryption capability
- **Client Responsibility**: All encryption, decryption, and conflict resolution
- **Operation-Level Encryption**: Yjs operations are encrypted individually before transmission
- **Session Key Management**: Collaborative sessions use shared AES keys encrypted with participant RSA public keys

### Security Model

```
┌─────────────────┐     Encrypted Ops    ┌──────────────────┐     Encrypted Ops    ┌─────────────────┐
│   Client A      │ ◄──────────────────► │   Notefinity     │ ◄──────────────────► │   Client B      │
│                 │                      │   Server         │                      │                 │
│ ┌─────────────┐ │                      │                  │                      │ ┌─────────────┐ │
│ │ Yjs Doc     │ │                      │ ┌──────────────┐ │                      │ │ Yjs Doc     │ │
│ │ (plaintext) │ │                      │ │ Encrypted    │ │                      │ │ (plaintext) │ │
│ └─────────────┘ │                      │ │ Operations   │ │                      │ └─────────────┘ │
│                 │                      │ │ Store        │ │                      │                 │
│ ┌─────────────┐ │                      │ └──────────────┘ │                      │ ┌─────────────┐ │
│ │ Session Key │ │                      │                  │                      │ │ Session Key │ │
│ │ (AES-256)   │ │                      │ No decryption    │                      │ │ (AES-256)   │ │
│ └─────────────┘ │                      │ capability       │                      │ └─────────────┘ │
└─────────────────┘                      └──────────────────┘                      └─────────────────┘
```

## Key Architectural Concepts

### Operation-Level Encryption

Instead of encrypting entire documents, individual Yjs operations (insertions, deletions, formatting changes) are encrypted before transmission. This approach:

- **Preserves Real-Time Performance**: Small, frequent encrypted payloads
- **Maintains CRDT Properties**: Conflict resolution happens client-side after decryption
- **Enables Efficient Sync**: Only transmit encrypted deltas, not full documents

### Session Key Management

Collaborative sessions use hybrid encryption:

1. **AES-256-GCM session key** for fast operation encryption/decryption
2. **RSA-OAEP public key encryption** to securely share session keys
3. **Per-document session isolation** to limit blast radius of key compromise
4. **Leverages existing public key registry** from Notefinity Core E2E infrastructure

### Zero-Knowledge Server Architecture

The collaboration server acts as a pure encrypted message relay:

```
Client A ──encrypted ops──> Server ──encrypted ops──> Client B
   ↑                           ↓                         ↓
Decrypt/Apply              Store Blobs              Decrypt/Apply
   ↓                           ↑                         ↑
Yjs Document              No Decryption             Yjs Document
(plaintext)                Capability               (plaintext)
```

## Core Infrastructure Requirements

### Foundation Components (Available in Notefinity Core)

- **End-to-End Encryption Types**: `EncryptedBlob` interface and validation schemas
- **Public Key Registry**: User public key storage and retrieval for collaboration setup
- **User Authentication**: JWT-based authentication with user isolation
- **Database Abstraction**: CouchDB service layer for storing encrypted collaboration data
- **Plugin Architecture**: Extensibility framework for adding collaboration features

### Required Extensions (Proprietary Implementation)

- **WebSocket Infrastructure**: Real-time message broadcasting between clients
- **Session Management**: Collaborative session lifecycle and participant management
- **Yjs Integration**: Conflict-free replicated data type operations with encryption
- **Operation Persistence**: Encrypted operation storage for late-joining participants

## Implementation Architecture

### Client-Side Responsibilities

1. **Yjs Document Management**: Maintain CRDT state in browser memory (plaintext)
2. **Operation Encryption**: Encrypt each Yjs update before network transmission
3. **Session Key Management**: Decrypt and store AES session keys using RSA private keys
4. **Conflict Resolution**: Apply incoming decrypted operations to local Yjs document
5. **User Interface**: Collaborative cursors, presence indicators, access controls

### Server-Side Responsibilities

1. **Message Relay**: Broadcast encrypted operations between session participants
2. **Session Management**: Coordinate participant joins, leaves, and permissions
3. **Operation Persistence**: Store encrypted operations for late-joining participants
4. **Authentication**: Validate JWT tokens and enforce session access controls
5. **Audit Logging**: Log collaboration events without accessing plaintext content

## Integration with Notefinity Core

### Extending Existing Types

The collaboration system builds on Notefinity Core's encryption infrastructure:

```typescript
// Extends existing EncryptedBlob pattern
interface EncryptedYjsOperation extends EncryptedBlob {
  documentId: string;
  userId: string;
  timestamp: number;
  sequence: number;
}

// Leverages existing public key registry
interface CollaborationSession {
  participants: SessionParticipant[];
  encryptedSessionKey: Map<string, EncryptedSessionKey>;
  // Uses getUserPublicKey() from existing DatabaseService
}
```

### Database Schema Extensions

```typescript
// New collections for collaboration data
interface CollaborationOperations {
  sessionId: string;
  operations: EncryptedYjsOperation[];
  // Stored using existing encrypted blob patterns
}

interface CollaborationSessions {
  sessionId: string;
  documentId: string; // References existing Page._id
  participants: SessionParticipant[];
  // Uses existing user isolation patterns
}
```

## Security Properties

### Zero-Knowledge Guarantees

- **Server Cannot Decrypt**: Operations are encrypted with session keys that only participants possess
- **Perfect Forward Secrecy**: Session keys can be rotated, limiting exposure of historical operations
- **Selective Sharing**: Document owners explicitly choose collaborators via public key registry
- **Audit Transparency**: All server operations are logged and auditable (without plaintext access)

### Attack Resistance

- **Replay Attacks**: Mitigated by sequence numbers and timestamps in operations
- **Man-in-the-Middle**: End-to-end encryption prevents server-side content tampering
- **Session Hijacking**: Cryptographically secure session IDs with participant validation
- **Data Exfiltration**: Server compromise cannot reveal plaintext operations or documents

### Access Control Model

- **Per-Session Permissions**: Read-only vs. read-write access control per participant
- **Creator Control**: Document owners manage participant invitations and permissions
- **Time-Based Expiration**: Sessions can have automatic expiration for security
- **Granular Logging**: Participant activities logged without content exposure

## Benefits of This Architecture

### For Privacy-Conscious Users

- **True Zero-Knowledge Collaboration**: Server cannot decrypt any operations or document content
- **Client-Side Control**: All encryption/decryption happens in user's browser with their keys
- **Selective Sharing**: Granular control over who can access each collaborative session
- **Audit Transparency**: Complete visibility into server operations and data handling

### For Performance

- **Real-Time Synchronization**: Yjs CRDT enables fast, conflict-free collaborative editing
- **Efficient Operation Encryption**: Small, frequent encrypted payloads instead of full documents
- **Optimistic Updates**: Local changes appear instantly, sync happens in background
- **Scalable WebSocket Architecture**: Supports many concurrent collaborative sessions

### For Developers

- **Extends OSS Foundation**: Builds cleanly on existing Notefinity Core encryption infrastructure
- **Modular Design**: Collaboration features can be enabled/disabled per deployment
- **Standards-Based**: Uses proven Yjs CRDT and Web Crypto API standards
- **Future-Proof**: Architecture supports advanced features like collaborative cursors

## Implementation Status

### ✅ Available in Notefinity Core (OSS)

- End-to-end encryption infrastructure (`EncryptedBlob`, validation schemas)
- Public key registry for secure collaboration setup
- JWT authentication with user isolation
- CouchDB service layer for encrypted data storage
- Plugin system for extensible functionality

### 🔒 Requires Proprietary Cloud Service

- WebSocket servers for real-time operation broadcasting
- Yjs integration and CRDT conflict resolution
- Session management and participant invitation system
- Collaborative cursors, presence awareness, and advanced UI
- Performance optimizations and horizontal scaling infrastructure

---

**For complete implementation details with code examples, see:** `/main/REALTIME_COLLABORATION_IMPLEMENTATION.md`
