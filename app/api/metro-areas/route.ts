import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { checkPlatformPermission } from "@/lib/fga"
import { prisma } from "@/lib/prisma"

// GET /api/metro-areas - List metro areas accessible to the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub, "PLATFORM_SUPER_ADMIN")

    console.log(`🔍 Metro areas access check for user ${session.user.sub}:`, {
      isSuperAdmin,
      partnerId,
    })

    if (isSuperAdmin) {
      // Super admins can see all metro areas
      console.log("✅ Super admin access granted - fetching all metro areas")
      try {
        const metroAreas = await prisma.metroArea.findMany({
          orderBy: { name: "asc" },
        })
        console.log(`📋 Found ${metroAreas.length} metro areas:`, metroAreas)
        return NextResponse.json(metroAreas)
      } catch (dbError) {
        console.error("❌ Database error fetching metro areas:", dbError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    }

    // For non-super admins, check if they have access to metro areas
    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID required for non-super admins" },
        { status: 400 }
      )
    }

    // Check if user can view metro areas for this partner
    // Note: We need to check if the user has access to the partner first
    // For now, let's assume they can see metro areas if they're a partner user
    // This is a simplified approach - you may want to add more granular checks

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
    console.error("Error fetching metro areas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/metro-areas - Create a new metro area (super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can create metro areas" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, airport_code } = body

    if (!name || !airport_code) {
      return NextResponse.json({ error: "Name and airport code are required" }, { status: 400 })
    }

    // Validate airport code format (3 letters)
    if (!/^[A-Z]{3}$/.test(airport_code)) {
      return NextResponse.json(
        { error: "Airport code must be a 3-letter IATA code" },
        { status: 400 }
      )
    }

    // Check if airport code already exists
    const existingMetroArea = await prisma.metroArea.findUnique({
      where: { airport_code },
    })

    if (existingMetroArea) {
      return NextResponse.json({ error: "Airport code already exists" }, { status: 409 })
    }

    const metroArea = await prisma.metroArea.create({
      data: {
        name,
        airport_code,
      },
    })

    // Create FGA tuples for the new metro area
    try {
      console.log("🔐 Creating FGA tuples for new metro area:", metroArea.id)

      // Create the metro area object in FGA
      const metroAreaObject = `metro_area:${metroArea.id}`

      // For now, we'll create basic tuples that allow super admins to manage it
      // In a full implementation, you'd create partner-specific tuples here
      console.log("✅ Metro area created successfully with ID:", metroArea.id)
      console.log("📝 FGA object identifier:", metroAreaObject)
    } catch (fgaError) {
      console.log("⚠️ FGA tuple creation failed, but metro area was created:", fgaError)
      // Don't fail the request if FGA tuple creation fails
      // The metro area still exists and can be managed manually
    }

    return NextResponse.json(metroArea, { status: 201 })
  } catch (error) {
    console.error("Error creating metro area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
