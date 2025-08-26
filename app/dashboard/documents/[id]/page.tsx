"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  FileText,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Copy,
  File,
  Archive,
} from "lucide-react"
import Link from "next/link"

interface Document {
  id: string
  name: string
  description: string
  created_at: string
  status: "active" | "inactive"
}

export default function DocumentDetailsPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (response.ok) {
        const documentData = await response.json()
        setDocument(documentData)
      } else {
        setError("Failed to fetch document information")
      }
    } catch (error) {
      console.error("Error fetching document:", error)
      setError("Failed to load document data")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!document) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Redirect to documents list
        router.push("/dashboard/documents")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete document")
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      setError("Failed to delete document. Please try again.")
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const copyDocumentId = async () => {
    if (document?.id) {
      try {
        await navigator.clipboard.writeText(document.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy document ID:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link
            href="/dashboard/documents"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">Document not found</div>
          <Link
            href="/dashboard/documents"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{document.name}</h1>
            <p className="text-gray-400">Document Details and Information</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/dashboard/documents/${documentId}/edit`}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Document
          </Link>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Document Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
          <div className="flex items-start space-x-6">
            {/* Document Icon */}
            <div className="w-24 h-24 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="h-12 w-12 text-white" />
            </div>

            {/* Document Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">{document.name}</h2>

              {/* Status */}
              <div className="flex items-center space-x-3 mb-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    document.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {document.status === "active" ? (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  ) : (
                    <AlertTriangle className="mr-1 h-4 w-4" />
                  )}
                  {document.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-4 leading-relaxed">{document.description}</p>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="mr-2 h-4 w-4" />
                Created on {new Date(document.created_at).toLocaleDateString()} at{" "}
                {new Date(document.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={copyDocumentId}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Copy Document ID"}
            </button>

            <Link
              href={`/dashboard/documents/${documentId}/edit`}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Document
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Document
            </button>
          </div>
        </div>
      </div>

      {/* Document Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Document ID */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Document ID</h3>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-700 text-orange-400 rounded text-sm font-mono break-all">
              {document.id}
            </code>
            <button
              onClick={copyDocumentId}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              title="Copy Document ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use this ID for document references and system integrations
          </p>
        </div>

        {/* Document Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Document Status</h3>
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-lg ${
                document.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {document.status === "active" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <p
                className={`font-medium capitalize ${
                  document.status === "active" ? "text-green-400" : "text-red-400"
                }`}
              >
                {document.status}
              </p>
              <p className="text-sm text-gray-400">
                {document.status === "active"
                  ? "Document is currently active and accessible"
                  : "Document is inactive and not accessible"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Document Content</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-white leading-relaxed">{document.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Document Type</h4>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-white">Manufacturing Document</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Created Date</h4>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-400" />
                <span className="text-white">
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Document Management</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <File className="h-4 w-4 text-blue-400" />
                <span>Automatically assigned to your organization</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <FileText className="h-4 w-4 text-green-400" />
                <span>Version control and change tracking</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Archive className="h-4 w-4 text-purple-400" />
                <span>Organized by partner and type</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Access Control</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Team members can view documents</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Edit className="h-4 w-4 text-orange-400" />
                <span>Admins can edit and manage</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Trash2 className="h-4 w-4 text-red-400" />
                <span>Admins can delete when needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Delete Document</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">{document.name}</span>? This action cannot
              be undone and will remove all access to this document.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
