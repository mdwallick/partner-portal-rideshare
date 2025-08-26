-- CreateTable
CREATE TABLE "public"."MetroArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "airport_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetroArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartnerMetroArea" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "metro_area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerMetroArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetroArea_airport_code_key" ON "public"."MetroArea"("airport_code");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerMetroArea_partner_id_metro_area_id_key" ON "public"."PartnerMetroArea"("partner_id", "metro_area_id");

-- AddForeignKey
ALTER TABLE "public"."PartnerMetroArea" ADD CONSTRAINT "PartnerMetroArea_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerMetroArea" ADD CONSTRAINT "PartnerMetroArea_metro_area_id_fkey" FOREIGN KEY ("metro_area_id") REFERENCES "public"."MetroArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
