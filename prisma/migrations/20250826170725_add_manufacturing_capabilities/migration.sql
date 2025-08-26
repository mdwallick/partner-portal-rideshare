-- CreateTable
CREATE TABLE "public"."PartnerManufacturingCapabilities" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "hardware_sensors" BOOLEAN NOT NULL DEFAULT false,
    "hardware_parts" BOOLEAN NOT NULL DEFAULT false,
    "software_firmware" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerManufacturingCapabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerManufacturingCapabilities_partner_id_key" ON "public"."PartnerManufacturingCapabilities"("partner_id");

-- AddForeignKey
ALTER TABLE "public"."PartnerManufacturingCapabilities" ADD CONSTRAINT "PartnerManufacturingCapabilities_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
