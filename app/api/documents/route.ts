import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPartnerPermission, writeTuple } from "@/lib/fga"
import { createFgaDocument, createFgaPartner, FGA_RELATIONS } from "@/lib/fga-model"

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

    // Only manufacturing partners can manage documents
    if (partner.type !== "manufacturing") {
      return NextResponse.json(
        { error: "Only manufacturing partners can manage documents" },
        { status: 403 }
      )
    }

    // Check if user has view permission on the partner
    const canView = await checkPartnerPermission(user.sub, "PARTNER_CAN_VIEW", partner.id)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch documents for this partner
    const documents = await prisma.document.findMany({
      where: {
        partner_id: partner.id,
        status: "active",
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Fetched ${documents.length} documents for partner ${partner.name}`)
    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
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
    const { name, description } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Document name is required" }, { status: 400 })
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

    // Only manufacturing partners can create documents
    if (partner.type !== "manufacturing") {
      return NextResponse.json(
        { error: "Only manufacturing partners can create documents" },
        { status: 403 }
      )
    }

    // Check if user has admin permission on the partner
    const canAdmin = await checkPartnerPermission(user.sub, "PARTNER_CAN_ADMIN", partner.id)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate unique document ID
    const documentId = uuidv4()

    // Create the document
    const newDocument = await prisma.document.create({
      data: {
        id: documentId,
        partner_id: partner.id,
        name: name.trim(),
        description: description?.trim() || null,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Created document ${name} for partner ${partner.name}`)

    // Create FGA tuples for the new document
    try {
      const documentObj = createFgaDocument(documentId)
      const partnerObj = createFgaPartner(partner.id)

      // Document belongs to partner
      await writeTuple(documentObj, "parent", partnerObj)
      console.log(`✅ Created FGA tuple: ${documentObj} parent ${partnerObj}`)

      // User can view and admin the document (inherited from partner)
      // This is handled by the FGA model's computed usersets
    } catch (fgaError) {
      console.error("Failed to create FGA tuples:", fgaError)
      // Continue with document creation even if FGA tuple creation fails
    }

    return NextResponse.json(newDocument, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
