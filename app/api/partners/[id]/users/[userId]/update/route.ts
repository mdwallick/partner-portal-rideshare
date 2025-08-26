import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPartnerPermission, writeTuple, deleteTuple } from "@/lib/fga"

// PUT /api/partners/[id]/users/[userId]/update - Update user role in partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: partnerId, userId } = await params
    const body = await request.json()
    const { role, display_name } = body

    // Check if user has permission to manage members in this partner
    const isSuperAdmin = await checkPartnerPermission(user.sub, "PLATFORM_SUPER_ADMIN", partnerId)
    if (!isSuperAdmin) {
      const canManageMembers = await checkPartnerPermission(
        user.sub,
        "PARTNER_CAN_MANAGE_MEMBERS",
        partnerId
      )
      const canAdmin = await checkPartnerPermission(user.sub, "PARTNER_CAN_ADMIN", partnerId)

      if (!canManageMembers && !canAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions to update users in this partner" },
          { status: 403 }
        )
      }
    }

    // Validate role
    if (role && !["can_admin", "can_manage_members", "can_view"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if the user to be updated exists in this partner
    const partnerUser = await prisma.partnerUser.findUnique({
      where: {
        partner_id_user_id: {
          partner_id: partnerId,
          user_id: userId,
        },
      },
    })

    if (!partnerUser) {
      return NextResponse.json({ error: "User is not a member of this partner" }, { status: 404 })
    }

    // Update the user's role in this partner
    if (role && role !== partnerUser.role) {
      // Update the PartnerUser record
      await prisma.partnerUser.update({
        where: {
          partner_id_user_id: {
            partner_id: partnerId,
            user_id: userId,
          },
        },
        data: { role },
      })

      // Update the FGA tuple
      try {
        // Delete the old tuple
        await deleteTuple(`user:${userId}`, partnerUser.role, `partner:${partnerId}`)
        // Create the new tuple
        await writeTuple(`user:${userId}`, role, `partner:${partnerId}`)
      } catch (fgaError) {
        console.error("Failed to update FGA tuple:", fgaError)
        // Continue even if FGA update fails
      }
    }

    // Update the user's display name if provided
    if (display_name) {
      await prisma.user.update({
        where: { id: userId },
        data: { display_name: display_name.trim() },
      })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
