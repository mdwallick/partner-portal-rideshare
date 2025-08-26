import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPartnerPermission } from "@/lib/fga"

// POST /api/partners/[id]/users/[userId]/remove - Remove user from partner
export async function POST(
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
          { error: "Forbidden: Insufficient permissions to remove users from this partner" },
          { status: 403 }
        )
      }
    }

    // Check if the user to be removed exists in this partner
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

    // Remove the user from the partner (delete the PartnerUser record)
    await prisma.partnerUser.delete({
      where: {
        partner_id_user_id: {
          partner_id: partnerId,
          user_id: userId,
        },
      },
    })

    // Also remove the FGA tuple
    try {
      const { deleteTuple } = await import("@/lib/fga")
      await deleteTuple(`user:${partnerUser.user_id}`, partnerUser.role, `partner:${partnerId}`)
    } catch (fgaError) {
      console.error("Failed to delete FGA tuple:", fgaError)
      // Continue even if FGA deletion fails
    }

    return NextResponse.json({ message: "User removed from partner successfully" })
  } catch (error) {
    console.error("Error removing user from partner:", error)
    return NextResponse.json({ error: "Failed to remove user from partner" }, { status: 500 })
  }
}
