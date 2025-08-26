import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"

export async function GET(request: NextRequest) {
  try {
    // console.log("🔍 Debug session endpoint called")

    const session = await auth0.getSession()
    // console.log("📋 Session data:", {
    //   hasSession: !!session,
    //   hasUser: !!session?.user,
    //   userId: session?.user?.sub,
    //   email: session?.user?.email,
    //   name: session?.user?.name,
    //   headers: Object.fromEntries(request.headers.entries()),
    // })

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No session or user found",
          hasSession: !!session,
          hasUser: !!session?.user,
          headers: Object.fromEntries(request.headers.entries()),
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      sessionKeys: Object.keys(session),
      userKeys: Object.keys(session.user),
    })
  } catch (error) {
    console.error("❌ Error in debug session:", error)
    return NextResponse.json(
      {
        error: "Session check failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
