# IPFS Module

The IPFS module provides comprehensive file storage and management capabilities for the Aether platform using IPFS (InterPlanetary File System) for decentralized file storage.

## Features

- **File Upload**: Upload single files, directories, and metadata to IPFS
- **File Validation**: Comprehensive file validation with type-specific rules
- **CID Management**: Pin/unpin CIDs and retrieve file information
- **Attachment Support**: Handle file attachments for messages, channels, and communities
- **Permission Checks**: Robust permission system for file access
- **Metadata Persistence**: Store file metadata in PostgreSQL database
- **Gateway Support**: Multiple IPFS gateway support with fallback options
- **Batch Operations**: Support for batch file uploads

## Architecture

### Services

#### IPFSStorageService
- Handles direct IPFS operations (upload, pin, unpin, fetch)
- Manages IPFS client connections
- Provides gateway URL generation with fallback support
- Includes health checks for IPFS node connectivity

#### FileValidationService
- Validates files before upload
- Type-specific validation rules (avatar, community, attachment, metadata)
- File size, MIME type, and extension checking
- Magic number validation for file content verification
- File name sanitization and safe name generation

#### IPFSService
- Main service coordinating IPFS operations
- Integrates with database for metadata persistence
- Handles file-to-entity relationships (users, communities, channels)
- Provides comprehensive file management capabilities
- Includes permission checks and access control

#### AttachmentService
- Specialized service for file attachments
- Handles attachments for messages, channels, and communities
- Permission-based access control
- Relationship management between files and entities

### Controllers

#### IPFSController
- Main controller for IPFS operations
- Endpoints for file upload, metadata upload, directory upload
- CID management endpoints (pin, unpin, info)
- User file management endpoints
- Health check endpoint

#### AttachmentController
- Controller for attachment operations
- Endpoints for message, channel, and community attachments
- Attachment retrieval and deletion
- Permission-based access control

### DTOs

#### UploadFileDto
- Data transfer object for file uploads
- Includes purpose, description, pin option, and metadata
- Supports different file purposes (avatar, community, attachment, metadata)

#### IPFSUploadResponseDto
- Response DTO for file uploads
- Includes CID, size, name, MIME type, gateway URLs
- Provides fallback gateway URLs for redundancy

#### AttachmentResult
- Response DTO for attachment operations
- Includes file details and metadata
- Used for attachment retrieval

## Database Schema

### File Model
```prisma
model File {
  id          String   @id @default(cuid())
  uploader    User     @relation(fields: [uploaderId], references: [id])
  uploaderId  String
  community   Community? @relation(fields: [communityId], references: [id])
  communityId String?
  channel     Channel? @relation(fields: [channelId], references: [id])
  channelId   String?
  message     Message? @relation(fields: [messageId], references: [id])
  messageId   String?
  filename    String   @db.VarChar(256)
  mimeType    String   @db.VarChar(128)
  size        Int
  url         String   @db.VarChar(512)
  cid         String   @db.VarChar(128)
  purpose     String   @db.VarChar(50) @default("other")
  description String?  @db.Text
  metadata    Json?
  pinned      Boolean  @default(true)
  createdAt   DateTime @default(now())
  deletedAt   DateTime?

  @@index([uploaderId])
  @@index([communityId])
  @@index([channelId])
  @@index([messageId])
  @@index([cid])
  @@index([purpose])
}
```

### FilePurpose Enum
```prisma
enum FilePurpose {
  AVATAR
  COMMUNITY
  ATTACHMENT
  METADATA
  OTHER
}
```

## API Endpoints

### IPFS Endpoints

#### Upload Operations
- `POST /api/ipfs/upload` - Upload single file
- `POST /api/ipfs/upload/metadata` - Upload metadata
- `POST /api/ipfs/upload/directory` - Upload directory
- `POST /api/ipfs/upload/batch` - Batch upload files

#### File Management
- `GET /api/ipfs/file/:id` - Get file by ID
- `GET /api/ipfs/cid/:cid` - Get file by CID
- `GET /api/ipfs/info/:cid` - Get CID information
- `GET /api/ipfs/files` - Get user's files
- `DELETE /api/ipfs/file/:id` - Delete file

#### CID Management
- `POST /api/ipfs/pin` - Pin CID
- `DELETE /api/ipfs/pin` - Unpin CID

#### Utility
- `PUT /api/ipfs/file/:id/community/:communityId` - Link file to community
- `GET /api/ipfs/health` - Health check

### Attachment Endpoints

#### Upload Attachments
- `POST /api/attachments/message/:messageId` - Upload message attachment
- `POST /api/attachments/channel/:channelId` - Upload channel attachment
- `POST /api/attachments/community/:communityId` - Upload community attachment

#### Retrieve Attachments
- `GET /api/attachments/message/:messageId` - Get message attachments
- `GET /api/attachments/channel/:channelId` - Get channel attachments
- `GET /api/attachments/:id` - Get attachment by ID

#### Manage Attachments
- `DELETE /api/attachments/:id` - Delete attachment

## File Validation Rules

### Avatar Files
- Max size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP
- Max filename length: 100 characters

### Community Files
- Max size: 10MB
- Allowed types: JPEG, PNG, GIF, WebP, SVG
- Max filename length: 100 characters

### Attachment Files
- Max size: 25MB
- Allowed types: Images, PDF, JSON, Text, Markdown
- Max filename length: 255 characters

### Metadata Files
- Max size: 1MB
- Allowed types: JSON only
- Max filename length: 100 characters

## Permission System

### File Access Control
- Users can only access files they uploaded
- Community members can access community files
- Channel members can access channel attachments
- Message attachments inherit channel permissions

### Upload Permissions
- Users can upload files for entities they have access to
- Community members can upload community files
- Channel members can upload channel attachments
- Message senders can upload message attachments

## Configuration

### Environment Variables
```env
# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Pinata Configuration (optional)
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
```

### Service Configuration
The IPFS services can be configured through:
- Environment variables for IPFS node connection
- Service-level configuration for validation rules
- Gateway configuration for fallback URLs

## Usage Examples

### Upload File
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('purpose', 'avatar');
formData.append('description', 'User avatar');

const response = await fetch('/api/ipfs/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Upload Attachment
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`/api/attachments/message/${messageId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Get User Files
```typescript
const response = await fetch('/api/ipfs/files?purpose=avatar&skip=0&take=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Error Handling

The module includes comprehensive error handling:
- **Validation Errors**: Detailed error messages for file validation failures
- **Permission Errors**: Clear messages for unauthorized access attempts
- **IPFS Errors**: Graceful handling of IPFS node connectivity issues
- **Database Errors**: Transaction rollback and retry logic

## Future Enhancements

- Integration with Pinata API for enhanced pinning
- Support for custom IPFS gateways
- File compression before upload
- Thumbnail generation for images
- File encryption support
- CDN integration for improved performance
- File sharing and collaboration features
- Versioning support for file updates

## Security Considerations

- All file uploads require authentication
- Strict file validation prevents malicious uploads
- Permission checks prevent unauthorized access
- CID-based storage ensures content integrity
- File size limits prevent resource exhaustion
- MIME type validation prevents content spoofing

## Performance Optimization

- Batch upload support for multiple files
- IPFS pinning for immediate availability
- Gateway fallback for improved reliability
- Database indexing for efficient queries
- Soft delete for data recovery
- Connection pooling for IPFS operations