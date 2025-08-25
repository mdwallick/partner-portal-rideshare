import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import { checkPartnerPermission, writeTuple } from "@/lib/fga"
import { createFgaClient, createFgaPartner, FGA_RELATIONS } from "@/lib/fga-model"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's partner information
    const userRecord = await prisma.user.findUnique({
      where: { auth0_user_id: user.sub },
      include: {
        partnerUsers: {
          where: { status: "active" },
          include: { partner: true },
        },
      },
    })

    if (!userRecord || userRecord.partnerUsers.length === 0) {
      return NextResponse.json({ error: "No active partner found" }, { status: 404 })
    }

    const partner = userRecord.partnerUsers[0].partner

    // Only technology partners can manage clients
    if (partner.type !== "technology") {
      return NextResponse.json(
        { error: "Only technology partners can manage clients" },
        { status: 403 }
      )
    }

    // Check if user has view permission on the partner
    const canView = await checkPartnerPermission(user.sub, "PARTNER_CAN_VIEW", partner.id)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch clients for this partner
    const clients = await prisma.clientId.findMany({
      where: {
        partner_id: partner.id,
        status: "active",
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        client_name: true,
        client_type: true,
        picture_url: true,
        client_id: true, // This now contains the Auth0 client ID
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Fetched ${clients.length} clients for partner ${partner.name}`)
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, picture_url } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 })
    }

    if (!type || !["native_mobile_android", "native_mobile_ios", "web", "M2M"].includes(type)) {
      return NextResponse.json(
        {
          error: "Client type must be one of: native_mobile_android, native_mobile_ios, web, M2M",
        },
        { status: 400 }
      )
    }

    // Get user's partner information
    const userRecord = await prisma.user.findUnique({
      where: { auth0_user_id: user.sub },
      include: {
        partnerUsers: {
          where: { status: "active" },
          include: { partner: true },
        },
      },
    })

    if (!userRecord || userRecord.partnerUsers.length === 0) {
      return NextResponse.json({ error: "No active partner found" }, { status: 404 })
    }

    const partner = userRecord.partnerUsers[0].partner

    // Only technology partners can create clients
    if (partner.type !== "technology") {
      return NextResponse.json(
        { error: "Only technology partners can create clients" },
        { status: 403 }
      )
    }

    // Check if user has admin permission on the partner
    const canAdmin = await checkPartnerPermission(user.sub, "PARTNER_CAN_ADMIN", partner.id)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate unique client ID
    const clientId = uuidv4()

    // Determine Auth0 app type based on client type
    let auth0AppType: "native" | "spa" | "regular_web" | "non_interactive"
    switch (type) {
      case "native_mobile_android":
      case "native_mobile_ios":
        auth0AppType = "native"
        break
      case "web":
        auth0AppType = "spa"
        break
      case "M2M":
        auth0AppType = "non_interactive"
        break
      default:
        auth0AppType = "spa"
    }

    // Create Auth0 client first
    let auth0ClientId: string | null = null
    try {
      const auth0Client = await auth0ManagementAPI.createClient({
        name: `${partner.name} - ${name.trim()}`,
        app_type: auth0AppType,
        metadata: {
          partner_id: partner.id,
          client_type: type,
          internal_client_id: clientId,
        },
      })
      auth0ClientId = auth0Client.client_id
      console.log(`🚀 Created Auth0 client: ${auth0Client.client_id} for ${name}`)
    } catch (auth0Error) {
      console.error("Failed to create Auth0 client:", auth0Error)
      // Continue with database creation even if Auth0 client creation fails
    }

    // Create the client in our database
    const newClient = await prisma.clientId.create({
      data: {
        id: clientId,
        partner_id: partner.id,
        client_name: name.trim(),
        client_type: type,
        picture_url: picture_url || null,
        client_id: auth0ClientId || `client_${Date.now()}`, // Store Auth0 client ID, fallback to internal ID
        status: "active",
      },
      select: {
        id: true,
        client_name: true,
        client_type: true,
        picture_url: true,
        client_id: true, // This now contains the Auth0 client ID
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Created client ${name} for partner ${partner.name}`)

    // Create FGA tuples for the new client
    try {
      const clientObj = createFgaClient(clientId)
      const partnerObj = createFgaPartner(partner.id)

      // Client belongs to partner
      await writeTuple(clientObj, "parent", partnerObj)
      console.log(`✅ Created FGA tuple: ${clientObj} parent ${partnerObj}`)

      // User can view and admin the client (inherited from partner)
      // This is handled by the FGA model's computed usersets
    } catch (fgaError) {
      console.error("Failed to create FGA tuples:", fgaError)
      // Continue with client creation even if FGA tuple creation fails
    }

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
