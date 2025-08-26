# Client FGA Tuple Management Implementation

## Overview
This document describes the implementation of Fine-Grained Authorization (FGA) tuple management for the clients API in the partner portal application.

## 🎯 **Implementation Goals**
1. **Super Admin Access**: Super admins should have full access to all clients
2. **Partner Isolation**: Partner admins should only see their own clients
3. **Permission Inheritance**: Client permissions should inherit from partner permissions
4. **Complete Tuple Lifecycle**: Create, read, update, and delete FGA tuples for clients

## 🏗️ **Architecture**

### **FGA Model Structure**
```yaml
type client
  relations
    define can_admin: [user] or can_admin from parent
    define can_view: [user] or can_view from parent
    define parent: [partner]
```

### **Tuple Relationships**
- `client:ID parent partner:ID` - Client belongs to partner
- `user:ID can_view client:ID` - User can view specific client
- `user:ID can_admin client:ID` - User can admin specific client

## 🔐 **Permission Model**

### **Super Admin Access**
- **GET `/api/clients`**: Can see all clients across all partners
- **GET `/api/clients/[id]`**: Can view any client
- **POST `/api/clients`**: Can create clients for any technology partner
- **PUT `/api/clients/[id]`**: Can edit any client
- **DELETE `/api/clients/[id]`**: Can delete any client

### **Partner Admin Access**
- **GET `/api/clients`**: Can only see clients from their own partner
- **GET `/api/clients/[id]`**: Can view clients from their own partner
- **POST `/api/clients`**: Can create clients for their own partner
- **PUT `/api/clients/[id]`**: Can edit clients they have admin access to
- **DELETE `/api/clients/[id]`**: Can delete clients they have admin access to

### **Permission Inheritance**
- If user has `PARTNER_CAN_VIEW` on a partner, they can view all clients of that partner
- If user has `PARTNER_CAN_ADMIN` on a partner, they can admin all clients of that partner
- Direct client permissions are also supported for granular control

## 🚀 **API Endpoints**

### **GET `/api/clients`**
```typescript
// Super admin flow
const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN", "default")
if (isSuperAdmin) {
  // Return all clients with partner context
  const allClients = await prisma.clientId.findMany({
    where: { status: "active" },
    include: { partner: true }
  })
}

// Regular user flow
const canView = await checkPartnerPermission(user.sub, "PARTNER_CAN_VIEW", partner.id)
if (!canView) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

### **POST `/api/clients`**
```typescript
// Super admin can specify partner_id
if (isSuperAdmin) {
  if (!partner_id) {
    return NextResponse.json({ error: "Partner ID is required for super admin" }, { status: 400 })
  }
  partner = await prisma.partner.findUnique({ where: { id: partner_id } })
}

// Create comprehensive FGA tuples
const clientObj = createFgaClient(newClient.id)
const partnerObj = createFgaPartner(partner.id)
const userObj = createFgaUser(user.sub)

await writeTuple(clientObj, "parent", partnerObj)
await writeTuple(userObj, "can_view", clientObj)
await writeTuple(userObj, "can_admin", clientObj)
```

### **DELETE `/api/clients/[id]`**
```typescript
// Clean up FGA tuples when client is deleted
const clientObj = createFgaClient(clientId)
const userObj = createFgaUser(user.sub)
const partnerObj = createFgaPartner(client.partner.id)

await deleteTuple(userObj, "can_view", clientObj)
await deleteTuple(userObj, "can_admin", clientObj)
await deleteTuple(clientObj, "parent", partnerObj)
```

## 🔍 **FGA Tuple Operations**

### **Tuple Creation (Client Creation)**
1. `client:ID parent partner:ID` - Establishes ownership
2. `user:ID can_view client:ID` - Grants view permission
3. `user:ID can_admin client:ID` - Grants admin permission

### **Tuple Cleanup (Client Deletion)**
1. Remove all user permissions on the client
2. Remove client-parent relationship
3. Log cleanup success/failure

### **Permission Checking**
1. Check super admin status first
2. Fall back to partner-level permissions
3. Fall back to direct client permissions
4. Return appropriate error responses

## 🧪 **Testing**

### **Test Script**
A test script is provided at `scripts/test-client-fga.js` to verify:
- FGA tuple creation
- Permission verification
- Tuple cleanup

### **Manual Testing Scenarios**
1. **Super Admin**: Create, view, edit, delete clients for any partner
2. **Partner Admin**: Create, view, edit, delete clients for their own partner
3. **Regular User**: View clients they have access to
4. **Permission Denied**: Attempt operations without proper permissions

## 📊 **Benefits**

### **Security**
- **Granular Access Control**: Users only see clients they have permission to view
- **Partner Isolation**: No cross-partner data leakage
- **Audit Trail**: Complete FGA tuple history for compliance

### **Flexibility**
- **Super Admin Override**: Full system access when needed
- **Permission Inheritance**: Leverages existing partner permission structure
- **Direct Permissions**: Supports granular client-level access control

### **Maintainability**
- **Centralized Logic**: All FGA operations in one place
- **Consistent Patterns**: Same permission checking across all endpoints
- **Error Handling**: Graceful fallbacks when FGA operations fail

## 🔧 **Configuration**

### **Environment Variables**
- `FGA_API_URL`: FGA service endpoint
- `FGA_STORE_ID`: FGA store identifier
- `FGA_CLIENT_ID`: FGA client credentials
- `FGA_CLIENT_SECRET`: FGA client secret

### **FGA Model**
The FGA model is defined in `model.fga.yaml` and should be deployed to your FGA service before testing.

## 🚨 **Error Handling**

### **FGA Tuple Creation Failures**
- Log errors but continue with client creation
- Client remains functional even if FGA setup fails
- Consider implementing retry logic for production

### **Permission Check Failures**
- Return appropriate HTTP status codes (401, 403)
- Log detailed error information for debugging
- Provide user-friendly error messages

## 🔮 **Future Enhancements**

### **Batch Operations**
- Support for bulk client creation with FGA tuples
- Batch permission updates across multiple clients

### **Advanced Permissions**
- Time-based permissions (temporary access)
- Role-based permissions within clients
- Conditional permissions based on client status

### **Monitoring & Analytics**
- FGA tuple creation/deletion metrics
- Permission check performance monitoring
- Access pattern analysis

## 📝 **Conclusion**

The client FGA tuple management implementation provides:
- **Complete access control** for all client operations
- **Super admin override** capabilities
- **Permission inheritance** from partner relationships
- **Comprehensive tuple lifecycle** management
- **Robust error handling** and logging

This implementation ensures that the clients API is secure, scalable, and maintainable while providing the flexibility needed for different user roles and access patterns.
