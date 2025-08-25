# 🛡️ **Super Admin Setup Guide**

## 🚨 **Current Issue**

As a super admin, you're getting a "failed to fetch users" error when navigating to `/dashboard/users`. This is because your super admin permissions haven't been set up in the FGA (Fine-Grained Authorization) system yet.

## 🔧 **Quick Fix: Set Up Super Admin Permissions**

### **Step 1: Get Your Auth0 User ID**

1. **Log into the portal** in your browser
2. **Open browser console** (F12 → Console tab)
3. **Navigate to** `/dashboard/users` (this will trigger the API calls)
4. **Look for the console logs** - you should see something like:
   ```
   🔍 Checking user role...
   📡 Response status: 200
   📊 User data: {role: "super_admin", isSuperAdmin: true, ...}
   ```
5. **Copy your Auth0 user ID** from the logs (it looks like `auth0|1234567890abcdef`)

### **Step 2: Add to Environment Variables**

1. **Open your `.env.local` file**
2. **Add this line** (replace with your actual user ID):
   ```bash
   AUTH0_SUPER_ADMIN_USER_ID=auth0|your_actual_user_id_here
   ```
3. **Save the file**

### **Step 3: Run the Setup Script**

1. **Open terminal** in your project directory
2. **Run the setup script**:
   ```bash
   npm run setup-super-admin
   # or
   npx tsx scripts/setup-super-admin.ts
   ```
3. **You should see**:
   ```
   🔧 Setting up super admin user...
   User ID: auth0|your_user_id
   ✅ Super admin setup completed successfully!
   🎉 You should now have super admin access!
   ```

### **Step 4: Test the Fix**

1. **Refresh your browser** or navigate to `/dashboard/users` again
2. **Check the console** - you should now see:
   ```
   🔍 Checking user role...
   📡 Response status: 200
   📊 User data: {role: "super_admin", isSuperAdmin: true, ...}
   🛡️ User is super admin
   🔍 Fetching system users...
   📡 System users response status: 200
   📊 System users data: [...]
   ```
3. **The page should now load** with the "System Users" interface

## 🔍 **What Was Happening**

### **Before Fix:**
1. You navigate to `/dashboard/users`
2. Page calls `/api/partners/me` to check your role
3. FGA permission check fails (no super admin tuple exists)
4. Page shows error: "Failed to fetch users"

### **After Fix:**
1. You navigate to `/dashboard/users`
2. Page calls `/api/partners/me` to check your role
3. FGA permission check succeeds (super admin tuple exists)
4. Page calls `/api/admin/users` to fetch system users
5. Page displays "System Users" interface

## 🧪 **Alternative: Test Permissions First**

If you want to verify your setup before running the full script:

```bash
# Test FGA setup
npm run test-fga-setup
# or
npx tsx scripts/test-fga-setup.ts
```

This will show you:
- ✅ **Super Admin Access: YES** (if working)
- ❌ **Super Admin Access: NO** (if needs setup)

## 🚀 **What You'll See After Fix**

### **Super Admin Interface:**
- **Header**: "System Users" with "Manage all users across the platform"
- **Table**: All users across all partners with their access levels
- **Filters**: Role-based filtering (Admin, Manager, Viewer)
- **Actions**: View details for oversight purposes

### **Partner User Interface:**
- **Header**: "Team Members" with your partner organization name
- **Table**: Your team members with roles and statuses
- **Actions**: View, edit, and invite new team members

## 🔒 **Security Note**

The super admin role gives you:
- **System-wide user visibility** across all partners
- **Platform administration** capabilities
- **Partner oversight** and management

This is a powerful role - use it responsibly! 🛡️

## 📞 **Still Having Issues?**

If the setup doesn't work:

1. **Check FGA connection**:
   ```bash
   npm run check-connections
   ```

2. **Verify environment variables**:
   ```bash
   npm run check-fga-tuples
   ```

3. **Check browser console** for detailed error messages

4. **Verify your Auth0 user ID** is correct in `.env.local`

---

**Once you complete these steps, you should have full super admin access to the user management system!** 🎉
