# Phase 1 Implementation: Database Schema Updates and FGA Model

This document outlines the changes made in Phase 1 of the Partner Portal implementation.

## Changes Made

### 1. Database Schema Updates (Prisma)

#### Partner Types
- **Before**: `game_studio`, `merch_supplier`
- **After**: `technology`, `manufacturing`

#### ClientId Model
- Added `picture_url` field for client images

#### Document Model
- Added `description` field
- Removed unused fields: `category`, `series`, `image_url`

### 2. Type Definitions Updates

#### New Interfaces
- `Client` interface for technology partner clients
- `Document` interface for manufacturing partner documents

#### Updated Interfaces
- `Partner` interface now uses `"technology" | "manufacturing"` types

### 3. FGA Authorization Model

#### New Model Structure
- `user` type for authentication
- `partner` type with admin, member management, and view permissions
- `client` type for technology partner assets
- `document` type for manufacturing partner assets
- `platform` type for system-wide permissions

#### New Helper Functions
- `checkPartnerPermission()` - Check partner-level permissions
- `checkClientPermission()` - Check client-level permissions
- `checkDocumentPermission()` - Check document-level permissions
- `checkPlatformPermission()` - Check platform-level permissions

## Deployment Steps

### Step 1: Update Database Schema

1. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

2. **Create and Run Migration**:
   ```bash
   npm run prisma:migrate
   ```

3. **Verify Schema**:
   ```bash
   npm run prisma:studio
   ```

### Step 2: Deploy FGA Authorization Model

1. **Set Environment Variables**:
   Ensure your `.env.local` has the required FGA configuration:
   ```env
   FGA_API_URL=your_fga_api_url
   FGA_STORE_ID=your_store_id
   FGA_API_TOKEN_ISSUER=your_token_issuer
   FGA_API_AUDIENCE=your_audience
   FGA_CLIENT_ID=your_client_id
   FGA_CLIENT_SECRET=your_client_secret
   ```

2. **Deploy the Model**:
   ```bash
   npx tsx scripts/deploy-fga-model.ts
   ```

3. **Copy the Model ID**:
   The script will output a model ID. Add it to your `.env.local`:
   ```env
   FGA_AUTHORIZATION_MODEL_ID=your_new_model_id
   ```

### Step 3: Initialize FGA Tuples

1. **Run the Initialization Script**:
   ```bash
   npx tsx scripts/init-fga-tuples.ts
   ```

2. **Manually Create Super Admin**:
   After running the script, manually create the platform super admin tuple:
   ```bash
   # Using FGA CLI or API
   # user:your_auth0_user_id super_admin platform:default
   ```

### Step 4: Verify Deployment

1. **Test Database Connection**:
   ```bash
   npm run prisma:studio
   ```

2. **Test FGA Connection**:
   ```bash
   npx tsx scripts/check-connections.js
   ```

## Verification Checklist

- [ ] Database schema updated with new partner types
- [ ] New fields added to ClientId and Document models
- [ ] FGA authorization model deployed successfully
- [ ] FGA tuples initialized for existing partners
- [ ] Platform super admin created manually
- [ ] All environment variables set correctly
- [ ] Prisma client regenerated
- [ ] Database migration completed successfully

## Rollback Plan

If issues arise during deployment:

1. **Database Rollback**:
   ```bash
   # Revert to previous migration
   npm run prisma:migrate:reset
   ```

2. **FGA Rollback**:
   - Use the previous authorization model ID
   - Revert environment variable changes

## Next Steps

After Phase 1 is successfully deployed:

1. **Phase 2**: Core type definitions and API endpoints
2. **Phase 3**: Basic dashboard structure and navigation
3. **Phase 4**: Partner management functionality

## Troubleshooting

### Common Issues

1. **FGA Model Deployment Fails**:
   - Check FGA service connectivity
   - Verify environment variables
   - Check FGA store permissions

2. **Database Migration Fails**:
   - Ensure database is accessible
   - Check for existing data conflicts
   - Verify Prisma schema syntax

3. **Type Errors**:
   - Regenerate Prisma client
   - Restart TypeScript server
   - Check import paths

### Support

For issues during deployment, check:
- FGA service logs
- Database connection logs
- Application error logs
- Environment variable configuration
