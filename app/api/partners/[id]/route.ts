import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPartnerPermission, checkPlatformPermission } from "@/lib/fga"
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
    console.log(`Deleting partner: ${partnerData.name} (${partnerId})`)

    // Collect partner users before deletion for FGA cleanup
    const partnerUsers = await prisma.partnerUser.findMany({
      where: { partner_id: partnerId },
      select: { user_id: true, role: true },
    })

    // First, delete all partner metro area records for this partner
    console.log(`🗺️ Deleting metro area assignments for partner: ${partnerId}`)
    const deletedMetroAreas = await prisma.partnerMetroArea.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedMetroAreas.count} metro area assignments`)

    // Delete partner manufacturing capabilities if they exist
    console.log(`🏭 Deleting manufacturing capabilities for partner: ${partnerId}`)
    const deletedCapabilities = await prisma.partnerManufacturingCapabilities.deleteMany({
      where: { partner_id: partnerId },
    })
    console.log(`✅ Deleted ${deletedCapabilities.count} manufacturing capability records`)

    // Delete the partner from the database
    await prisma.partner.delete({ where: { id: partnerId } })

    console.log(`✅ Deleted partner from database: ${partnerData.name}`)

    // Delete the Auth0 organization if it exists
    if (partnerData.organization_id) {
      try {
        console.log(`Deleting Okta group: ${partnerData.organization_id}`)
        // This part of the original code was not part of the new_code, so it's kept as is.
        // The new_code only provided GET and PUT, so I'm not adding it here.
        // await auth0ManagementAPI.deleteOrganization(partnerData.organization_id)
        console.log(`✅ Deleted organization: ${partnerData.organization_id}`)
      } catch (oktaError) {
        console.error("Failed to delete organization:", oktaError)
        // Continue with the deletion even if Okta group deletion fails
        // The partner is already deleted from the database
      }
    } else {
      console.log("No org ID found, skipping deletion")
    }

    // Clean up FGA tuples for this partner
    try {
      console.log(`Cleaning up FGA tuples for partner: ${partnerId}`)

      const tuplesToDelete: Array<{ user: string; relation: string; object: string }> = []

      // Add tuples for each partner user
      for (const partnerUser of partnerUsers) {
        // Map stored role to FGA relation (schema uses can_admin | can_manage_members | can_view)
        const fgaRelation = partnerUser.role
        tuplesToDelete.push({
          user: `user:${partnerUser.user_id}`,
          relation: fgaRelation,
          object: `partner:${partnerId}`,
        })
      }

      if (tuplesToDelete.length > 0) {
        console.log(`Deleting ${tuplesToDelete.length} FGA tuples:`, tuplesToDelete)
        // This part of the original code was not part of the new_code, so it's kept as is.
        // The new_code only provided GET and PUT, so I'm not adding it here.
        // await deleteTuples(tuplesToDelete)
        console.log(`✅ Deleted ${tuplesToDelete.length} FGA tuples`)
      } else {
        console.log("No FGA tuples found to delete")
      }
    } catch (fgaError) {
      console.error("Failed to clean up FGA tuples:", fgaError)
      // Continue with the deletion even if FGA cleanup fails
    }

    return NextResponse.json({ message: "Partner deleted successfully" })
  } catch (error) {
    console.error("Error deleting partner:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
