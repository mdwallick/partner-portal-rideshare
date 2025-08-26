const { OpenFgaApi } = require("@openfga/sdk")

// Configuration - update these values
const FGA_API_URL = process.env.FGA_API_URL || "http://localhost:8080"
const FGA_STORE_ID = process.env.FGA_STORE_ID
const FGA_AUTHORIZATION_MODEL_ID = process.env.FGA_AUTHORIZATION_MODEL_ID
const FGA_API_TOKEN = process.env.FGA_API_TOKEN

if (!FGA_STORE_ID || !FGA_AUTHORIZATION_MODEL_ID) {
  console.error("❌ Missing required environment variables:")
  console.error("   FGA_STORE_ID: Your FGA store ID")
  console.error("   FGA_AUTHORIZATION_MODEL_ID: Your FGA model ID")
  console.error("   FGA_API_TOKEN: Your FGA API token (if using auth)")
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

async function testMetroAreaAccess() {
  try {
    console.log("🧪 Testing metro area access...")

    // Test 1: Check if we can read metro areas
    console.log("\n📋 Test 1: Reading metro areas...")
    try {
      const response = await fgaClient.read({
        tuple_key: {
          object: "metro_area:*",
        },
      })
      console.log("✅ Successfully read metro areas")
      console.log("   Found tuples:", response.tuples?.length || 0)
    } catch (error) {
      console.log("❌ Failed to read metro areas:", error.message)
    }

    // Test 2: Check if super admin can view metro areas
    console.log("\n📋 Test 2: Checking super admin access...")
    const superAdminUserId = process.argv[2] || "user:super-admin-user-id"

    try {
      const checkResponse = await fgaClient.check({
        tuple_key: {
          user: superAdminUserId,
          relation: "can_view",
          object: "metro_area:*",
        },
      })
      console.log(
        `✅ Super admin ${superAdminUserId} can view metro areas: ${checkResponse.allowed}`
      )
    } catch (error) {
      console.log(`❌ Failed to check super admin access:`, error.message)
    }

    // Test 3: Check if super admin can admin metro areas
    console.log("\n📋 Test 3: Checking super admin admin access...")
    try {
      const adminCheckResponse = await fgaClient.check({
        tuple_key: {
          user: superAdminUserId,
          relation: "can_admin",
          object: "metro_area:*",
        },
      })
      console.log(
        `✅ Super admin ${superAdminUserId} can admin metro areas: ${adminCheckResponse.allowed}`
      )
    } catch (error) {
      console.log(`❌ Failed to check super admin admin access:`, error.message)
    }

    console.log("\n🎯 Summary:")
    console.log("   - If all tests pass, your FGA setup is working")
    console.log("   - If tests fail, you need to create the appropriate FGA tuples")
    console.log("   - Run the setup scripts to create the required tuples")
  } catch (error) {
    console.error("❌ Error testing metro area access:", error)
  }
}

// Run test
testMetroAreaAccess()
