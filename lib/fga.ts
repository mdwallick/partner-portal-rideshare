import { OpenFgaApi, Configuration, CredentialsMethod } from "@openfga/sdk"
import {
  FGA_AUTHORIZATION_MODEL,
  FGA_RELATIONS,
  FGA_TYPES,
  createFgaObject,
  createFgaUser,
  createFgaPartner,
  createFgaClient,
  createFgaDocument,
  createFgaPlatform,
} from "./fga-model"

// Initialize FGA client
const fgaClient = new OpenFgaApi(
  new Configuration({
    apiUrl: process.env.FGA_API_URL || "https://api.fga.example",
    storeId: process.env.FGA_STORE_ID || "",
    credentials: {
      method: CredentialsMethod.ClientCredentials,
      config: {
        apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER || "",
        apiAudience: process.env.FGA_API_AUDIENCE || "",
        clientId: process.env.FGA_CLIENT_ID || "",
        clientSecret: process.env.FGA_CLIENT_SECRET || "",
      },
    },
  })
)

// Cache for the latest authorization model ID
let cachedModelId: string | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to get the latest authorization model ID
export async function getLatestAuthorizationModelId(): Promise<string> {
  const now = Date.now()

  // Return cached value if still valid
  if (cachedModelId && now < cacheExpiry) {
    return cachedModelId
  }

  try {
    console.log("🔍 Fetching latest FGA authorization model...")
    const response = await fgaClient.readAuthorizationModels()

    if (!response.authorization_models || response.authorization_models.length === 0) {
      throw new Error("No authorization models found")
    }

    // Get the most recent model (they're sorted by creation time, newest first)
    const latestModel = response.authorization_models[0]
    cachedModelId = latestModel.id || ""
    cacheExpiry = now + CACHE_DURATION

    console.log(`🔍 Using latest FGA model: ${cachedModelId}`)
    return cachedModelId
  } catch (error) {
    console.error("❌ Failed to fetch latest FGA authorization model:", error)

    // Fallback to environment variable if available
    const fallbackModelId = process.env.FGA_AUTHORIZATION_MODEL_ID
    if (fallbackModelId) {
      console.log(`⚠️ Falling back to environment model ID: ${fallbackModelId}`)
      return fallbackModelId
    }

    throw new Error("No FGA authorization model available")
  }
}

// Legacy export for backward compatibility (deprecated)
export const FGA_AUTHORIZATION_MODEL_ID = process.env.FGA_AUTHORIZATION_MODEL_ID || ""

export { fgaClient }

// Helper functions for FGA operations
export async function checkPermission(
  user: string,
  relation: string,
  object: string
): Promise<boolean> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    const response = await fgaClient.check({
      authorization_model_id: modelId,
      tuple_key: {
        user,
        relation,
        object,
      },
    })
    return response.allowed || false
  } catch (error) {
    console.error("FGA check error:", error)
    return false
  }
}

// New helper functions for the updated FGA model
export async function checkPartnerPermission(
  auth0UserId: string,
  relation: keyof typeof FGA_RELATIONS,
  partnerId: string
): Promise<boolean> {
  const user = createFgaUser(auth0UserId)
  const partner = createFgaPartner(partnerId)
  return checkPermission(user, FGA_RELATIONS[relation], partner)
}

export async function checkClientPermission(
  auth0UserId: string,
  relation: keyof typeof FGA_RELATIONS,
  clientId: string
): Promise<boolean> {
  const user = createFgaUser(auth0UserId)
  const client = createFgaClient(clientId)
  return checkPermission(user, FGA_RELATIONS[relation], client)
}

export async function checkDocumentPermission(
  auth0UserId: string,
  relation: keyof typeof FGA_RELATIONS,
  documentId: string
): Promise<boolean> {
  const user = createFgaUser(auth0UserId)
  const document = createFgaDocument(documentId)
  return checkPermission(user, FGA_RELATIONS[relation], document)
}

export async function checkPlatformPermission(
  auth0UserId: string,
  relation: keyof typeof FGA_RELATIONS,
  platformId: string = "default"
): Promise<boolean> {
  const user = createFgaUser(auth0UserId)
  const platform = createFgaPlatform(platformId)

  console.log("🔍 FGA Platform Permission Check:")
  console.log("  👤 User:", user)
  console.log("  🏢 Platform:", platform)
  console.log("  🔑 Relation:", FGA_RELATIONS[relation])
  console.log("  📋 Relation Key:", relation)

  const result = await checkPermission(user, FGA_RELATIONS[relation], platform)
  console.log("  ✅ Result:", result)

  return result
}

export async function writeTuple(user: string, relation: string, object: string): Promise<boolean> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    await fgaClient.write({
      authorization_model_id: modelId,
      writes: {
        tuple_keys: [
          {
            user,
            relation,
            object,
          },
        ],
      },
    })
    return true
  } catch (error) {
    console.error("FGA write error:", error)
    return false
  }
}

export async function deleteTuple(
  user: string,
  relation: string,
  object: string
): Promise<boolean> {
  try {
    const modelId = await getLatestAuthorizationModelId()
    await fgaClient.write({
      authorization_model_id: modelId,
      deletes: {
        tuple_keys: [
          {
            user,
            relation,
            object,
          },
        ],
      },
    })
    return true
  } catch (error) {
    console.error("FGA delete error:", error)
    return false
  }
}

export async function deleteTuples(
  tuples: Array<{ user: string; relation: string; object: string }>
): Promise<boolean> {
  try {
    if (tuples.length === 0) {
      return true
    }

    const modelId = await getLatestAuthorizationModelId()
    await fgaClient.write({
      authorization_model_id: modelId,
      deletes: {
        tuple_keys: tuples,
      },
    })
    return true
  } catch (error) {
    console.error("FGA bulk delete error:", error)
    return false
  }
}

export async function listObjects(
  user: string,
  relation: string,
  objectType: string
): Promise<string[]> {
  try {
    console.log("🔍 FGA listObjects called:")
    console.log("  👤 User:", user)
    console.log("  🔑 Relation:", relation)
    console.log("  🏷️ Object Type:", objectType)

    const modelId = await getLatestAuthorizationModelId()
    console.log("  📋 Model ID:", modelId)

    const response = await fgaClient.listObjects({
      authorization_model_id: modelId,
      user,
      relation,
      type: objectType,
    })

    console.log("📡 FGA response:", response)

    // Extract object IDs from the response
    // The response contains objects in format like "partner:uuid"
    // We need to extract just the UUID part
    const objects = response.objects || []
    const extractedIds = objects.map(obj => {
      // Extract the ID part after the colon (e.g., "partner:uuid" -> "uuid")
      const parts = obj.split(":")
      return parts.length > 1 ? parts[1] : obj
    })

    console.log("🔗 Extracted object IDs:", extractedIds)
    return extractedIds
  } catch (error) {
    console.error("❌ FGA listObjects error:", error)
    return []
  }
}
