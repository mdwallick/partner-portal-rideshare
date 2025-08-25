# Phase 2 API Documentation: Core Type Definitions and API Endpoints

This document outlines the API endpoints implemented in Phase 2 of the Partner Portal implementation.

## Authentication

All API endpoints require authentication via Auth0. Include the session cookie in your requests.

## Base URL

```
https://your-domain.com/api
```

## API Endpoints

### 1. Partner Management

#### GET /api/partners
**Description**: List all partners the user has access to view

**Permissions**: User must have `can_view` permission on partners

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Partner Name",
    "type": "technology" | "manufacturing",
    "logo_url": "https://...",
    "organization_id": "org_id",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/partners
**Description**: Create a new partner

**Permissions**: User must have `super_admin` permission on platform

**Request Body**:
```json
{
  "name": "Partner Name",
  "type": "technology" | "manufacturing",
  "logo_url": "https://..." // optional
}
```

**Response**: Created partner object

#### GET /api/partners/:id
**Description**: Get specific partner details

**Permissions**: User must have `can_view` permission on the partner

**Response**: Partner object

#### PUT /api/partners/:id
**Description**: Update partner information

**Permissions**: User must have `can_admin` permission on the partner OR `super_admin` permission on platform

**Request Body**:
```json
{
  "name": "Updated Partner Name", // optional
  "logo_url": "https://..." // optional
}
```

**Response**: Updated partner object

#### GET /api/partners/me
**Description**: Get current user's partner information

**Permissions**: Authenticated user

**Response**: Partner object or null if no active partner

### 2. Client Management (Technology Partners Only)

#### GET /api/clients
**Description**: List all clients for the user's technology partner

**Permissions**: User must have `can_view` permission on their partner

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Client Name",
    "type": "native_mobile_android" | "native_mobile_ios" | "web" | "M2M",
    "picture_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "status": "active"
  }
]
```

#### POST /api/clients
**Description**: Create a new client

**Permissions**: User must have `can_admin` permission on their partner

**Request Body**:
```json
{
  "name": "Client Name",
  "type": "native_mobile_android" | "native_mobile_ios" | "web" | "M2M",
  "picture_url": "https://..." // optional
}
```

**Response**: Created client object

#### GET /api/clients/:id
**Description**: Get specific client details

**Permissions**: User must have `can_view` permission on the client

**Response**: Client object

#### PUT /api/clients/:id
**Description**: Update client information

**Permissions**: User must have `can_admin` permission on the client

**Request Body**:
```json
{
  "name": "Updated Client Name", // optional
  "type": "native_mobile_android" | "native_mobile_ios" | "web" | "M2M", // optional
  "picture_url": "https://..." // optional
}
```

**Response**: Updated client object

#### DELETE /api/clients/:id
**Description**: Revoke (soft delete) a client

**Permissions**: User must have `can_admin` permission on the client

**Response**:
```json
{
  "message": "Client revoked successfully"
}
```

### 3. Document Management (Manufacturing Partners Only)

#### GET /api/documents
**Description**: List all documents for the user's manufacturing partner

**Permissions**: User must have `can_view` permission on their partner

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Document Name",
    "description": "Document description",
    "created_at": "2024-01-01T00:00:00Z",
    "status": "active"
  }
]
```

#### POST /api/documents
**Description**: Create a new document

**Permissions**: User must have `can_admin` permission on their partner

**Request Body**:
```json
{
  "name": "Document Name",
  "description": "Document description" // optional
}
```

**Response**: Created document object

#### GET /api/documents/:id
**Description**: Get specific document details

**Permissions**: User must have `can_view` permission on the document

**Response**: Document object

#### PUT /api/documents/:id
**Description**: Update document information

**Permissions**: User must have `can_admin` permission on the document

**Request Body**:
```json
{
  "name": "Updated Document Name", // optional
  "description": "Updated description" // optional
}
```

**Response**: Updated document object

#### DELETE /api/documents/:id
**Description**: Delete (soft delete) a document

**Permissions**: User must have `can_admin` permission on the document

**Response**:
```json
{
  "message": "Document deleted successfully"
}
```

### 4. User Management

#### POST /api/partners/users
**Description**: Invite a new user to the partner organization

**Permissions**: User must have `can_manage_members` permission on their partner

**Request Body**:
```json
{
  "email": "user@example.com",
  "role": "can_view" | "can_manage_members" | "can_admin"
}
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "can_view",
  "status": "pending",
  "invited_at": "2024-01-01T00:00:00Z"
}
```

#### DELETE /api/partners/users/:userId
**Description**: Remove a user from the partner organization

**Permissions**: User must have `can_manage_members` permission on their partner

**Response**:
```json
{
  "message": "User removed successfully",
  "removed_user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "can_view"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Error description"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Permission Model

The API uses a hierarchical permission system:

### Partner Level Permissions
- `can_view`: Basic access to partner information
- `can_manage_members`: Can invite/remove users
- `can_admin`: Full administrative access

### Asset Level Permissions
- Clients and documents inherit permissions from their parent partner
- Users with `can_admin` on a partner can manage all assets
- Users with `can_view` on a partner can view all assets

### Platform Level Permissions
- `super_admin`: Can manage all partners and users
- `can_manage_all`: Can view all partners
- `can_view_all`: Can view all partners

## FGA Integration

All permission checks are performed using the FGA authorization model:

- Permission checks happen before any data access
- FGA tuples are automatically created/removed when relationships change
- The system maintains consistency between database state and FGA permissions

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **Permission Checks**: Every endpoint performs appropriate permission checks
3. **Soft Deletes**: Assets are soft-deleted to maintain data integrity
4. **Audit Trail**: All operations are logged for audit purposes

## Testing

Test the API endpoints using:

1. **Unit Tests**: Test individual endpoint logic
2. **Integration Tests**: Test FGA permission integration
3. **End-to-End Tests**: Test complete user workflows
4. **Permission Tests**: Verify permission enforcement

## Next Steps

After Phase 2 implementation:

1. **Phase 3**: Basic dashboard structure and navigation
2. **Phase 4**: Partner management functionality
3. **Phase 5**: Client/document management UI
4. **Phase 6**: User management and admin views
