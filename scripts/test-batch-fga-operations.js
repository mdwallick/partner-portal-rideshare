#!/usr/bin/env node

/**
 * Test script for Phase 3: Batch FGA Operations
 * This script demonstrates the new batch capabilities and measures performance improvements
 */

import dotenv from "dotenv"
import {
  createPermissionChecker,
  batchCheckPermissions,
  batchWriteTuples,
  batchDeleteTuples,
} from "../lib/permission-helpers.js"

// Load environment variables
dotenv.config({ path: ".env.local" })

async function testBatchOperations() {
  console.log("🚀 Testing Phase 3: Batch FGA Operations")
  console.log("=" * 50)

  try {
    // Test 1: Permission Checker with Caching
    console.log("\n📋 Test 1: Enhanced Permission Checker with Caching")
    const permissionChecker = createPermissionChecker()

    const testUserId = "auth0|68a796679f567a95cf5e1390" // Example user ID

    console.log("  🔍 Checking super admin status...")
    const startTime = Date.now()
    const isSuperAdmin = await permissionChecker.checkSuperAdmin(testUserId)
    const endTime = Date.now()

    console.log(`  ✅ Super Admin Status: ${isSuperAdmin}`)
    console.log(`  ⏱️  Time taken: ${endTime - startTime}ms`)

    // Test 2: Batch Permission Checks
    console.log("\n📋 Test 2: Batch Permission Checks")
    const permissionChecks = [
      { user: `user:${testUserId}`, relation: "PLATFORM_SUPER_ADMIN", object: "platform:default" },
      {
        user: `user:${testUserId}`,
        relation: "PARTNER_CAN_ADMIN",
        object: "partner:test-partner-1",
      },
      {
        user: `user:${testUserId}`,
        relation: "PARTNER_CAN_VIEW",
        object: "partner:test-partner-2",
      },
      { user: `user:${testUserId}`, relation: "CLIENT_CAN_ADMIN", object: "client:test-client-1" },
    ]

    console.log(`  🔍 Batch checking ${permissionChecks.length} permissions...`)
    const batchStartTime = Date.now()
    const batchResults = await batchCheckPermissions(permissionChecks)
    const batchEndTime = Date.now()

    console.log(`  ✅ Batch results:`, batchResults)
    console.log(`  ⏱️  Batch time: ${batchEndTime - batchStartTime}ms`)

    // Test 3: Individual Permission Checks (for comparison)
    console.log("\n📋 Test 3: Individual Permission Checks (for comparison)")
    const individualStartTime = Date.now()

    const { checkPermission } = await import("../lib/fga.js")
    const individualResults = {}

    for (const check of permissionChecks) {
      const result = await checkPermission(check.user, check.relation, check.object)
      const key = `${check.user}:${check.relation}:${check.object}`
      individualResults[key] = result
    }

    const individualEndTime = Date.now()

    console.log(`  ✅ Individual results:`, individualResults)
    console.log(`  ⏱️  Individual time: ${individualEndTime - individualStartTime}ms`)

    // Test 4: Batch Tuple Operations
    console.log("\n📋 Test 4: Batch Tuple Operations")
    const testTuples = [
      { user: `user:${testUserId}`, relation: "test_relation_1", object: "test_object_1" },
      { user: `user:${testUserId}`, relation: "test_relation_2", object: "test_object_2" },
      { user: `user:${testUserId}`, relation: "test_relation_3", object: "test_object_3" },
    ]

    console.log(`  🔍 Testing batch write operations...`)
    const writeStartTime = Date.now()
    const writeSuccess = await batchWriteTuples(testTuples)
    const writeEndTime = Date.now()

    console.log(`  ✅ Batch write success: ${writeSuccess}`)
    console.log(`  ⏱️  Write time: ${writeEndTime - writeStartTime}ms`)

    // Test 5: Batch Delete Operations
    console.log("\n📋 Test 5: Batch Delete Operations")
    console.log(`  🔍 Testing batch delete operations...`)
    const deleteStartTime = Date.now()
    const deleteSuccess = await batchDeleteTuples(testTuples)
    const deleteEndTime = Date.now()

    console.log(`  ✅ Batch delete success: ${deleteSuccess}`)
    console.log(`  ⏱️  Delete time: ${deleteEndTime - deleteStartTime}ms`)

    // Test 6: Cache Statistics
    console.log("\n📋 Test 6: Cache Statistics")
    const cacheStats = permissionChecker.getCacheStats()
    console.log(`  📊 Cache size: ${cacheStats.size}`)
    console.log(`  📊 Cache hit rate: ${cacheStats.hitRate * 100}%`)

    // Performance Summary
    console.log("\n📊 Performance Summary")
    console.log("=" * 30)

    const batchTime = batchEndTime - batchStartTime
    const individualTime = individualEndTime - individualStartTime
    const timeSavings = individualTime - batchTime
    const percentageSavings = ((timeSavings / individualTime) * 100).toFixed(2)

    console.log(`  ⏱️  Individual checks: ${individualTime}ms`)
    console.log(`  ⏱️  Batch checks: ${batchTime}ms`)
    console.log(`  💾 Time saved: ${timeSavings}ms (${percentageSavings}%)`)

    if (timeSavings > 0) {
      console.log(`  🎉 Batch operations are ${(individualTime / batchTime).toFixed(2)}x faster!`)
    } else {
      console.log(
        `  ⚠️  Batch operations took longer (this might be due to network latency or FGA API response times)`
      )
    }

    console.log("\n✅ All tests completed successfully!")
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

// Run the tests
testBatchOperations().catch(console.error)
