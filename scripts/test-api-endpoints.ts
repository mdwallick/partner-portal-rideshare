#!/usr/bin/env tsx

import { fgaClient } from "../lib/fga"
import { createFgaUser, createFgaPartner, FGA_RELATIONS } from "../lib/fga-model"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function testApiEndpoints() {
  try {
    console.log("🧪 Testing Phase 2 API endpoints...")

    // Test 1: FGA Model Verification
    console.log("\n1. Testing FGA Model...")
    try {
      const modelId = process.env.FGA_AUTHORIZATION_MODEL_ID
      if (!modelId) {
        throw new Error("FGA_AUTHORIZATION_MODEL_ID not set")
      }

      const response = await fgaClient.readAuthorizationModel({ authorization_model_id: modelId })
      console.log(
        `✅ FGA model loaded successfully: ${response.authorization_model?.type_definitions?.length || 0} types defined`
      )
    } catch (error) {
      console.error("❌ FGA model test failed:", error)
    }

    // Test 2: FGA Helper Functions
    console.log("\n2. Testing FGA Helper Functions...")
    try {
      const testUserId = "test_user_123"
      const testPartnerId = "test_partner_456"

      const userObj = createFgaUser(testUserId)
      const partnerObj = createFgaPartner(testPartnerId)

      console.log(`✅ User object: ${userObj}`)
      console.log(`✅ Partner object: ${partnerObj}`)
      console.log(`✅ Relations available:`, Object.keys(FGA_RELATIONS))
    } catch (error) {
      console.error("❌ FGA helper functions test failed:", error)
    }

    // Test 3: Database Schema Verification
    console.log("\n3. Testing Database Schema...")
    try {
      const { PrismaClient } = await import("@prisma/client")
      const prisma = new PrismaClient()

      // Test partner types
      const partnerTypes = await prisma.$queryRaw`
        SELECT unnest(enum_range(NULL::"PartnerType")) as type
      `
      console.log(`✅ Partner types:`, partnerTypes)

      // Test client fields
      const clientFields = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ClientId' 
        AND column_name IN ('picture_url', 'client_name', 'client_type')
        ORDER BY column_name
      `
      console.log(`✅ Client fields:`, clientFields)

      // Test document fields
      const documentFields = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Document' 
        AND column_name IN ('description', 'name')
        ORDER BY column_name
      `
      console.log(`✅ Document fields:`, documentFields)

      await prisma.$disconnect()
    } catch (error) {
      console.error("❌ Database schema test failed:", error)
    }

    // Test 4: API Route Files Verification
    console.log("\n4. Testing API Route Files...")
    try {
      const fs = await import("fs")
      const path = await import("path")

      const apiRoutes = [
        "app/api/partners/route.ts",
        "app/api/partners/me/route.ts",
        "app/api/partners/[id]/route.ts",
        "app/api/partners/users/route.ts",
        "app/api/partners/users/[userId]/route.ts",
        "app/api/clients/route.ts",
        "app/api/clients/[id]/route.ts",
        "app/api/documents/route.ts",
        "app/api/documents/[id]/route.ts",
      ]

      for (const route of apiRoutes) {
        if (fs.existsSync(route)) {
          console.log(`✅ ${route} exists`)
        } else {
          console.log(`❌ ${route} missing`)
        }
      }
    } catch (error) {
      console.error("❌ API route files test failed:", error)
    }

    // Test 5: Type Definitions Verification
    console.log("\n5. Testing Type Definitions...")
    try {
      const { Client, Document, Partner } = await import("../lib/types")

      // Test Client interface
      const testClient: Client = {
        id: "test",
        name: "Test Client",
        type: "web",
        picture_url: "https://example.com/image.jpg",
        created_at: new Date().toISOString(),
        status: "active",
      }
      console.log(`✅ Client interface:`, testClient.name, testClient.type)

      // Test Document interface
      const testDocument: Document = {
        id: "test",
        name: "Test Document",
        description: "Test description",
        created_at: new Date().toISOString(),
        status: "active",
      }
      console.log(`✅ Document interface:`, testDocument.name, testDocument.description)

      // Test Partner interface
      const testPartner: Partner = {
        id: "test",
        name: "Test Partner",
        type: "technology",
        logo_url: "https://example.com/logo.jpg",
        organization_id: "org123",
        created_at: new Date().toISOString(),
        userCanView: true,
        userCanAdmin: false,
        userCanManageMembers: false,
      }
      console.log(`✅ Partner interface:`, testPartner.name, testPartner.type)
    } catch (error) {
      console.error("❌ Type definitions test failed:", error)
    }

    console.log("\n🎉 Phase 2 API endpoints testing completed!")
    console.log("\nNext steps:")
    console.log("1. Test the endpoints manually in the browser")
    console.log("2. Verify FGA permissions are working correctly")
    console.log("3. Test with different user roles and permissions")
    console.log("4. Proceed to Phase 3: Basic dashboard structure and navigation")
  } catch (error) {
    console.error("❌ Testing failed:", error)
    process.exit(1)
  }
}

// Run the tests
testApiEndpoints()
