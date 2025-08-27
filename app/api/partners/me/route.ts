import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user and their active partner assignments
    const userRecord = await prisma.user.findUnique({
      where: { auth0_user_id: user.sub },
      include: {
        partnerUsers: {
          where: { status: "active" },
          include: { partner: true },
        },
      },
    })

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activePartnerUsers = userRecord.partnerUsers.filter(pu => pu.status === "active")

    if (activePartnerUsers.length === 0) {
      return NextResponse.json(null)
    }

    // For now, return the first active partner (can expand to multiple later)
    const partnerUser = activePartnerUsers[0]

    const responseData = {
      role: partnerUser.role,
      partner: partnerUser.partner,
      isSuperAdmin: false,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching partner info:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
