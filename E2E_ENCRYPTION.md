# End-to-End Encryption in Notefinity Core

## Overview

Notefinity Core now supports end-to-end encryption (E2E), ensuring that user data is encrypted on the client side before being sent to the server. The server stores only encrypted data and has no capability to decrypt or access user content.

## Core Principles

### 1. Client-Side Only Encryption

- **All encryption and decryption happens in the browser/client**
- The server has zero knowledge of encryption keys
- Private keys never leave the user's device
- Users store their private keys in password managers or secure local storage

### 2. Server as Encrypted Data Store

- Server stores only opaque encrypted blobs
- No server-side encryption or decryption capabilities
- Server cannot access plaintext content under any circumstances
- Complete transparency - all operations are auditable

### 3. User-Controlled Key Management

- Users generate their own key pairs
- Users manage their own private keys
- Optional public key sharing for collaboration
- Keys stored in user's password manager (recommended)

## Data Structure

### EncryptedBlob

```typescript
interface EncryptedBlob {
  algorithm: string; // e.g., "RSA-OAEP+AES-256-GCM"
  data: string; // Base64 encoded encrypted data
  keyHint?: string; // Optional hint about which key was used
  version: number; // Version for future compatibility
}
```

### Encrypted Page Structure

```typescript
interface Page {
  // Standard fields
  _id: string;
  title: string; // Empty when encrypted
  content: string; // Empty when encrypted
  userId: string;

  // Encryption fields
  isEncrypted?: boolean;
  encryptedContent?: EncryptedBlob; // Encrypted page content
  encryptedTitle?: EncryptedBlob; // Encrypted page title
}
```

## API Endpoints

### Public Key Registry (Optional for Collaboration)

#### Store Public Key

```
POST /api/keys/store-public-key
```

Store a user's public key for collaboration features.

**Request Body:**

```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "keyId": "user-defined-key-id",
  "algorithm": "RSA-OAEP+AES-256-GCM"
}
```

#### Get Public Key

```
GET /api/keys/public-key/:userId
```

Retrieve another user's public key (for encrypting data to share with them).

#### Get My Public Key

```
GET /api/keys/my-public-key
```

Get your own public key information.

#### Delete Public Key

```
DELETE /api/keys/my-public-key
```

Remove your public key from the registry.

### Page Operations with Encryption

All existing page endpoints (`/api/pages/*`) now support encrypted content:

#### Create Encrypted Page

```
POST /api/pages
```

**Request Body (Encrypted):**

```json
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
```

**Request Body (Regular):**

```json
{
  "title": "My Page Title",
  "content": "My page content",
  "isEncrypted": false
}
```

## Client-Side Implementation Guide

### 1. Key Generation (Client-Side)

```javascript
// Generate RSA key pair (client-side only)
async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Export keys for storage
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToPem(publicKey, 'PUBLIC KEY'),
    privateKey: arrayBufferToPem(privateKey, 'PRIVATE KEY'),
  };
}
```

### 2. Encryption (Client-Side)

```javascript
async function encryptPageContent(content, publicKeyPem) {
  // Generate AES key
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);

  // Encrypt content with AES
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(content)
  );

  // Encrypt AES key with RSA
  const publicKey = await importPublicKey(publicKeyPem);
  const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, exportedAesKey);

  return {
    algorithm: 'RSA-OAEP+AES-256-GCM',
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
    encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
    version: 1,
  };
}
```

### 3. Decryption (Client-Side)

```javascript
async function decryptPageContent(encryptedBlob, privateKeyPem) {
  // Import private key
  const privateKey = await importPrivateKey(privateKeyPem);

  // Decrypt AES key
  const encryptedKey = base64ToArrayBuffer(encryptedBlob.encryptedKey);
  const aesKeyData = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedKey);

  // Import AES key
  const aesKey = await crypto.subtle.importKey('raw', aesKeyData, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  // Decrypt content
  const iv = base64ToArrayBuffer(encryptedBlob.iv);
  const encryptedContent = base64ToArrayBuffer(encryptedBlob.data);
  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedContent
  );

  return new TextDecoder().decode(decryptedContent);
}
```

## Security Guarantees

### What the Server Cannot Do

1. **Cannot decrypt user data** - Server has no private keys
2. **Cannot access plaintext content** - All content is encrypted before transmission
3. **Cannot perform man-in-the-middle attacks** - Encryption happens client-side
4. **Cannot be compelled to provide plaintext** - Server simply doesn't have it

### What Users Control

1. **Key generation** - Users generate their own keys
2. **Key storage** - Users store keys in password managers
3. **Encryption/decryption** - All cryptographic operations happen client-side
4. **Data access** - Only users with private keys can decrypt their data

### Transparency Features

1. **Open source server** - All server operations are auditable
2. **No hidden encryption** - Server has no encryption capabilities
3. **Encrypted blob storage** - Server only stores opaque encrypted data
4. **Public key registry** - Optional, transparent collaboration feature

## Migration Strategy

### Existing Users

- Existing unencrypted pages remain accessible
- Users can gradually encrypt pages as needed
- Mixed encrypted/unencrypted content is supported

### New Users

- Can start with encryption enabled from day one
- Generate keys during account setup
- Store private key in password manager

## Collaboration Features

### Shared Encryption

1. User A generates content
2. User A encrypts content with User B's public key
3. User A stores encrypted content on server
4. User B retrieves and decrypts with their private key

### Public Key Registry

- Optional feature for collaboration
- Users can publish public keys
- Server facilitates public key discovery
- Private keys always remain client-side

## Implementation Status

### ✅ Completed

- [x] Encrypted blob data structures
- [x] Server-side encrypted data storage
- [x] API endpoints for encrypted pages
- [x] Public key registry (optional)
- [x] Mixed encrypted/unencrypted support
- [x] Comprehensive test coverage

### 🚧 Client Implementation Needed

- [ ] Client-side encryption library
- [ ] Key generation UI
- [ ] Password manager integration
- [ ] Encryption toggle in UI
- [ ] Key sharing interface

## Best Practices

### For Developers

1. **Never implement server-side decryption**
2. **Treat encrypted blobs as opaque data**
3. **Validate blob structure but not contents**
4. **Log operations but never log decrypted content**

### For Users

1. **Store private keys in password managers**
2. **Generate strong key pairs (2048-bit minimum)**
3. **Back up keys securely**
4. **Use unique keys per device/application**

## Testing

The implementation includes comprehensive tests covering:

- Encrypted page storage and retrieval
- Public key registry operations
- Mixed encrypted/unencrypted scenarios
- Server transparency verification
- Data structure validation

Run tests with: `npm test`

## Conclusion

This implementation provides true end-to-end encryption where:

- **Users have complete control** over their encryption keys
- **The server cannot access plaintext data** under any circumstances
- **All operations are transparent** and auditable
- **Collaboration is possible** through public key sharing
- **Migration is seamless** for existing users

The architecture ensures that even if the server is compromised, user data remains secure because the server simply has no capability to decrypt it.
