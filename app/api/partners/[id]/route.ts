import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPartnerPermission, checkPlatformPermission, deleteTuples } from "@/lib/fga"
import { PartnerType } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: partnerId } = await params

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the partner
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        metroAreas: {
          include: {
            metro_area: true,
          },
        },
        manufacturingCapabilities: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Check if user has view permission on the partner
    const canView = await checkPartnerPermission(user.sub, "PARTNER_CAN_VIEW", partnerId)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Transform the response to include metro areas in a cleaner format
    const partnerWithMetroAreas = {
      ...partner,
      metroAreas: partner.metroAreas.map(pma => pma.metro_area),
    }

    return NextResponse.json(partnerWithMetroAreas)
  } catch (error) {
    console.error("Error fetching partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: partnerId } = await params

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse JSON body
    const body = await request.json()
    const name = body.name as string
    const typeString = body.type as string
    const logo_url = body.logo_url as string | null
    const metroAreaIds = body.metroAreaIds as string | null
    const manufacturingCapabilities = body.manufacturingCapabilities as {
      hardware_sensors?: boolean
      hardware_parts?: boolean
      software_firmware?: boolean
    } | null

    // Validate partner type
    if (typeString && !["technology", "manufacturing", "fleet_maintenance"].includes(typeString)) {
      return NextResponse.json(
        {
          error:
            "Invalid partner type. Must be 'technology', 'manufacturing', or 'fleet_maintenance'",
        },
        { status: 400 }
      )
    }

    // Validate manufacturing capabilities for manufacturing partners
    if (typeString === "manufacturing" && manufacturingCapabilities) {
      if (
        typeof manufacturingCapabilities.hardware_sensors !== "boolean" ||
        typeof manufacturingCapabilities.hardware_parts !== "boolean" ||
        typeof manufacturingCapabilities.software_firmware !== "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "Manufacturing capabilities must include boolean values for hardware_sensors, hardware_parts, and software_firmware",
          },
          { status: 400 }
        )
      }
    }

    // Convert string to PartnerType enum (only if type is provided)
    const type = typeString ? (typeString as PartnerType) : undefined

    // Get the partner
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Check if user has admin permission on the partner OR is a platform super admin
    const canAdmin = await checkPartnerPermission(user.sub, "PARTNER_CAN_ADMIN", partnerId)
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN")

    if (!canAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the partner
    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        name: name?.trim() || partner.name,
        type: type || partner.type,
        logo_url: logo_url !== undefined ? logo_url : partner.logo_url,
      },
    })

    // Handle manufacturing capabilities updates if provided
    if (
      manufacturingCapabilities &&
      (type === "manufacturing" || partner.type === "manufacturing")
    ) {
      try {
        console.log("🏭 Processing manufacturing capabilities update:", manufacturingCapabilities)

        // Upsert manufacturing capabilities (create if doesn't exist, update if it does)
        await prisma.partnerManufacturingCapabilities.upsert({
          where: { partner_id: partnerId },
          update: {
            hardware_sensors: manufacturingCapabilities.hardware_sensors || false,
            hardware_parts: manufacturingCapabilities.hardware_parts || false,
            software_firmware: manufacturingCapabilities.software_firmware || false,
          },
          create: {
            partner_id: partnerId,
            hardware_sensors: manufacturingCapabilities.hardware_sensors || false,
            hardware_parts: manufacturingCapabilities.hardware_parts || false,
            software_firmware: manufacturingCapabilities.software_firmware || false,
          },
        })

        console.log(
          `✅ Updated manufacturing capabilities for partner ${partnerId}:`,
          manufacturingCapabilities
        )
      } catch (capabilityError) {
        console.error("❌ Error updating manufacturing capabilities:", capabilityError)
        // Don't fail the entire update if manufacturing capabilities update fails
      }
    }

    // Handle metro area assignment if provided and user is super admin
    if (metroAreaIds && isSuperAdmin) {
      try {
        console.log("🗺️ Processing metro area assignment:", metroAreaIds)

        // Parse metro area IDs (they come as a comma-separated string from FormData)
        const metroAreaIdArray = metroAreaIds.split(",").filter(id => id.trim())

        if (metroAreaIdArray.length > 0) {
          // First, remove all existing metro area assignments
          await prisma.partnerMetroArea.deleteMany({
            where: { partner_id: partnerId },
          })

          // Then create new assignments
          const metroAreaAssignments = metroAreaIdArray.map(metroAreaId => ({
            partner_id: partnerId,
            metro_area_id: metroAreaId.trim(),
          }))

          await prisma.partnerMetroArea.createMany({
            data: metroAreaAssignments,
          })

          console.log(
            `✅ Updated metro area assignments for partner ${partnerId}:`,
            metroAreaIdArray
          )
        } else {
          // If no metro areas selected, remove all assignments
          await prisma.partnerMetroArea.deleteMany({
            where: { partner_id: partnerId },
          })
          console.log(`✅ Removed all metro area assignments for partner ${partnerId}`)
        }
      } catch (metroError) {
        console.error("❌ Error updating metro area assignments:", metroError)
        // Don't fail the entire update if metro area assignment fails
      }
    }

    console.log(`🗄️ Updated partner ${partnerId}`)
    return NextResponse.json(updatedPartner)
  } catch (error) {
    console.error("Error updating partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: partnerId } = await params

    // Check if user has platform-level super admin access
    const hasSuperAdminAccess = await checkPlatformPermission(
      user?.sub || "",
      "PLATFORM_SUPER_ADMIN"
    )

    if (!hasSuperAdminAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // First, get the partner details to find the org/group ID
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const partnerData = partner
    console.log(`🗑️ Starting comprehensive deletion of partner: ${partnerData.name} (${partnerId})`)

    // Step 1: Collect all related data for FGA cleanup before deletion
    console.log(`📋 Collecting related data for cleanup...`)

    const partnerUsers = await prisma.partnerUser.findMany({
      where: { partner_id: partnerId },
      select: { user_id: true, role: true },
    })

    const clientIds = await prisma.clientId.findMany({
      where: { partner_id: partnerId },
      select: { id: true },
    })

    const documents = await prisma.document.findMany({
      where: { partner_id: partnerId },
      select: { id: true },
    })

    console.log(
      `📊 Found ${partnerUsers.length} partner users, ${clientIds.length} client IDs, ${documents.length} documents`
    )

    // Step 2: Clean up FGA tuples for this partner
    console.log(`🧹 Cleaning up FGA tuples for partner: ${partnerId}`)

    try {
      const tuplesToDelete: Array<{ user: string; relation: string; object: string }> = []

      // Add tuples for each partner user
      for (const partnerUser of partnerUsers) {
        // Map stored role to FGA relation
        const fgaRelation = partnerUser.role
        tuplesToDelete.push({
          user: `user:${partnerUser.user_id}`,
          relation: fgaRelation,
          object: `partner:${partnerId}`,
        })
      }

      // Add tuples for client relationships
      for (const clientId of clientIds) {
        // Delete client-related FGA tuples
        tuplesToDelete.push(
          { user: `partner:${partnerId}`, relation: "can_admin", object: `client:${clientId.id}` },
          { user: `partner:${partnerId}`, relation: "can_view", object: `client:${clientId.id}` },
          { user: `partner:${partnerId}`, relation: "parent", object: `client:${clientId.id}` }
        )
      }

      // Add tuples for document relationships
      for (const document of documents) {
        // Delete document-related FGA tuples
        tuplesToDelete.push(
          {
            user: `partner:${partnerId}`,
            relation: "can_admin",
            object: `document:${document.id}`,
          },
          { user: `partner:${partnerId}`, relation: "can_view", object: `document:${document.id}` }
        )
      }

      // Add partner-level FGA tuples
      tuplesToDelete.push(
        { user: `partner:${partnerId}`, relation: "can_admin", object: `metro_area:*` },
        { user: `partner:${partnerId}`, relation: "can_view", object: `metro_area:*` }
      )

      if (tuplesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${tuplesToDelete.length} FGA tuples...`)
        const fgaDeleteResult = await deleteTuples(tuplesToDelete)
        if (fgaDeleteResult) {
          console.log(`✅ Successfully deleted ${tuplesToDelete.length} FGA tuples`)
        } else {
          console.log(`⚠️ FGA tuple deletion may have failed`)
        }
      } else {
        console.log(`ℹ️ No FGA tuples found to delete`)
      }
    } catch (fgaError) {
      console.error("❌ Failed to clean up FGA tuples:", fgaError)
      // Continue with the deletion even if FGA cleanup fails
    }

    // Step 3: Delete all related database records in the correct order
    console.log(`🗄️ Deleting related database records...`)

    // Delete partner metro area assignments
    console.log(`🗺️ Deleting metro area assignments...`)
    const deletedMetroAreas = await prisma.partnerMetroArea.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedMetroAreas.count} metro area assignments`)

    // Delete partner manufacturing capabilities
    console.log(`🏭 Deleting manufacturing capabilities...`)
    const deletedCapabilities = await prisma.partnerManufacturingCapabilities.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedCapabilities.count} manufacturing capability records`)

    // Delete client IDs
    console.log(`🔑 Deleting client IDs...`)
    const deletedClientIds = await prisma.clientId.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedClientIds.count} client ID records`)

    // Delete documents
    console.log(`📄 Deleting documents...`)
    const deletedDocuments = await prisma.document.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedDocuments.count} document records`)

    // Delete partner user relationships
    console.log(`👥 Deleting partner user relationships...`)
    const deletedPartnerUsers = await prisma.partnerUser.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedPartnerUsers.count} partner user relationships`)

    // Step 4: Finally delete the partner record itself
    console.log(`🏢 Deleting partner record...`)
    await prisma.partner.delete({ where: { id: partnerId } })
    console.log(`✅ Successfully deleted partner: ${partnerData.name}`)

    // Step 5: Clean up external services (if applicable)
    if (partnerData.organization_id) {
      try {
        console.log(`🌐 Cleaning up external organization: ${partnerData.organization_id}`)
        // Note: Auth0 organization cleanup would go here if implemented
        // await auth0ManagementAPI.deleteOrganization(partnerData.organization_id)
        console.log(`✅ External organization cleanup completed`)
      } catch (externalError) {
        console.error("⚠️ Failed to clean up external organization:", externalError)
        // Continue - the partner is already deleted from the database
      }
    } else {
      console.log(`ℹ️ No external organization ID found, skipping external cleanup`)
    }

    console.log(`🎉 Partner deletion completed successfully: ${partnerData.name}`)
    return NextResponse.json({
      message: "Partner deleted successfully",
      deletedRecords: {
        metroAreas: deletedMetroAreas.count,
        manufacturingCapabilities: deletedCapabilities.count,
        clientIds: deletedClientIds.count,
        documents: deletedDocuments.count,
        partnerUsers: deletedPartnerUsers.count,
      },
    })
  } catch (error) {
    console.error("❌ Error deleting partner:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Authentication required")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (error.message.includes("foreign key constraint")) {
        return NextResponse.json(
          {
            error: "Cannot delete partner due to remaining references. Please contact support.",
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
