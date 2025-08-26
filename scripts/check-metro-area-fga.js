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

async function checkMetroAreaFGA() {
  try {
    console.log("🔍 Checking existing FGA tuples for metro areas...")

    // List all tuples
    const response = await fgaClient.read({
      tuple_key: {
        object: "metro_area:*",
      },
    })

    console.log("\n📋 Metro Area FGA Tuples:")
    console.log("========================")

    if (response.tuples && response.tuples.length > 0) {
      response.tuples.forEach((tuple, index) => {
        console.log(`${index + 1}. User: ${tuple.key.user}`)
        console.log(`   Relation: ${tuple.key.relation}`)
        console.log(`   Object: ${tuple.key.object}`)
        console.log(`   Timestamp: ${tuple.timestamp}`)
        console.log("")
      })
    } else {
      console.log("❌ No metro area FGA tuples found")
    }

    // Check specific relationships
    console.log("\n🔍 Checking specific relationships...")

    // Check if super admin can view metro areas
    const superAdminCheck = await fgaClient.check({
      tuple_key: {
        user: "user:super-admin-user-id", // Replace with actual super admin user ID
        relation: "can_view",
        object: "metro_area:*",
      },
    })

    console.log(`Super admin can view metro areas: ${superAdminCheck.allowed ? "✅ YES" : "❌ NO"}`)

    // Check if super admin can admin metro areas
    const superAdminAdminCheck = await fgaClient.check({
      tuple_key: {
        user: "user:super-admin-user-id", // Replace with actual super admin user ID
        relation: "can_admin",
        object: "metro_area:*",
      },
    })

    console.log(
      `Super admin can admin metro areas: ${superAdminAdminCheck.allowed ? "✅ YES" : "❌ NO"}`
    )
  } catch (error) {
    console.error("❌ Error checking FGA tuples:", error)

    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
  }
}

// Run check
checkMetroAreaFGA()
