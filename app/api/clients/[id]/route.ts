import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import {
  checkClientPermission,
  checkPartnerPermission,
  checkPlatformPermission,
  deleteTuple,
} from "@/lib/fga"
import { createFgaClient, createFgaPartner } from "@/lib/fga-model"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: clientId } = await params

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

    // Check if user is super admin first
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN", "default")

    if (isSuperAdmin) {
      // Super admin can view any client
      console.log(`✅ Super admin ${user.sub} can view client ${clientId}`)
    } else {
      // Check if user can view the client or its parent partner
      console.log(`🔍 Checking permissions for user ${user.sub} on client ${clientId}`)
      console.log(`🔍 Client belongs to partner: ${client.partner.id} (${client.partner.name})`)

      // First check if user can view the partner (this should grant access to clients)
      const canViewPartner = await checkPartnerPermission(
        user.sub,
        "PARTNER_CAN_VIEW",
        client.partner.id
      )
      console.log(`🔍 Partner permission check result: ${canViewPartner}`)

      if (canViewPartner) {
        console.log(`✅ User ${user.sub} can view client ${clientId} via partner permission`)
      } else {
        // Fallback: check direct client permission
        const canViewClient = await checkClientPermission(user.sub, "CLIENT_CAN_VIEW", clientId)
        console.log(`🔍 Direct client permission check result: ${canViewClient}`)

        if (!canViewClient) {
          console.log(
            `❌ User ${user.sub} does not have PARTNER_CAN_VIEW or CLIENT_CAN_VIEW permission`
          )
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        console.log(`✅ User ${user.sub} can view client ${clientId} via direct client permission`)
      }
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: clientId } = await params

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

    // Check if user is super admin first
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN", "default")

    if (!isSuperAdmin) {
      // Check if user has admin permission on the client
      const canAdmin = await checkClientPermission(user.sub, "CLIENT_CAN_ADMIN", clientId)
      if (!canAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      console.log(`✅ Super admin ${user.sub} can admin client ${clientId}`)
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
    if (client.client_id) {
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
        client_id: true,
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Updated client ${clientId}`)

    // Map the response to match frontend expectations
    const mappedResponse = {
      id: updatedClient.id,
      name: updatedClient.client_name,
      type: updatedClient.client_type,
      picture_url: updatedClient.picture_url,
      auth0_client_id: updatedClient.client_id, // Map client_id to auth0_client_id
      created_at: updatedClient.created_at,
      status: updatedClient.status,
    }

    return NextResponse.json(mappedResponse)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: clientId } = await params

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

    // Check if user is super admin first
    const isSuperAdmin = await checkPlatformPermission(user.sub, "PLATFORM_SUPER_ADMIN", "default")

    if (!isSuperAdmin) {
      // Check if user has admin permission on the client
      const canAdmin = await checkClientPermission(user.sub, "CLIENT_CAN_ADMIN", clientId)
      if (!canAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      console.log(`✅ Super admin ${user.sub} can delete client ${clientId}`)
    }

    // Delete Auth0 client if it exists
    if (client.client_id) {
      try {
        await auth0ManagementAPI.deleteClient(client.client_id)
        console.log(`🗑️ Deleted Auth0 client: ${client.client_id}`)
      } catch (auth0Error) {
        console.error("Failed to delete Auth0 client:", auth0Error)
        // Continue with database update even if Auth0 deletion fails
      }
    }

    // delete the client
    await prisma.clientId.delete({
      where: { id: clientId },
    })

    // Clean up FGA tuples for the deleted client
    try {
      const clientObj = createFgaClient(clientId)
      //const userObj = createFgaUser(user.sub)
      const partnerObj = createFgaPartner(client.partner.id)

      // Remove user permissions on the client
      // await deleteTuple(userObj, "can_view", clientObj)
      // await deleteTuple(userObj, "can_admin", clientObj)

      // Remove client-parent relationship
      await deleteTuple(partnerObj, "parent", clientObj)

      console.log(`✅ Cleaned up FGA tuples for deleted client ${clientId}`)
    } catch (fgaError) {
      console.error("Failed to clean up FGA tuples:", fgaError)
      // Continue with client deletion even if FGA cleanup fails
    }

    console.log(`🗄️ Revoked client ${clientId}`)
    return NextResponse.json({ message: "Client revoked successfully" })
  } catch (error) {
    console.error("Error revoking client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
