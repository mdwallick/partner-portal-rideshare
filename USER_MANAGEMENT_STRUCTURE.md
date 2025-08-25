# 🏗️ **User Management Structure Guide**

## 📋 **Overview**

The partner portal has a **dual user management system** that serves different user types:

1. **Super Administrators** - System-wide user management
2. **Partner Users** - Team management within their organization

## 🔐 **User Types & Access Levels**

### **Super Administrators**
- **Access**: Full system-wide user management
- **Location**: `/dashboard/users` (shows all system users)
- **Capabilities**: View all users across all partners, see partner relationships
- **API Endpoint**: `/api/admin/users`

### **Partner Users**
- **Access**: Team management within their partner organization
- **Location**: `/dashboard/users` (shows only their team members)
- **Capabilities**: Invite new team members, manage roles, view team statistics
- **API Endpoint**: `/api/partners/users`

## 🎯 **Navigation & Routing**

### **For Super Admins**
```
/dashboard/users → System-wide user management
├── View all users across all partners
├── See partner relationships and roles
├── Filter by partner roles (can_admin, can_manage_members, can_view)
└── No invitation capabilities (manages existing users only)
```

### **For Partner Users**
```
/dashboard/users → Team management
├── View team members within their organization
├── Invite new team members
├── Manage roles and statuses
├── View team statistics
└── Access to /dashboard/users/new for invitations
```

## 🔧 **API Endpoints**

### **System Users (Super Admin)**
```typescript
GET /api/admin/users
- Requires: super_admin role
- Returns: All users with partner relationships
- Data: user info + partner access details
```

### **Partner Users (Team Management)**
```typescript
GET /api/partners/users
- Requires: active partner membership
- Returns: Team members within the partner organization
- Data: team member details + roles + statuses

POST /api/partners/users
- Requires: can_manage_members permission
- Purpose: Invite new team members
- Data: email, role, partner_id
```

## 🎨 **UI Components**

### **Super Admin View**
- **Header**: "System Users" with description
- **Table Columns**: User, Partner Access, Joined, Last Login, Actions
- **Filters**: Role-based filtering (Admin, Manager, Viewer)
- **Actions**: View details only (no editing capabilities)

### **Partner User View**
- **Header**: "Team Members" with partner name
- **Table Columns**: User, Role, Status, Joined, Last Login, Actions
- **Filters**: Role and status filtering
- **Actions**: View details, edit user, invite new members
- **Statistics**: Total, Active, Pending, Admins

## 🔄 **Data Flow**

### **Super Admin User Fetch**
```
1. User navigates to /dashboard/users
2. Component checks user role via /api/partners/me
3. If super_admin → calls /api/admin/users
4. Displays system-wide user table
```

### **Partner User Fetch**
```
1. User navigates to /dashboard/users
2. Component checks user role via /api/partners/me
3. If regular partner user → calls /api/partners/users
4. Displays team management interface
```

## 🚨 **Common Issues & Solutions**

### **"Failed to fetch users" Error**
- **Cause**: User role not properly determined
- **Solution**: Check user permissions and partner membership
- **Debug**: Verify `/api/partners/me` response

### **Empty User Lists**
- **Super Admin**: No users exist in system
- **Partner User**: No team members added yet
- **Solution**: Check database and user creation flow

### **Permission Denied**
- **Super Admin**: User doesn't have super_admin role
- **Partner User**: User doesn't have can_manage_members permission
- **Solution**: Verify role assignments in database

## 📝 **User Invitation Process**

### **Partner User Invitation**
```
1. Partner admin navigates to /dashboard/users/new
2. Fills invitation form (email, role)
3. System creates PartnerUser record with "pending" status
4. Auth0 invitation sent (TODO: implement)
5. User accepts invitation and account activated
```

### **Super Admin User Management**
```
1. Super admin views all users at /dashboard/users
2. Can see partner relationships and roles
3. No direct user creation (users join via partner invitations)
4. Focus on oversight and system administration
```

## 🔍 **Testing & Verification**

### **Super Admin Access**
```bash
# Verify super admin permissions
curl /api/admin/users
# Should return 200 with user list or 403 if not super admin
```

### **Partner User Access**
```bash
# Verify partner user permissions
curl /api/partners/users
# Should return 200 with team list or 403 if not authorized
```

### **Role Verification**
```bash
# Check user's current role and partner
curl /api/partners/me
# Should return user's partner info and role
```

## 🎯 **Next Steps**

1. **Test super admin access** to `/dashboard/users`
2. **Verify partner user team management** functionality
3. **Implement Auth0 user invitation** system
4. **Add user creation capabilities** for super admins if needed
5. **Enhance user detail views** with more comprehensive information

## 📚 **Related Files**

- `app/dashboard/users/page.tsx` - Main user management interface
- `app/api/admin/users/route.ts` - Super admin user API
- `app/api/partners/users/route.ts` - Partner team management API
- `app/dashboard/users/new/page.tsx` - User invitation form
- `app/dashboard/layout.tsx` - Navigation and role-based routing
