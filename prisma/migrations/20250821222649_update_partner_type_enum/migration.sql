/*
  Warnings:

  - The values [game_studio,merch_supplier] on the enum `PartnerType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `series` on the `Document` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PartnerType_new" AS ENUM ('technology', 'manufacturing');
ALTER TABLE "public"."Partner" ALTER COLUMN "type" TYPE "public"."PartnerType_new" USING ("type"::text::"public"."PartnerType_new");
ALTER TYPE "public"."PartnerType" RENAME TO "PartnerType_old";
ALTER TYPE "public"."PartnerType_new" RENAME TO "PartnerType";
DROP TYPE "public"."PartnerType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."ClientId" ADD COLUMN     "picture_url" TEXT;

-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "category",
DROP COLUMN "image_url",
DROP COLUMN "series",
ADD COLUMN     "description" TEXT;
