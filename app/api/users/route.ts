import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { createPermissionChecker, batchListObjects } from "@/lib/permission-helpers"

// GET /api/users - Get all users (filtered by FGA permissions)
export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const partnerId = searchParams.get("partnerId") || ""
    const role = searchParams.get("role") || ""

    // Create permission checker for this request
    const permissionChecker = createPermissionChecker()

    // Check if user is a super admin (consolidated check)
    const isSuperAdmin = await permissionChecker.checkSuperAdmin(user.sub)

    let allowedPartnerIds: string[] = []

    // console.log("🔍 Checking permissions for user:", user.sub)

    if (isSuperAdmin) {
      // console.log("✅ User is super admin - can see all users")
      // Super admin can see all users
      allowedPartnerIds = []
    } else {
      // console.log("👥 User is partner user - checking partner access")
      // console.log("🔍 User ID being checked:", `user:${user.sub}`)

      // Batch multiple listObjects calls into a single operation
      const partnerPermissions = await batchListObjects(
        user.sub,
        ["can_admin", "can_manage_members", "can_view"],
        "partner"
      )

      // console.log("🏢 Partner access results:", partnerPermissions)

      // Combine all partner IDs the user has access to
      allowedPartnerIds = Array.from(
        new Set([
          ...partnerPermissions.can_admin,
          ...partnerPermissions.can_manage_members,
          ...partnerPermissions.can_view,
        ])
      )

      // console.log("🔗 Combined allowed partner IDs:", allowedPartnerIds)

      if (allowedPartnerIds.length === 0) {
        console.log(
          "⚠️ No partner access found via FGA - this might be a new partner with no users yet"
        )
        console.log("🔍 Checking if user exists in database with partner relationships...")

        // Check if user has any partner relationships in the database
        const userRecord = await prisma.user.findUnique({
          where: { auth0_user_id: user.sub },
          include: {
            partnerUsers: {
              where: { status: "active" },
              include: { partner: true },
            },
          },
        })

        if (userRecord && userRecord.partnerUsers.length > 0) {
          // User has partner relationships, use those partner IDs
          const dbPartnerIds = userRecord.partnerUsers.map(pu => pu.partner_id)
          allowedPartnerIds = dbPartnerIds
          // console.log("✅ Found partner IDs from database:", allowedPartnerIds)
        } else {
          // console.log("❌ No partner access found - returning 403")
          return NextResponse.json({ error: "No partner access found" }, { status: 403 })
        }
      }
    }

    // If no specific partnerId is requested, default to user's accessible partners
    let effectivePartnerId = partnerId
    if (!effectivePartnerId && !isSuperAdmin) {
      // console.log("🎯 No specific partner requested, defaulting to user's accessible partners")
      effectivePartnerId = allowedPartnerIds[0] // Use first accessible partner as default
      // console.log("📍 Defaulting to partner:", effectivePartnerId)
    }

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { display_name: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by partner if specified and user has access
    if (effectivePartnerId) {
      if (isSuperAdmin || allowedPartnerIds.includes(effectivePartnerId)) {
        where.partnerUsers = {
          some: {
            partner_id: effectivePartnerId,
          },
        }
      } else {
        return NextResponse.json({ error: "Access denied to specified partner" }, { status: 403 })
      }
    } else if (!isSuperAdmin) {
      // For non-super admins, only show users from their accessible partners
      where.partnerUsers = {
        some: {
          partner_id: { in: allowedPartnerIds },
        },
      }
    }

    if (role) {
      where.partnerUsers = {
        some: {
          role: role,
        },
      }
    }

    // console.log("🔍 Database query where clause:", JSON.stringify(where, null, 2))

    // Fetch users with pagination and filtering
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          partnerUsers: {
            include: {
              partner: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  logo_url: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    // console.log("📊 Database query results:")
    // console.log("  - Users found:", users.length)
    // console.log("  - Total count:", total)

    // Transform the data for the response
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.display_name || user.email.split("@")[0],
      auth0_user_id: user.auth0_user_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      partners: user.partnerUsers.map(pu => ({
        id: pu.partner.id,
        name: pu.partner.name,
        type: pu.partner.type,
        logo_url: pu.partner.logo_url,
        role: pu.role,
        status: pu.status,
        joined_at: pu.created_at,
      })),
    }))

    // console.log("✅ Returning response with", transformedUsers.length, "users")

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, display_name, partnerId, role } = body

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!partnerId || !partnerId.trim()) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 })
    }
    if (!role || !role.trim()) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    // Check if user has permission to create users in this partner
    const permissionChecker = createPermissionChecker()
    const isSuperAdmin = await permissionChecker.checkSuperAdmin(user.sub)
    if (!isSuperAdmin) {
      // Check if user can manage members in the specified partner
      const { checkPartnerPermission } = await import("@/lib/fga")
      const canManageMembers = await checkPartnerPermission(
        user.sub,
        "PARTNER_CAN_MANAGE_MEMBERS",
        partnerId
      )
      const canAdmin = await checkPartnerPermission(user.sub, "PARTNER_CAN_ADMIN", partnerId)

      if (!canManageMembers && !canAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions to create users in this partner" },
          { status: 403 }
        )
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Get partner details and verify it exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        organization_id: true,
      },
    })
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 400 })
    }
    if (!partner.organization_id) {
      return NextResponse.json(
        { error: "Partner does not have an Auth0 organization" },
        { status: 400 }
      )
    }

    // Create user in Auth0
    const { auth0ManagementAPI } = await import("@/lib/auth0-management")
    const auth0User = await auth0ManagementAPI.createUser({
      email: email.trim().toLowerCase(),
      name: display_name?.trim() || email.split("@")[0],
      connection: process.env.AUTH0_DB_CONNECTION!,
    })

    if (!auth0User.id) {
      throw new Error("Failed to create Auth0 user")
    }

    // Add user to Auth0 organization
    // console.log(
    //   "in users/route.ts: Adding user to organization:",
    //   partner.organization_id,
    //   auth0User.id
    // )
    await auth0ManagementAPI.addUserToOrganization(partner.organization_id, auth0User.id)

    // Create user in local database
    const dbUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        display_name: display_name?.trim() || null,
        auth0_user_id: auth0User.id,
      },
    })

    // Create partner user relationship
    const partnerUser = await prisma.partnerUser.create({
      data: {
        user_id: dbUser.id,
        partner_id: partnerId,
        role: role as any,
        status: "active",
        email: email.trim().toLowerCase(),
      },
    })

    // Create FGA tuple linking user to partner
    const { writeTuple } = await import("@/lib/fga")
    console.log("🔐 Creating FGA tuple:", {
      user: `user:${dbUser.auth0_user_id}`,
      relation: role,
      object: `partner:${partnerId}`,
      auth0UserId: dbUser.auth0_user_id,
      role: role,
      partnerId: partnerId,
    })

    const tupleCreated = await writeTuple(
      `user:${dbUser.auth0_user_id}`,
      role,
      `partner:${partnerId}`
    )
    if (!tupleCreated) {
      console.error("❌ Failed to create FGA tuple for user:", dbUser.auth0_user_id)
      // Continue with user creation even if FGA fails
    } else {
      console.log("✅ FGA tuple created successfully for user:", dbUser.auth0_user_id)
    }

    return NextResponse.json(
      {
        id: dbUser.id,
        email: dbUser.email,
        display_name: dbUser.display_name,
        auth0_user_id: dbUser.auth0_user_id,
        partner: {
          id: partner.id,
          name: partner.name,
          role: partnerUser.role,
          status: partnerUser.status,
        },
        message: "User created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)

    return NextResponse.json(
      {
        error: "Failed to create user. Please try again or contact support.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE /api/users - Delete a user by ID
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID to delete from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Create permission checker for this request
    const permissionChecker = createPermissionChecker()

    // Check if user is a super admin
    const isSuperAdmin = await permissionChecker.checkSuperAdmin(user.sub)

    if (!isSuperAdmin) {
      // Check if the requesting user has admin access to any partners that the target user belongs to
      const partnerPermissions = await batchListObjects(
        user.sub,
        ["can_admin", "can_manage_members"],
        "partner"
      )

      const userAdminPartners = Array.from(
        new Set([...partnerPermissions.can_admin, ...partnerPermissions.can_manage_members])
      )

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

    // Delete all partner user relationships first to avoid foreign key constraint violations
    if (existingUser.partnerUsers.length > 0) {
      // Delete FGA tuples for all partner relationships
      const { deleteTuple } = await import("@/lib/fga")

      for (const partnerUser of existingUser.partnerUsers) {
        try {
          await deleteTuple(
            `user:${existingUser.auth0_user_id}`,
            partnerUser.role,
            `partner:${partnerUser.partner_id}`
          )
        } catch (fgaError) {
          console.error(
            `Failed to delete FGA tuple for partner ${partnerUser.partner_id}:`,
            fgaError
          )
          // Continue with deletion even if FGA cleanup fails
        }
      }

      // Delete partner user relationships from database
      await prisma.partnerUser.deleteMany({
        where: {
          user_id: userId,
        },
      })
    }

    // Delete user from Auth0
    try {
      const { auth0ManagementAPI } = await import("@/lib/auth0-management")
      await auth0ManagementAPI.deleteUser(existingUser.auth0_user_id)
    } catch (auth0Error) {
      console.error("Failed to delete user from Auth0:", auth0Error)
      // Continue with database deletion even if Auth0 deletion fails
    }

    // Now delete the user from local database
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
