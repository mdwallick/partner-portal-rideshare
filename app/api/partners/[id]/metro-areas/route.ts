import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { checkPermission, checkPlatformPermission } from "@/lib/fga"
import { prisma } from "@/lib/prisma"

// GET /api/partners/[id]/metro-areas - List metro areas assigned to a partner
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: partnerId } = await params

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub!, "PLATFORM_SUPER_ADMIN")

    if (isSuperAdmin) {
      // Super admins can see all metro areas assigned to any partner
      const partnerMetroAreas = await prisma.partnerMetroArea.findMany({
        where: { partner_id: partnerId },
        include: {
          metro_area: true,
        },
        orderBy: {
          metro_area: { name: "asc" },
        },
      })

      const metroAreas = partnerMetroAreas.map(pma => pma.metro_area)
      return NextResponse.json(metroAreas)
    }

    // For non-super admins, check if they have access to this partner
    const canView = await checkPermission(session.user.sub!, "can_view", `partner:${partnerId}`)

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get metro areas accessible to this partner
    const partnerMetroAreas = await prisma.partnerMetroArea.findMany({
      where: { partner_id: partnerId },
      include: {
        metro_area: true,
      },
      orderBy: {
        metro_area: { name: "asc" },
      },
    })

    const metroAreas = partnerMetroAreas.map(pma => pma.metro_area)
    return NextResponse.json(metroAreas)
  } catch (error) {
    console.error("Error fetching partner metro areas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/partners/[id]/metro-areas - Assign metro areas to a partner (super admin only)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: partnerId } = await params

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub!, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can assign metro areas to partners" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { metroAreaIds } = body

    if (!metroAreaIds || !Array.isArray(metroAreaIds)) {
      return NextResponse.json({ error: "Metro area IDs array is required" }, { status: 400 })
    }

    // Verify partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Verify all metro areas exist
    const metroAreas = await prisma.metroArea.findMany({
      where: { id: { in: metroAreaIds } },
    })

    if (metroAreas.length !== metroAreaIds.length) {
      return NextResponse.json({ error: "One or more metro areas not found" }, { status: 404 })
    }

    // Remove existing assignments and create new ones
    await prisma.partnerMetroArea.deleteMany({
      where: { partner_id: partnerId },
    })

    if (metroAreaIds.length > 0) {
      const assignments = metroAreaIds.map(metroAreaId => ({
        partner_id: partnerId,
        metro_area_id: metroAreaId,
      }))

      await prisma.partnerMetroArea.createMany({
        data: assignments,
      })
    }

    return NextResponse.json({ message: "Metro areas assigned successfully" })
  } catch (error) {
    console.error("Error assigning metro areas to partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
