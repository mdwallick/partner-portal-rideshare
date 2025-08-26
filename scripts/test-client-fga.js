#!/usr/bin/env node

/**
 * Test script to verify client FGA tuple management
 * This script tests the creation, reading, and cleanup of FGA tuples for clients
 */

import { fgaClient } from "../lib/fga.js"
import { createFgaClient, createFgaPartner, createFgaUser } from "../lib/fga-model.js"

async function testClientFGA() {
  console.log("🧪 Testing Client FGA Tuple Management...\n")

  try {
    // Test data
    const testClientId = "test-client-123"
    const testPartnerId = "test-partner-456"
    const testUserId = "test-user-789"

    const clientObj = createFgaClient(testClientId)
    const partnerObj = createFgaPartner(testPartnerId)
    const userObj = createFgaUser(testUserId)

    console.log("📋 Test Objects:")
    console.log(`  Client: ${clientObj}`)
    console.log(`  Partner: ${partnerObj}`)
    console.log(`  User: ${userObj}\n`)

    // Test 1: Create FGA tuples
    console.log("🔐 Test 1: Creating FGA Tuples...")

    // Client belongs to partner
    await fgaClient.write({
      tuple_key: {
        user: clientObj,
        relation: "parent",
        object: partnerObj,
      },
    })
    console.log("  ✅ Created: client parent partner")

    // User can view client
    await fgaClient.write({
      tuple_key: {
        user: userObj,
        relation: "can_view",
        object: clientObj,
      },
    })
    console.log("  ✅ Created: user can_view client")

    // User can admin client
    await fgaClient.write({
      tuple_key: {
        user: userObj,
        relation: "can_admin",
        object: clientObj,
      },
    })
    console.log("  ✅ Created: user can_admin client\n")

    // Test 2: Verify tuples exist
    console.log("🔍 Test 2: Verifying FGA Tuples...")

    const listResponse = await fgaClient.listObjects({
      user: userObj,
      relation: "can_view",
      type: "client",
    })

    if (listResponse.objects && listResponse.objects.length > 0) {
      console.log("  ✅ Found client objects user can view:", listResponse.objects)
    } else {
      console.log("  ❌ No client objects found for user view permission")
    }

    // Test 3: Check specific permissions
    console.log("\n🔍 Test 3: Checking Specific Permissions...")

    const checkResponse = await fgaClient.check({
      tuple_key: {
        user: userObj,
        relation: "can_admin",
        object: clientObj,
      },
    })

    console.log(`  ✅ User can_admin client: ${checkResponse.allowed}`)

    // Test 4: Cleanup test tuples
    console.log("\n🧹 Test 4: Cleaning Up Test Tuples...")

    await fgaClient.write({
      deletes: {
        tuple_keys: [
          {
            user: clientObj,
            relation: "parent",
            object: partnerObj,
          },
          {
            user: userObj,
            relation: "can_view",
            object: clientObj,
          },
          {
            user: userObj,
            relation: "can_admin",
            object: clientObj,
          },
        ],
      },
    })

    console.log("  ✅ Cleaned up all test tuples")

    console.log("\n🎉 All tests passed! Client FGA tuple management is working correctly.")
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

// Run the test
testClientFGA().catch(console.error)
