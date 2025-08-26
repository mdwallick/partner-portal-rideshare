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

async function setupSuperAdminMetroAccess() {
  try {
    console.log("🔐 Setting up super admin metro area access...")

    // Get the super admin user ID from the command line or use a default
    const superAdminUserId = process.argv[2] || "super-admin-user-id"

    if (superAdminUserId === "super-admin-user-id") {
      console.log(
        "⚠️  Using placeholder super admin user ID. Please provide actual user ID as argument."
      )
      console.log("   Usage: node scripts/setup-super-admin-metro-access.js <super-admin-user-id>")
      console.log("   Example: node scripts/setup-super-admin-metro-access.js user:auth0|123456789")
    }

    console.log(`\n📋 Creating metro area access for: ${superAdminUserId}`)

    // Super admin can view all metro areas
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: superAdminUserId,
            relation: "can_view",
            object: "metro_area:*",
          },
        ],
      },
    })
    console.log("✅ Super admin can view all metro areas")

    // Super admin can admin all metro areas
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: superAdminUserId,
            relation: "can_admin",
            object: "metro_area:*",
          },
        ],
      },
    })
    console.log("✅ Super admin can admin all metro areas")

    console.log("\n🎉 Super admin metro area access setup completed!")
    console.log(`\n📝 Super admin ${superAdminUserId} now has access to all metro areas`)
  } catch (error) {
    console.error("❌ Error setting up super admin metro area access:", error)

    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
  }
}

// Run setup
setupSuperAdminMetroAccess()
