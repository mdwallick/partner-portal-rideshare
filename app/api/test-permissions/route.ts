import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { checkPlatformPermission } from "@/lib/fga"

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔍 Checking permissions for user:", session.user.sub)
    console.log("📧 User email:", session.user.email)

    // Check if user has super admin permissions
    const isSuperAdmin = await checkPlatformPermission(session.user.sub, "PLATFORM_SUPER_ADMIN")
    console.log("🛡️ Super admin check result:", isSuperAdmin)

    const response = {
      isSuperAdmin,
      userId: session.user.sub,
      email: session.user.email,
    }

    console.log("📤 Sending response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error checking permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
