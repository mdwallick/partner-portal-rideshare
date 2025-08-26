import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { checkPermission, checkPlatformPermission } from "@/lib/fga"
import { prisma } from "@/lib/prisma"

// GET /api/metro-areas/[id] - Get a specific metro area
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub!, "PLATFORM_SUPER_ADMIN")

    if (isSuperAdmin) {
      // Super admins can see any metro area - NO FGA CHECK NEEDED
      const metroArea = await prisma.metroArea.findUnique({
        where: { id },
      })

      if (!metroArea) {
        return NextResponse.json({ error: "Metro area not found" }, { status: 404 })
      }

      return NextResponse.json(metroArea)
    }

    // For non-super admins, check FGA permissions
    const canView = await checkPermission(session.user.sub!, "can_view", `metro_area:${id}`)

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const metroArea = await prisma.metroArea.findUnique({
      where: { id },
    })

    if (!metroArea) {
      return NextResponse.json({ error: "Metro area not found" }, { status: 404 })
    }

    return NextResponse.json(metroArea)
  } catch (error) {
    console.error("Error fetching metro area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/metro-areas/[id] - Update a metro area (super admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub!, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can update metro areas" },
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

    // Check if airport code already exists (excluding current metro area)
    const existingMetroArea = await prisma.metroArea.findFirst({
      where: {
        airport_code,
        id: { not: id },
      },
    })

    if (existingMetroArea) {
      return NextResponse.json({ error: "Airport code already exists" }, { status: 409 })
    }

    const metroArea = await prisma.metroArea.update({
      where: { id },
      data: {
        name,
        airport_code,
      },
    })

    return NextResponse.json(metroArea)
  } catch (error) {
    console.error("Error updating metro area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/metro-areas/[id] - Delete a metro area (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is super admin using proper FGA check
    const isSuperAdmin = await checkPlatformPermission(session.user.sub!, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can delete metro areas" },
        { status: 403 }
      )
    }

    // Delete associated partner-metro area relationships first
    await prisma.partnerMetroArea.deleteMany({
      where: { metro_area_id: id },
    })

    // Delete the metro area
    await prisma.metroArea.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Metro area deleted successfully" })
  } catch (error) {
    console.error("Error deleting metro area:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
