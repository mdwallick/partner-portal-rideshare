import { checkPlatformPermission } from "./fga"

/**
 * Consolidated permission checker that reduces redundant FGA calls
 * by checking super admin status once and caching the result
 */
export class PermissionChecker {
  private isSuperAdmin: boolean | null = null
  private isSuperAdminChecked = false

  /**
   * Check if user is super admin (cached within instance)
   */
  async checkSuperAdmin(userId: string): Promise<boolean> {
    if (!this.isSuperAdminChecked) {
      try {
        this.isSuperAdmin = await checkPlatformPermission(userId, "PLATFORM_SUPER_ADMIN")
        this.isSuperAdminChecked = true
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
   * Reset the permission checker (useful for testing or when user changes)
   */
  reset(): void {
    this.isSuperAdmin = null
    this.isSuperAdminChecked = false
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
