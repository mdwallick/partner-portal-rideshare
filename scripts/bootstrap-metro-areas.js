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

async function bootstrapMetroAreas() {
  try {
    console.log("🚀 Bootstrapping metro areas system...")

    // Get the super admin user ID from the command line
    const superAdminUserId = process.argv[2]
    if (!superAdminUserId) {
      console.error("❌ Please provide the super admin user ID as an argument")
      console.error("   Usage: node scripts/bootstrap-metro-areas.js <super-admin-user-id>")
      console.error("   Example: node scripts/bootstrap-metro-areas.js user:auth0|123456789")
      process.exit(1)
    }

    console.log(`\n👤 Setting up access for: ${superAdminUserId}`)

    // Step 1: Create platform-level super admin access
    console.log("\n📋 Step 1: Creating platform super admin access...")

    const platformTuples = [
      {
        user: superAdminUserId,
        relation: "super_admin",
        object: "platform:default",
      },
      {
        user: superAdminUserId,
        relation: "can_manage_all",
        object: "platform:default",
      },
      {
        user: superAdminUserId,
        relation: "can_view_all",
        object: "platform:default",
      },
      {
        user: superAdminUserId,
        relation: "manage_sme_admins",
        object: "platform:default",
      },
    ]

    await fgaClient.write({
      writes: {
        tuple_keys: platformTuples,
      },
    })
    console.log("✅ Platform super admin access created")

    // Step 2: Create metro area wildcard access
    console.log("\n📋 Step 2: Creating metro area wildcard access...")

    const metroTuples = [
      {
        user: superAdminUserId,
        relation: "can_view",
        object: "metro_area:*",
      },
      {
        user: superAdminUserId,
        relation: "can_admin",
        object: "metro_area:*",
      },
    ]

    await fgaClient.write({
      writes: {
        tuple_keys: metroTuples,
      },
    })
    console.log("✅ Metro area wildcard access created")

    // Step 3: Verify the setup
    console.log("\n📋 Step 3: Verifying the setup...")

    const verificationTests = [
      { relation: "super_admin", object: "platform:default" },
      { relation: "can_view", object: "metro_area:*" },
      { relation: "can_admin", object: "metro_area:*" },
    ]

    for (const test of verificationTests) {
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

    console.log("\n🎉 Bootstrap completed successfully!")
    console.log(`\n📝 Super admin ${superAdminUserId} now has:`)
    console.log("   - Platform super admin role")
    console.log("   - Access to view ALL metro areas (including future ones)")
    console.log("   - Access to admin ALL metro areas (including future ones)")
    console.log("\n🚀 You can now:")
    console.log("   1. Access the metro areas page in the portal")
    console.log("   2. Create your first metro area")
    console.log("   3. Assign metro areas to partners")
  } catch (error) {
    console.error("❌ Error bootstrapping metro areas:", error)

    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
  }
}

// Run bootstrap
bootstrapMetroAreas()
