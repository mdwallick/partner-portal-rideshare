import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPlatformPermission } from "@/lib/fga"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has super admin permissions
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN")

    if (isSuperAdmin) {
      return NextResponse.json({
        role: "super_admin",
        isSuperAdmin: true,
        user: {
          id: user.sub,
          email: user.email,
        },
      })
    }

    console.log("🔍 Looking up user with Auth0 ID:", user.sub)

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

    console.log("📋 User record found:", userRecord ? "Yes" : "No")
    if (userRecord) {
      console.log("👥 Partner users count:", userRecord.partnerUsers.length)
      console.log(
        "👥 Active partner users:",
        userRecord.partnerUsers.filter(pu => pu.status === "active").length
      )
    }

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activePartnerUsers = userRecord.partnerUsers.filter(pu => pu.status === "active")

    if (activePartnerUsers.length === 0) {
      console.log("⚠️ No active partner users found")
      return NextResponse.json(null)
    }

    // For now, return the first active partner (can expand to multiple later)
    const partnerUser = activePartnerUsers[0]
    console.log("✅ Returning partner user:", {
      role: partnerUser.role,
      partnerId: partnerUser.partner.id,
      partnerName: partnerUser.partner.name,
    })

    return NextResponse.json({
      role: partnerUser.role,
      partner: partnerUser.partner,
      isSuperAdmin: false,
    })
  } catch (error) {
    console.error("Error fetching partner info:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
