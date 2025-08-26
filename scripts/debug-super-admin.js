const { OpenFgaApi } = require("@openfga/sdk")

// Configuration - update these values
const FGA_API_URL = process.env.FGA_API_URL || "http://localhost:8080"
const FGA_STORE_ID = process.env.FGA_STORE_ID
const FGA_AUTHORIZATION_MODEL_ID = process.env.FGA_AUTHORIZATION_MODEL_ID
const FGA_API_TOKEN = process.env.FGA_API_TOKEN

if (!FGA_STORE_ID || !FGA_AUTHORIZATION_MODEL_ID) {
  console.error("❌ Missing required environment variables:")
  console.error("   FGA_API_URL:", process.env.FGA_API_URL || "http://localhost:8080")
  console.error("   FGA_STORE_ID:", FGA_STORE_ID)
  console.error("   FGA_AUTHORIZATION_MODEL_ID:", FGA_AUTHORIZATION_MODEL_ID)
  console.error("   FGA_API_TOKEN:", FGA_API_TOKEN ? "SET" : "NOT SET")
  process.exit(1)
}

const fgaClient = new OpenFgaApi({
  apiUrl: FGA_API_URL,
  storeId: FGA_STORE_ID,
  authorizationModelId: FGA_AUTHORIZATION_MODEL_ID,
})

// Add API token if provided
if (FGA_API_TOKEN) {
  fgaClient.setApiKey(FGA_API_TOKEN)
}

async function debugSuperAdmin() {
  try {
    console.log("🔍 Debugging super admin access...")
    console.log("📋 Configuration:")
    console.log("   FGA_API_URL:", FGA_API_URL)
    console.log("   FGA_STORE_ID:", FGA_STORE_ID)
    console.log("   FGA_AUTHORIZATION_MODEL_ID:", FGA_AUTHORIZATION_MODEL_ID)

    // Get the super admin user ID from the command line
    const superAdminUserId = process.argv[2]
    if (!superAdminUserId) {
      console.error("❌ Please provide the super admin user ID as an argument")
      console.error("   Usage: node scripts/debug-super-admin.js <super-admin-user-id>")
      console.error("   Example: node scripts/debug-super-admin.js user:auth0|123456789")
      process.exit(1)
    }

    console.log("\n👤 Testing super admin user:", superAdminUserId)

    // Test 1: Check if we can connect to FGA
    console.log("\n📋 Test 1: FGA Connection...")
    try {
      const modelsResponse = await fgaClient.readAuthorizationModels()
      console.log("✅ FGA connection successful")
      console.log("   Available models:", modelsResponse.authorization_models?.length || 0)
      if (modelsResponse.authorization_models?.[0]) {
        console.log("   Latest model ID:", modelsResponse.authorization_models[0].id)
      }
    } catch (error) {
      console.log("❌ FGA connection failed:", error.message)
      return
    }

    // Test 2: Check platform permissions
    console.log("\n📋 Test 2: Platform Permissions...")
    const platformTests = [
      { relation: "can_manage_all", object: "platform:default" },
      { relation: "can_view_all", object: "platform:default" },
      { relation: "manage_sme_admins", object: "platform:default" },
      { relation: "super_admin", object: "platform:default" },
    ]

    for (const test of platformTests) {
      try {
        const response = await fgaClient.check({
          tuple_key: {
            user: superAdminUserId,
            relation: test.relation,
            object: test.object,
          },
        })
        console.log(
          `   ${test.relation} on ${test.object}: ${response.allowed ? "✅ YES" : "❌ NO"}`
        )
      } catch (error) {
        console.log(`   ${test.relation} on ${test.object}: ❌ ERROR - ${error.message}`)
      }
    }

    // Test 3: Check metro area permissions
    console.log("\n📋 Test 3: Metro Area Permissions...")
    const metroTests = [
      { relation: "can_view", object: "metro_area:*" },
      { relation: "can_admin", object: "metro_area:*" },
    ]

    for (const test of metroTests) {
      try {
        const response = await fgaClient.check({
          tuple_key: {
            user: superAdminUserId,
            relation: test.relation,
            object: test.object,
          },
        })
        console.log(
          `   ${test.relation} on ${test.object}: ${response.allowed ? "✅ YES" : "❌ NO"}`
        )
      } catch (error) {
        console.log(`   ${test.relation} on ${test.object}: ❌ ERROR - ${error.message}`)
      }
    }

    // Test 4: List all tuples for this user
    console.log("\n📋 Test 4: All User Tuples...")
    try {
      const response = await fgaClient.read({
        tuple_key: {
          user: superAdminUserId,
        },
      })
      console.log("✅ User tuples found:", response.tuples?.length || 0)
      if (response.tuples && response.tuples.length > 0) {
        response.tuples.forEach((tuple, index) => {
          console.log(
            `   ${index + 1}. ${tuple.key.user} ${tuple.key.relation} ${tuple.key.object}`
          )
        })
      } else {
        console.log("   ❌ No tuples found for this user")
      }
    } catch (error) {
      console.log("❌ Failed to read user tuples:", error.message)
    }

    console.log("\n🎯 Summary:")
    console.log(
      "   - If platform permissions are NO, run: node scripts/setup-basic-fga.js <user-id>"
    )
    console.log("   - If metro area permissions are NO, the setup script will create them")
    console.log("   - If all tests pass, the issue might be in the API logic")
  } catch (error) {
    console.error("❌ Error debugging super admin:", error)
  }
}

// Run debug
debugSuperAdmin()
