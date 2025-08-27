import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import { checkPartnerPermission, writeTuple } from "@/lib/fga"
import { createPermissionChecker } from "@/lib/permission-helpers"
import { createFgaClient, createFgaPartner } from "@/lib/fga-model"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create permission checker for this request
    const permissionChecker = createPermissionChecker()

    // Check if user is super admin first
    const isSuperAdmin = await permissionChecker.checkSuperAdmin(user.sub)

    if (isSuperAdmin) {
      // Super admin can see all clients
      const allClients = await prisma.clientId.findMany({
        where: { status: "active" },
        include: { partner: true },
        orderBy: { created_at: "desc" },
      })

      const mappedClients = allClients.map(client => ({
        id: client.id,
        name: client.client_name,
        type: client.client_type,
        picture_url: client.picture_url,
        client_id: client.client_id,
        created_at: client.created_at,
        status: client.status,
        partner_name: client.partner.name, // Include partner name for super admin context
      }))

      return NextResponse.json(mappedClients)
    }

    // Get user's partner information for non-super admins
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

    // Map database field names to frontend-expected names
    const mappedClients = clients.map(client => ({
      id: client.id,
      name: client.client_name, // Map client_name to name
      type: client.client_type, // Map client_type to type
      picture_url: client.picture_url,
      client_id: client.client_id, // Keep Auth0 client ID
      created_at: client.created_at,
      status: client.status,
    }))

    //console.log(`🗄️ Fetched ${clients.length} clients for partner ${partner.name}`)
    return NextResponse.json(mappedClients)
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

    // Create permission checker for this request
    const permissionChecker = createPermissionChecker()

    // Check if user is super admin first
    let isSuperAdmin = await permissionChecker.checkSuperAdmin(user.sub)

    let name: string
    let type: "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
    let picture_url: string | undefined
    let partner_id: string | undefined

    try {
      const body = await request.json()
      name = body.name
      type = body.type
      picture_url = body.picture_url
      partner_id = body.partner_id // Allow super admin to specify partner
    } catch (parseError) {
      console.error("Error parsing JSON body:", parseError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    if (!name?.trim()) {
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

    // Use the permission checker from earlier in the request
    isSuperAdmin = permissionChecker.getSuperAdminStatus()

    let partner: any

    if (isSuperAdmin) {
      // Super admin can create clients for any partner
      if (!partner_id) {
        return NextResponse.json(
          { error: "Partner ID is required for super admin" },
          { status: 400 }
        )
      }

      partner = await prisma.partner.findUnique({
        where: { id: partner_id },
      })

      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 })
      }

      // Only technology partners can have clients
      if (partner.type !== "technology") {
        return NextResponse.json(
          { error: "Only technology partners can have clients" },
          { status: 400 }
        )
      }
    } else {
      // Regular user - get their partner
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

      partner = userRecord.partnerUsers[0].partner

      // Only technology partners can manage clients
      if (partner.type !== "technology") {
        return NextResponse.json(
          { error: "Only technology partners can manage clients" },
          { status: 403 }
        )
      }

      // Check if user has admin permission on the partner
      const canAdmin = await checkPartnerPermission(user.sub, "PARTNER_CAN_ADMIN", partner.id)
      if (!canAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

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
    let auth0ClientSecret: string | undefined = undefined
    try {
      const auth0Client = await auth0ManagementAPI.createClient({
        name: `${partner.name} - ${name.trim()}`,
        app_type: auth0AppType,
        metadata: {
          partner_id: partner.id,
          client_type: type,
        },
      })
      auth0ClientId = auth0Client.client_id
      auth0ClientSecret = auth0Client.client_secret
      console.log(`🚀 Created Auth0 client: ${auth0Client.client_id} for ${name}`)
      console.log(`🔐 Client secret available: ${auth0ClientSecret ? "Yes" : "No"}`)
    } catch (auth0Error) {
      console.error("Failed to create Auth0 client:", auth0Error)
      // Cannot continue without Auth0 client ID since it's now our primary key
      return NextResponse.json(
        { error: "Failed to create Auth0 client. Please try again." },
        { status: 500 }
      )
    }

    // Create the client in our database
    const newClient = await prisma.clientId.create({
      data: {
        partner_id: partner.id,
        client_name: name.trim(),
        client_type: type,
        picture_url: picture_url || null,
        client_id: auth0ClientId, // Store Auth0 client ID in client_id field
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

    // Create comprehensive FGA tuples for the new client
    try {
      const clientObj = createFgaClient(newClient.id)
      const partnerObj = createFgaPartner(partner.id)
      // const userObj = createFgaUser(user.sub)

      // Client belongs to partner
      await writeTuple(partnerObj, "parent", clientObj)
      console.log(`✅ Created FGA tuple: ${partnerObj} parent ${clientObj}`)

      // User can view the client (inherited from partner)
      // await writeTuple(userObj, "can_view", clientObj)
      // console.log(`✅ Created FGA tuple: ${userObj} can_view ${clientObj}`)

      // User can admin the client (inherited from partner)
      // await writeTuple(userObj, "can_admin", clientObj)
      // console.log(`✅ Created FGA tuple: ${userObj} can_admin ${clientObj}`)

      // console.log(`✅ All FGA tuples created successfully for client ${newClient.id}`)
    } catch (fgaError) {
      console.error("Failed to create FGA tuples:", fgaError)
      // Continue with client creation even if FGA tuple creation fails
    }

    // Map the response to match frontend expectations
    const mappedResponse = {
      id: newClient.id,
      name: newClient.client_name,
      type: newClient.client_type,
      picture_url: newClient.picture_url,
      client_id: newClient.client_id,
      created_at: newClient.created_at,
      status: newClient.status,
      client_secret: auth0ClientSecret, // Include client secret if available (only shown once)
    }

    return NextResponse.json(mappedResponse, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
