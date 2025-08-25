#!/usr/bin/env tsx

import { setupSuperAdmin } from "../lib/fga-admin"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function setupSuperAdminUser() {
  try {
    // You need to provide your Auth0 user ID here
    // You can find this by checking the browser console when logged in
    // or by looking at the /api/test-permissions endpoint response
    const auth0UserId = process.env.AUTH0_SUPER_ADMIN_USER_ID

    if (!auth0UserId) {
      console.error("❌ AUTH0_SUPER_ADMIN_USER_ID environment variable not set")
      console.log("\nTo set this up:")
      console.log("1. Log into the portal in your browser")
      console.log("2. Open browser console and check the network tab")
      console.log("3. Look for calls to /api/test-permissions")
      console.log("4. Find your userId in the response")
      console.log("5. Add AUTH0_SUPER_ADMIN_USER_ID=your_user_id to .env.local")
      return
    }

    console.log("🔧 Setting up super admin user...")
    console.log(`User ID: ${auth0UserId}`)

    const result = await setupSuperAdmin(auth0UserId)

    console.log("✅ Super admin setup completed successfully!")
    console.log("Result:", result)

    console.log("\n🎉 You should now have super admin access!")
    console.log("Try refreshing your dashboard to see the super admin interface.")
  } catch (error) {
    console.error("❌ Error setting up super admin:", error)
    process.exit(1)
  }
}

setupSuperAdminUser()
