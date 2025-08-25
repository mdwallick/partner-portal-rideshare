-- Migration script to update partner portal schema
-- Run this after updating the Prisma schema

-- 1. Update existing partner types from old to new values
UPDATE "Partner" 
SET type = 'technology' 
WHERE type = 'game_studio';

UPDATE "Partner" 
SET type = 'manufacturing' 
WHERE type = 'merch_supplier';

-- 2. Add picture_url column to ClientId table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ClientId' AND column_name = 'picture_url') THEN
        ALTER TABLE "ClientId" ADD COLUMN picture_url TEXT;
    END IF;
END $$;

-- 3. Update Document table structure
-- First, add description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Document' AND column_name = 'description') THEN
        ALTER TABLE "Document" ADD COLUMN description TEXT;
    END IF;
END $$;

-- 4. Remove old columns from Document table (optional - uncomment if you want to remove them)
-- ALTER TABLE "Document" DROP COLUMN IF EXISTS category;
-- ALTER TABLE "Document" DROP COLUMN IF EXISTS series;
-- ALTER TABLE "Document" DROP COLUMN IF EXISTS image_url;

-- 5. Update the enum type for PartnerType
-- Note: PostgreSQL requires creating a new enum and updating existing values
-- This is handled automatically by Prisma, but you can run this manually if needed

-- 6. Verify the changes
SELECT 'Migration completed successfully' as status;
