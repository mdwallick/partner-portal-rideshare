import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPlatformPermission, listObjects } from "@/lib/fga"

// GET /api/users/[id] - Get a single user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Check if user is a super admin
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      // Check if the requesting user has access to any partners that the target user belongs to
      const userPartners = await listObjects(user.sub, "can_admin", "partner")
      const userManagePartners = await listObjects(user.sub, "can_manage_members", "partner")
      const userViewPartners = await listObjects(user.sub, "can_view", "partner")

      const allowedPartnerIds = Array.from(
        new Set([...userPartners, ...userManagePartners, ...userViewPartners])
      )

      if (allowedPartnerIds.length === 0) {
        return NextResponse.json({ error: "No partner access found" }, { status: 403 })
      }

      // Check if the target user belongs to any of the requesting user's accessible partners
      const targetUserPartners = await prisma.partnerUser.findMany({
        where: {
          user_id: userId,
          partner_id: { in: allowedPartnerIds },
        },
        select: { partner_id: true },
      })

      if (targetUserPartners.length === 0) {
        return NextResponse.json({ error: "User not found or access denied" }, { status: 404 })
      }
    }

    // Fetch the specific user with all their details
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerUsers: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                type: true,
                logo_url: true,
                created_at: true,
              },
            },
          },
        },
      },
    })

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Transform the data for the response
    const transformedUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.display_name || userRecord.email.split("@")[0],
      auth0_user_id: userRecord.auth0_user_id,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at,
      partners: userRecord.partnerUsers.map(pu => ({
        id: pu.partner.id,
        name: pu.partner.name,
        type: pu.partner.type,
        logo_url: pu.partner.logo_url,
        role: pu.role,
        status: pu.status,
        joined_at: pu.created_at,
        updated_at: pu.updated_at,
      })),
      // Add summary statistics
      total_partners: userRecord.partnerUsers.length,
      active_partners: userRecord.partnerUsers.filter(pu => pu.status === "active").length,
      admin_roles: userRecord.partnerUsers.filter(pu => pu.role === "can_admin").length,
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a user by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const body = await request.json()
    const { email, display_name } = body

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user is a super admin
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      // Check if the requesting user has admin access to any partners that the target user belongs to
      const userAdminPartners = await listObjects(user.sub, "can_admin", "partner")

      if (userAdminPartners.length === 0) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
      }

      // Check if the target user belongs to any of the requesting user's admin partners
      const targetUserPartners = await prisma.partnerUser.findMany({
        where: {
          user_id: userId,
          partner_id: { in: userAdminPartners },
        },
        select: { partner_id: true },
      })

      if (targetUserPartners.length === 0) {
        return NextResponse.json({ error: "User not found or access denied" }, { status: 404 })
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })
      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: email.trim().toLowerCase(),
        display_name: display_name?.trim() || null,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      display_name: updatedUser.display_name,
      updated_at: updatedUser.updated_at,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Check if user is a super admin
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN")

    if (!isSuperAdmin) {
      // Check if the requesting user has admin access to any partners that the target user belongs to
      const userAdminPartners = await listObjects(user.sub, "can_admin", "partner")

      if (userAdminPartners.length === 0) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
      }

      // Check if the target user belongs to any of the requesting user's admin partners
      const targetUserPartners = await prisma.partnerUser.findMany({
        where: {
          user_id: userId,
          partner_id: { in: userAdminPartners },
        },
        select: { partner_id: true },
      })

      if (targetUserPartners.length === 0) {
        return NextResponse.json({ error: "User not found or access denied" }, { status: 404 })
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerUsers: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has active partner relationships
    const activePartners = existingUser.partnerUsers.filter(pu => pu.status === "active")
    if (activePartners.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete user with active partner relationships",
          details: `User is active in ${activePartners.length} partner(s)`,
          active_partners: activePartners.map(pu => ({
            partner_id: pu.partner_id,
            role: pu.role,
            status: pu.status,
          })),
        },
        { status: 400 }
      )
    }

    // Delete all partner user relationships first to avoid foreign key constraint violations
    if (existingUser.partnerUsers.length > 0) {
      await prisma.partnerUser.deleteMany({
        where: {
          user_id: userId,
        },
      })
    }

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      message: "User deleted successfully",
      deleted_user: {
        id: existingUser.id,
        email: existingUser.email,
        display_name: existingUser.display_name,
      },
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
