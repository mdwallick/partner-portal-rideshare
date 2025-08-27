"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { FileText, Plus, Search, Edit, Trash2, Eye, Calendar, File, Clock } from "lucide-react"
import Link from "next/link"

interface Document {
  id: string
  name: string
  description?: string
  created_at: string
  status: "active" | "inactive"
}

export default function DocumentsPage() {
  const { user, isLoading } = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [_loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isManufacturingPartner, setIsManufacturingPartner] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    if (user) {
      checkPartnerType()
    }
  }, [user])

  const checkPartnerType = async () => {
    try {
      const response = await fetch("/api/partners/me")
      if (response.ok) {
        const data = await response.json()
        if (data.partner?.type === "manufacturing") {
          setIsManufacturingPartner(true)
          fetchDocuments()
        } else {
          // Redirect non-manufacturing partners
          window.location.href = "/dashboard"
        }
      } else {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Error checking partner type:", error)
      window.location.href = "/dashboard"
    } finally {
      setCheckingAccess(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        setError("Failed to fetch documents")
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from local state
        setDocuments(documents.filter(doc => doc.id !== documentId))
      } else {
        alert("Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document")
    }
  }

  const filteredDocuments = documents.filter(
    doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isLoading || checkingAccess) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!isManufacturingPartner) {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchDocuments}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Document Management</h1>
          <p className="text-gray-400">Manage your manufacturing documents and specifications</p>
        </div>
        <Link
          href="/dashboard/documents/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Documents</p>
              <p className="text-2xl font-bold text-white">{documents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <File className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Documents</p>
              <p className="text-2xl font-bold text-white">
                {documents.filter(d => d.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-white">
                {
                  documents.filter(d => {
                    const docDate = new Date(d.created_at)
                    const now = new Date()
                    return (
                      docDate.getMonth() === now.getMonth() &&
                      docDate.getFullYear() === now.getFullYear()
                    )
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Manufacturing Documents</h2>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {documents.length === 0 ? (
              <div>
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg mb-2">No documents created yet</p>
                <p className="mb-4">Get started by adding your first manufacturing document</p>
                <Link
                  href="/dashboard/documents/new"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Document
                </Link>
              </div>
            ) : (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No documents match your search criteria</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredDocuments.map(document => (
              <div key={document.id} className="p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{document.name}</h3>
                      {document.description && (
                        <p className="text-gray-400 mt-1 line-clamp-2">{document.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {new Date(document.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            document.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {document.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/documents/${document.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    <Link
                      href={`/dashboard/documents/${document.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Edit Document"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
