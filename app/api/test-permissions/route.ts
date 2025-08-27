import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { checkPermission } from "@/lib/fga"

export async function GET() {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // console.log("🔍 Checking permissions for user:", session.user.sub)
    // console.log("📧 User email:", session.user.email)

    // Use proper FGA check for super admin
    const isSuperAdmin = await checkPermission(
      `user:${session.user.sub}`,
      "super_admin",
      "platform:default"
    )

    // console.log("🛡️ Super admin check result:", isSuperAdmin)

    const response = {
      isSuperAdmin,
      userId: session.user.sub,
      email: session.user.email,
    }

    // console.log("📤 Sending response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error checking permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
