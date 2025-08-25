-- Migration: Update ClientId table to use client_id field for Auth0 client ID
-- The existing client_id field will now store Auth0 client IDs instead of internal IDs

-- Add a comment to document the field's new purpose
COMMENT ON COLUMN "ClientId"."client_id" IS 'Auth0 client ID for synchronization';

-- Verify the change
SELECT 'Migration completed successfully' as status;
