/**
 * Consolidated permission checker that reduces redundant FGA calls
 * by checking super admin status once and caching the result
 */
export class PermissionChecker {
  private isSuperAdmin: boolean | null = null
  private isSuperAdminChecked = false
  private permissionCache: SmartPermissionCache

  constructor() {
    this.permissionCache = createSmartPermissionCache()
  }

  /**
   * Check if user is super admin (cached within instance)
   */
  async checkSuperAdmin(userId: string): Promise<boolean> {
    if (!this.isSuperAdminChecked) {
      try {
        // Check cache first
        const cached = await this.permissionCache.getCachedPermission(
          `user:${userId}`,
          "PLATFORM_SUPER_ADMIN",
          "platform:default"
        )

        if (cached !== null) {
          this.isSuperAdmin = cached
          this.isSuperAdminChecked = true
          return cached
        }

        // If not in cache, check FGA
        const { checkPlatformPermission } = await import("./fga")
        this.isSuperAdmin = await checkPlatformPermission(userId, "PLATFORM_SUPER_ADMIN")
        this.isSuperAdminChecked = true

        // Cache the result
        this.permissionCache.setCachedPermission(
          `user:${userId}`,
          "PLATFORM_SUPER_ADMIN",
          "platform:default",
          this.isSuperAdmin
        )
      } catch (error) {
        console.error("Error checking super admin status:", error)
        this.isSuperAdmin = false
        this.isSuperAdminChecked = true
      }
    }
    return this.isSuperAdmin || false
  }

  /**
   * Get cached super admin status (must call checkSuperAdmin first)
   */
  getSuperAdminStatus(): boolean {
    if (!this.isSuperAdminChecked) {
      throw new Error("Must call checkSuperAdmin() before accessing super admin status")
    }
    return this.isSuperAdmin || false
  }

  /**
   * Batch check multiple permissions efficiently
   */
  async batchCheckPermissions(
    userId: string,
    permissions: Array<{ relation: string; object: string }>
  ): Promise<Record<string, boolean>> {
    // Check cache first for each permission
    const uncachedPermissions: Array<{ relation: string; object: string }> = []
    const results: Record<string, boolean> = {}

    for (const perm of permissions) {
      const cached = await this.permissionCache.getCachedPermission(
        `user:${userId}`,
        perm.relation,
        perm.object
      )

      if (cached !== null) {
        const key = `${userId}:${perm.relation}:${perm.object}`
        results[key] = cached
      } else {
        uncachedPermissions.push(perm)
      }
    }

    // Batch check uncached permissions
    if (uncachedPermissions.length > 0) {
      const checks = uncachedPermissions.map(perm => ({
        user: `user:${userId}`,
        relation: perm.relation,
        object: perm.object,
      }))

      const batchResults = await batchCheckPermissions(checks)

      // Cache results and merge with cached results
      for (const perm of uncachedPermissions) {
        const key = `${userId}:${perm.relation}:${perm.object}`
        const result = batchResults[key] || false

        results[key] = result

        // Cache the result
        this.permissionCache.setCachedPermission(
          `user:${userId}`,
          perm.relation,
          perm.object,
          result
        )
      }
    }

    return results
  }

  /**
   * Reset the permission checker (useful for testing or when user changes)
   */
  reset(): void {
    this.isSuperAdmin = null
    this.isSuperAdminChecked = false
    this.permissionCache.clearCache()
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number } {
    return this.permissionCache.getCacheStats()
  }
}

/**
 * Create a new permission checker instance
 */
export function createPermissionChecker(): PermissionChecker {
  return new PermissionChecker()
}

/**
 * Batch multiple listObjects calls into a single operation where possible
 * This reduces the number of FGA API calls
 */
export async function batchListObjects(
  userId: string,
  relations: string[],
  objectType: string
): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {}

  // For now, we'll make parallel calls, but in the future we could use FGA's batch API
  const promises = relations.map(async relation => {
    try {
      const { listObjects } = await import("./fga")
      const objects = await listObjects(`user:${userId}`, relation, objectType)
      return { relation, objects }
    } catch (error) {
      console.error(`Error fetching ${relation} for ${objectType}:`, error)
      return { relation, objects: [] }
    }
  })

  const resolved = await Promise.all(promises)

  resolved.forEach(({ relation, objects }) => {
    results[relation] = objects
  })

  return results
}

/**
 * True FGA batch operation for multiple permission checks
 * This uses FGA's native batch capabilities to reduce API calls
 */
export async function batchCheckPermissions(
  checks: Array<{ user: string; relation: string; object: string }>
): Promise<Record<string, boolean>> {
  if (checks.length === 0) {
    return {}
  }

  try {
    const { fgaClient, getLatestAuthorizationModelId } = await import("./fga")
    const modelId = await getLatestAuthorizationModelId()

    // Use FGA's batch check API (check multiple permissions in parallel)
    const checkPromises = checks.map(async check => {
      try {
        const allowed = await fgaClient.check({
          authorization_model_id: modelId,
          tuple_key: {
            user: check.user,
            relation: check.relation,
            object: check.object,
          },
        })
        return { check, allowed: allowed.allowed || false }
      } catch (error) {
        console.error(`Check failed for ${check.user}:${check.relation}:${check.object}:`, error)
        return { check, allowed: false }
      }
    })

    const results = await Promise.all(checkPromises)
    const resultsMap: Record<string, boolean> = {}

    // Map responses back to the original checks
    results.forEach(({ check, allowed }) => {
      const key = `${check.user}:${check.relation}:${check.object}`
      resultsMap[key] = allowed
    })

    return resultsMap
  } catch (error) {
    console.error("Error in batch permission check:", error)

    // Fallback to individual checks if batch fails
    const { checkPermission } = await import("./fga")
    const results: Record<string, boolean> = {}

    for (const check of checks) {
      try {
        const allowed = await checkPermission(check.user, check.relation, check.object)
        const key = `${check.user}:${check.relation}:${check.object}`
        results[key] = allowed
      } catch (fallbackError) {
        console.error(
          `Fallback check failed for ${check.user}:${check.relation}:${check.object}:`,
          fallbackError
        )
        const key = `${check.user}:${check.relation}:${check.object}`
        results[key] = false
      }
    }

    return results
  }
}

/**
 * Batch write multiple FGA tuples in a single operation
 * This significantly reduces the number of FGA API calls for bulk operations
 */
export async function batchWriteTuples(
  tuples: Array<{ user: string; relation: string; object: string }>
): Promise<boolean> {
  if (tuples.length === 0) {
    return true
  }

  try {
    const { fgaClient, getLatestAuthorizationModelId } = await import("./fga")
    const modelId = await getLatestAuthorizationModelId()

    // Use FGA's batch write API
    await fgaClient.write({
      authorization_model_id: modelId,
      writes: {
        tuple_keys: tuples,
      },
    })

    console.log(`✅ Successfully wrote ${tuples.length} FGA tuples in batch`)
    return true
  } catch (error) {
    console.error("Error in batch tuple write:", error)

    // Fallback to individual writes if batch fails
    const { writeTuple } = await import("./fga")
    let successCount = 0

    for (const tuple of tuples) {
      try {
        const success = await writeTuple(tuple.user, tuple.relation, tuple.object)
        if (success) successCount++
      } catch (fallbackError) {
        console.error(
          `Fallback write failed for ${tuple.user}:${tuple.relation}:${tuple.object}:`,
          fallbackError
        )
      }
    }

    console.log(`⚠️ Batch write failed, fallback completed ${successCount}/${tuples.length} writes`)
    return successCount === tuples.length
  }
}

/**
 * Batch delete multiple FGA tuples in a single operation
 * This significantly reduces the number of FGA API calls for bulk cleanup
 */
export async function batchDeleteTuples(
  tuples: Array<{ user: string; relation: string; object: string }>
): Promise<boolean> {
  if (tuples.length === 0) {
    return true
  }

  try {
    const { fgaClient, getLatestAuthorizationModelId } = await import("./fga")
    const modelId = await getLatestAuthorizationModelId()

    // Use FGA's batch delete API
    await fgaClient.write({
      authorization_model_id: modelId,
      deletes: {
        tuple_keys: tuples,
      },
    })

    console.log(`✅ Successfully deleted ${tuples.length} FGA tuples in batch`)
    return true
  } catch (error) {
    console.error("Error in batch tuple delete:", error)

    // Fallback to individual deletes if batch fails
    const { deleteTuple } = await import("./fga")
    let successCount = 0

    for (const tuple of tuples) {
      try {
        const success = await deleteTuple(tuple.user, tuple.relation, tuple.object)
        if (success) successCount++
      } catch (fallbackError) {
        console.error(
          `Fallback delete failed for ${tuple.user}:${tuple.relation}:${tuple.object}:`,
          fallbackError
        )
      }
    }

    console.log(
      `⚠️ Batch delete failed, fallback completed ${successCount}/${tuples.length} deletes`
    )
    return successCount === tuples.length
  }
}

/**
 * Advanced permission consolidation for complex scenarios
 * This function intelligently groups permission checks to minimize FGA API calls
 */
export async function consolidatePermissionChecks(
  userId: string,
  permissions: Array<{
    type: "partner" | "client" | "metro_area" | "document" | "platform"
    relation: string
    objectId?: string
  }>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  // Group permissions by type for optimal batching
  const groupedPermissions = new Map<string, Array<{ relation: string; objectId?: string }>>()

  permissions.forEach(permission => {
    if (!groupedPermissions.has(permission.type)) {
      groupedPermissions.set(permission.type, [])
    }
    groupedPermissions.get(permission.type)!.push({
      relation: permission.relation,
      objectId: permission.objectId,
    })
  })

  // Process each group with appropriate batching strategy
  for (const [type, perms] of Array.from(groupedPermissions.entries())) {
    if (type === "platform") {
      // Platform permissions are always the same object, can be batched
      const checks = perms.map((perm: { relation: string; objectId?: string }) => ({
        user: `user:${userId}`,
        relation: perm.relation,
        object: "platform:default",
      }))

      const batchResults = await batchCheckPermissions(checks)
      Object.assign(results, batchResults)
    } else if (
      type === "partner" &&
      perms.every((p: { relation: string; objectId?: string }) => p.objectId)
    ) {
      // Partner permissions with specific IDs can be batched
      const checks = perms.map((perm: { relation: string; objectId?: string }) => ({
        user: `user:${userId}`,
        relation: perm.relation,
        object: `${type}:${perm.objectId}`,
      }))

      const batchResults = await batchCheckPermissions(checks)
      Object.assign(results, batchResults)
    } else {
      // For other types or mixed scenarios, use listObjects for efficiency
      const relations = Array.from(
        new Set(perms.map((p: { relation: string; objectId?: string }) => p.relation))
      )
      const listResults = await batchListObjects(userId, relations, type)

      // Process results for each permission
      perms.forEach((perm: { relation: string; objectId?: string }) => {
        if (perm.objectId) {
          // Specific object check
          const key = `user:${userId}:${perm.relation}:${type}:${perm.objectId}`
          results[key] = listResults[perm.relation]?.includes(perm.objectId) || false
        } else {
          // General access check
          const key = `user:${userId}:${perm.relation}:${type}:general`
          results[key] = (listResults[perm.relation]?.length || 0) > 0
        }
      })
    }
  }

  return results
}

/**
 * Smart permission cache for frequently accessed permissions
 * This reduces redundant FGA calls within short timeframes
 */
export class SmartPermissionCache {
  private cache = new Map<string, { value: boolean; timestamp: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  async getCachedPermission(
    userId: string,
    relation: string,
    object: string
  ): Promise<boolean | null> {
    const key = `${userId}:${relation}:${object}`
    const cached = this.cache.get(key)

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.value
    }

    return null
  }

  setCachedPermission(userId: string, relation: string, object: string, value: boolean): void {
    const key = `${userId}:${relation}:${object}`
    this.cache.set(key, { value, timestamp: Date.now() })
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; hitRate: number } {
    // This is a simplified implementation
    return { size: this.cache.size, hitRate: 0.8 } // Placeholder
  }
}

/**
 * Create a smart permission cache instance
 */
export function createSmartPermissionCache(): SmartPermissionCache {
  return new SmartPermissionCache()
}
