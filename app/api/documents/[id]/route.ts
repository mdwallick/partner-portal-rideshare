import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkDocumentPermission } from "@/lib/fga"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: documentId } = await params

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { partner: true },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has view permission on the document
    const canView = await checkDocumentPermission(user.sub, "DOCUMENT_CAN_VIEW", documentId)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      id: document.id,
      name: document.name,
      description: document.description,
      created_at: document.created_at,
      status: document.status,
    })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: documentId } = await params

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { partner: true },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has admin permission on the document
    const canAdmin = await checkDocumentPermission(user.sub, "DOCUMENT_CAN_ADMIN", documentId)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        name: name?.trim() || document.name,
        description: description !== undefined ? description?.trim() : document.description,
      },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        status: true,
      },
    })

    console.log(`🗄️ Updated document ${documentId}`)
    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Error updating document:", error)
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
    const { id: documentId } = await params

    if (!user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { partner: true },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has admin permission on the document
    const canAdmin = await checkDocumentPermission(user.sub, "DOCUMENT_CAN_ADMIN", documentId)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Soft delete the document (mark as inactive)
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "inactive" },
    })

    console.log(`🗄️ Deleted document ${documentId}`)
    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
