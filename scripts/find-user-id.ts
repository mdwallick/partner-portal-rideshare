#!/usr/bin/env tsx

import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function findUserId() {
  try {
    console.log("🔍 Finding your Auth0 user ID...")
    console.log("\nTo get your user ID:")
    console.log("1. Log into the portal in your browser")
    console.log("2. Open browser console (F12)")
    console.log("3. Go to Network tab")
    console.log("4. Refresh the page")
    console.log("5. Look for a request to /api/test-permissions")
    console.log("6. Click on it and check the Response tab")
    console.log("7. You'll see your userId in the response")
    console.log("\nExample response:")
    console.log("{")
    console.log('  "isSuperAdmin": false,')
    console.log('  "userId": "auth0|1234567890abcdef",')
    console.log('  "email": "your.email@example.com"')
    console.log("}")
    console.log("\nCopy the userId value and add it to your .env.local:")
    console.log("AUTH0_SUPER_ADMIN_USER_ID=auth0|1234567890abcdef")
    console.log("\nThen run: npm run setup-super-admin")
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

findUserId()
