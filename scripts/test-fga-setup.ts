#!/usr/bin/env tsx

import { checkPlatformPermission } from "../lib/fga"
import { createFgaUser, createFgaPlatform } from "../lib/fga-model"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function testFgaSetup() {
  try {
    const auth0UserId = process.env.AUTH0_SUPER_ADMIN_USER_ID

    if (!auth0UserId) {
      console.log("❌ AUTH0_SUPER_ADMIN_USER_ID not set in .env.local")
      console.log("\nTo set this up:")
      console.log("1. Log into the portal")
      console.log("2. Check browser console for /api/test-permissions response")
      console.log("3. Copy the userId value")
      console.log("4. Add AUTH0_SUPER_ADMIN_USER_ID=your_user_id to .env.local")
      return
    }

    console.log("🧪 Testing FGA Setup...")
    console.log("User ID:", auth0UserId)

    // Test the FGA objects being created
    const user = createFgaUser(auth0UserId)
    const platform = createFgaPlatform("default")

    console.log("\n📋 FGA Objects:")
    console.log("User:", user)
    console.log("Platform:", platform)

    // Test super admin permission check
    console.log("\n🔍 Testing Super Admin Permission...")
    const isSuperAdmin = await checkPlatformPermission(auth0UserId, "PLATFORM_SUPER_ADMIN")

    console.log("\n📊 Results:")
    console.log("Super Admin Access:", isSuperAdmin ? "✅ YES" : "❌ NO")

    if (!isSuperAdmin) {
      console.log("\n❌ Super admin permissions not working!")
      console.log("\nPossible issues:")
      console.log("1. FGA model not deployed")
      console.log("2. Super admin tuple not created")
      console.log("3. Platform reference mismatch")

      console.log("\n🔧 To fix:")
      console.log("1. Run: npm run phase1:deploy-fga")
      console.log("2. Run: npm run setup-super-admin")
    } else {
      console.log("\n🎉 Super admin permissions working correctly!")
    }
  } catch (error) {
    console.error("❌ Error testing FGA setup:", error)
  }
}

testFgaSetup()
