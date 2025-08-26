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

async function setupMetroAreaFGA() {
  try {
    console.log("🔐 Setting up FGA tuples for metro area access...")

    // 1. Create super admin access to all metro areas
    console.log("\n📋 Creating super admin metro area access...")

    // Super admin can view all metro areas
    await fgaClient.write({
      writes: {
        tuple_keys: [
          {
            user: "user:super-admin-user-id", // Replace with actual super admin user ID
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
            user: "user:super-admin-user-id", // Replace with actual super admin user ID
            relation: "can_admin",
            object: "metro_area:*",
          },
        ],
      },
    })
    console.log("✅ Super admin can admin all metro areas")

    // 2. Create partner-metro area relationships (examples)
    console.log("\n📋 Creating example partner-metro area relationships...")

    // Example: Technology partner can view specific metro areas
    const exampleTuples = [
      {
        user: "partner:example-tech-partner-id", // Replace with actual partner ID
        relation: "can_view",
        object: "metro_area:example-metro-id", // Replace with actual metro area ID
      },
      {
        user: "partner:example-tech-partner-id", // Replace with actual partner ID
        relation: "can_admin",
        object: "metro_area:example-metro-id", // Replace with actual metro area ID
      },
    ]

    await fgaClient.write({
      writes: {
        tuple_keys: exampleTuples,
      },
    })
    console.log("✅ Example partner-metro area relationships created")

    console.log("\n🎉 FGA setup completed successfully!")
    console.log("\n📝 Next steps:")
    console.log("   1. Replace placeholder IDs with actual user/partner/metro area IDs")
    console.log("   2. Create tuples for each partner-metro area relationship")
    console.log("   3. Test access using FGA check API")
  } catch (error) {
    console.error("❌ Error setting up FGA tuples:", error)

    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
  }
}

// Helper function to create partner-metro area relationships
async function createPartnerMetroAreaRelationship(partnerId, metroAreaId) {
  try {
    const tuples = [
      {
        user: `partner:${partnerId}`,
        relation: "can_view",
        object: `metro_area:${metroAreaId}`,
      },
      {
        user: `partner:${partnerId}`,
        relation: "can_admin",
        object: `metro_area:${metroAreaId}`,
      },
    ]

    await fgaClient.write({
      writes: { tuple_keys: tuples },
    })

    console.log(
      `✅ Created metro area access for partner ${partnerId} to metro area ${metroAreaId}`
    )
    return true
  } catch (error) {
    console.error(`❌ Failed to create metro area access for partner ${partnerId}:`, error)
    return false
  }
}

// Helper function to remove partner-metro area relationships
async function removePartnerMetroAreaRelationship(partnerId, metroAreaId) {
  try {
    const tuples = [
      {
        user: `partner:${partnerId}`,
        relation: "can_view",
        object: `metro_area:${metroAreaId}`,
      },
      {
        user: `partner:${partnerId}`,
        relation: "can_admin",
        object: `metro_area:${metroAreaId}`,
      },
    ]

    await fgaClient.write({
      deletes: { tuple_keys: tuples },
    })

    console.log(
      `✅ Removed metro area access for partner ${partnerId} to metro area ${metroAreaId}`
    )
    return true
  } catch (error) {
    console.error(`❌ Failed to remove metro area access for partner ${partnerId}:`, error)
    return false
  }
}

// Export functions for use in other scripts
module.exports = {
  setupMetroAreaFGA,
  createPartnerMetroAreaRelationship,
  removePartnerMetroAreaRelationship,
}

// Run setup if called directly
if (require.main === module) {
  setupMetroAreaFGA()
}
