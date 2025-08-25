#!/usr/bin/env tsx

import { fgaClient, writeTuple } from "../lib/fga"
import { createFgaPlatform, createFgaPartner, createFgaUser, FGA_RELATIONS } from "../lib/fga-model"
import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const prisma = new PrismaClient()

async function initializeFgaTuples() {
  try {
    console.log("🚀 Initializing FGA tuples...")

    const modelId = process.env.FGA_AUTHORIZATION_MODEL_ID
    if (!modelId) {
      throw new Error("FGA_AUTHORIZATION_MODEL_ID not set in environment")
    }

    // 1. Create platform object
    const platformId = "default"
    const platform = createFgaPlatform(platformId)
    console.log(`📋 Created platform: ${platform}`)

    // 2. Get existing partners from database
    const partners = await prisma.partner.findMany({
      where: { status: "active" },
      include: { partnerUsers: true },
    })

    console.log(`📊 Found ${partners.length} active partners`)

    // 3. Create tuples for each partner
    for (const partner of partners) {
      const partnerObj = createFgaPartner(partner.id)

      // Partner belongs to platform
      await writeTuple(partnerObj, "parent", platform)
      console.log(`🔗 Linked partner ${partner.name} to platform`)

      // Create tuples for partner users
      for (const partnerUser of partner.partnerUsers) {
        if (partnerUser.status === "active") {
          const user = createFgaUser(partnerUser.user.auth0_user_id)

          // Set user permissions based on role
          switch (partnerUser.role) {
            case "can_admin":
              await writeTuple(user, FGA_RELATIONS.PARTNER_CAN_ADMIN, partnerObj)
              await writeTuple(user, FGA_RELATIONS.PARTNER_CAN_MANAGE_MEMBERS, partnerObj)
              await writeTuple(user, FGA_RELATIONS.PARTNER_CAN_VIEW, partnerObj)
              break
            case "can_manage_members":
              await writeTuple(user, FGA_RELATIONS.PARTNER_CAN_MANAGE_MEMBERS, partnerObj)
              await writeTuple(user, FGA_RELATIONS.PARTNER_CAN_VIEW, partnerObj)
              break
            case "can_view":
              await writeTuple(user, FGA_RELATIONS.PARTNER_CAN_VIEW, partnerObj)
              break
          }

          console.log(
            `👤 Set ${partnerUser.role} permissions for user ${partnerUser.user.email} on partner ${partner.name}`
          )
        }
      }
    }

    // 4. Create initial platform super admin (you'll need to set this up)
    // This should be done manually for security reasons
    console.log(`⚠️  Remember to manually create platform super admin tuples`)
    console.log(`   Example: user:auth0_user_id ${FGA_RELATIONS.PLATFORM_SUPER_ADMIN} ${platform}`)

    console.log("✅ FGA tuples initialized successfully!")
  } catch (error) {
    console.error("❌ Failed to initialize FGA tuples:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the initialization
initializeFgaTuples()
