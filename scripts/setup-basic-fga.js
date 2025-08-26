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

async function setupBasicFGA() {
  try {
    console.log("🔐 Setting up basic FGA tuples for super admin access...")

    // Get the super admin user ID from the command line
    const superAdminUserId = process.argv[2]
    if (!superAdminUserId) {
      console.error("❌ Please provide the super admin user ID as an argument")
      console.error("   Usage: node scripts/setup-basic-fga.js <super-admin-user-id>")
      console.error("   Example: node scripts/setup-basic-fga.js user:auth0|123456789")
      process.exit(1)
    }

    console.log(`\n📋 Setting up access for: ${superAdminUserId}`)

    // 1. Super admin can manage all partners
    console.log("\n📋 Creating partner management access...")
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: superAdminUserId,
            relation: "can_manage_all",
            object: "platform:default",
          },
        ],
      },
    })
    console.log("✅ Super admin can manage all partners")

    // 2. Super admin can view all partners
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: superAdminUserId,
            relation: "can_view_all",
            object: "platform:default",
          },
        ],
      },
    })
    console.log("✅ Super admin can view all partners")

    // 3. Super admin can manage SME admins
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: superAdminUserId,
            relation: "manage_sme_admins",
            object: "platform:default",
          },
        ],
      },
    })
    console.log("✅ Super admin can manage SME admins")

    // 4. Super admin is super admin
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: superAdminUserId,
            relation: "super_admin",
            object: "platform:default",
          },
        ],
      },
    })
    console.log("✅ Super admin has super admin role")

    // 5. Super admin can view all metro areas
    console.log("\n📋 Creating metro area access...")
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

    // 6. Super admin can admin all metro areas
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

    console.log("\n🎉 Basic FGA setup completed successfully!")
    console.log(`\n📝 Super admin ${superAdminUserId} now has access to:`)
    console.log("   - All partners (view and manage)")
    console.log("   - SME admin management")
    console.log("   - All metro areas (view and manage)")
  } catch (error) {
    console.error("❌ Error setting up basic FGA:", error)

    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
  }
}

// Run setup
setupBasicFGA()
