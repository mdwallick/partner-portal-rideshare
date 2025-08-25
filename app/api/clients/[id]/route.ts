import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import { checkClientPermission, checkPartnerPermission } from "@/lib/fga"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const clientId = params.id

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the client
    const client = await prisma.clientId.findUnique({
      where: { id: clientId },
      include: { partner: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check if user has view permission on the client
    const canView = await checkClientPermission(user.sub, "CLIENT_CAN_VIEW", clientId)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      id: client.id,
      name: client.client_name,
      type: client.client_type,
      picture_url: client.picture_url,
      auth0_client_id: client.client_id, // The client_id field now contains the Auth0 client ID
      created_at: client.created_at,
      status: client.status,
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const clientId = params.id

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, picture_url } = body

    // Get the client
    const client = await prisma.clientId.findUnique({
      where: { id: clientId },
      include: { partner: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check if user has admin permission on the client
    const canAdmin = await checkClientPermission(user.sub, "CLIENT_CAN_ADMIN", clientId)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate client type if provided
    if (type && !["native_mobile_android", "native_mobile_ios", "web", "M2M"].includes(type)) {
      return NextResponse.json(
        {
          error: "Client type must be one of: native_mobile_android, native_mobile_ios, web, M2M",
        },
        { status: 400 }
      )
    }

    // Update Auth0 client if it exists
    if (client.client_id && client.client_id.startsWith("auth0|")) {
      try {
        const newName = name?.trim() || client.client_name
        const newType = type || client.client_type

        // Determine Auth0 app type based on client type
        let auth0AppType: "native" | "spa" | "regular_web" | "non_interactive"
        switch (newType) {
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

        await auth0ManagementAPI.updateClient(client.client_id, {
          name: `${client.partner.name} - ${newName}`,
          app_type: auth0AppType,
          metadata: {
            partner_id: client.partner.id,
            client_type: newType,
            internal_client_id: client.id,
          },
        })
        console.log(`🚀 Updated Auth0 client: ${client.client_id}`)
      } catch (auth0Error) {
        console.error("Failed to update Auth0 client:", auth0Error)
        // Continue with database update even if Auth0 update fails
      }
    }

    // Update the client in our database
    const updatedClient = await prisma.clientId.update({
      where: { id: clientId },
      data: {
        client_name: name?.trim() || client.client_name,
        client_type: type || client.client_type,
        picture_url: picture_url !== undefined ? picture_url : client.picture_url,
      },
      select: {
        id: true,
        client_name: true,
        client_type: true,
        picture_url: true,
        auth0_client_id: true,
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Updated client ${clientId}`)
    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const clientId = params.id

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the client
    const client = await prisma.clientId.findUnique({
      where: { id: clientId },
      include: { partner: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Check if user has admin permission on the client
    const canAdmin = await checkClientPermission(user.sub, "CLIENT_CAN_ADMIN", clientId)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete Auth0 client if it exists
    if (client.client_id && client.client_id.startsWith("auth0|")) {
      try {
        await auth0ManagementAPI.deleteClient(client.client_id)
        console.log(`🗑️ Deleted Auth0 client: ${client.client_id}`)
      } catch (auth0Error) {
        console.error("Failed to delete Auth0 client:", auth0Error)
        // Continue with database update even if Auth0 deletion fails
      }
    }

    // Soft delete the client (mark as inactive)
    await prisma.clientId.update({
      where: { id: clientId },
      data: { status: "inactive" },
    })

    console.log(`🗄️ Revoked client ${clientId}`)
    return NextResponse.json({ message: "Client revoked successfully" })
  } catch (error) {
    console.error("Error revoking client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
