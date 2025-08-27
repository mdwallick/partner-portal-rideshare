"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  FileText,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Calendar,
  File,
} from "lucide-react"
import Link from "next/link"

interface Document {
  id: string
  name: string
  description: string
  created_at: string
  status: "active" | "inactive"
}

interface DocumentFormData {
  name: string
  description: string
}

export default function EditDocumentPage() {
  const { isLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    description: "",
  })
  const [_loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
        setFormData({
          name: documentData.name,
          description: documentData.description,
        })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Document name is required")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Document name must be at least 2 characters long")
      return false
    }
    if (!formData.description.trim()) {
      setError("Document description is required")
      return false
    }
    if (formData.description.trim().length < 10) {
      setError("Document description must be at least 10 characters long")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      })

      if (response.ok) {
        setSuccess(true)

        // Redirect to document details after a short delay
        setTimeout(() => {
          router.push(`/dashboard/documents/${documentId}`)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update document")
      }
    } catch (error) {
      console.error("Error updating document:", error)
      setError("Failed to update document. Please try again.")
    } finally {
      setSaving(false)
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

  if (success) {
    return (
      <div className="text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Document Updated Successfully!</h1>
          <p className="text-gray-400 mb-6">The document information has been updated and saved.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Name:</span> {formData.name}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">Description:</span> {formData.description}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">Redirecting to document details...</p>
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
            href={`/dashboard/documents/${documentId}`}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Document</h1>
            <p className="text-gray-400">Update document information and description</p>
          </div>
        </div>
        <Link
          href={`/dashboard/documents/${documentId}`}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Link>
      </div>

      {/* Current Document Info */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Current Document</h3>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white">{document.name}</h4>
            <div className="flex items-center space-x-3 mt-1">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  document.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {document.status === "active" ? "Active" : "Inactive"}
              </span>
              <span className="text-sm text-gray-400">
                Created {new Date(document.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Document Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Document Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter document name (e.g., Safety Protocol, Quality Standards)"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Choose a clear, descriptive name for the document
            </p>
          </div>

          {/* Document Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Document Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
              placeholder="Provide a detailed description of what this document covers, its purpose, and key information..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Describe the document&apos;s purpose, scope, and key contents
            </p>
          </div>

          {/* Document Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Document Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-400">Document Management</h4>
                  <p className="text-sm text-gray-400">
                    Documents are automatically assigned to your manufacturing partner organization
                    and can be shared with team members.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-400">Version Control</h4>
                  <p className="text-sm text-gray-400">
                    Track changes and maintain document history for compliance and quality
                    assurance.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-400">Last Modified</h4>
                  <p className="text-sm text-gray-400">
                    This document was last updated on{" "}
                    {new Date(document.created_at).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href={`/dashboard/documents/${documentId}`}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-12 max-w-2xl">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Document Best Practices</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <File className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-400">Clear Naming</h4>
                <p className="text-sm text-gray-400">
                  Use descriptive names that clearly indicate the document&apos;s purpose and
                  content.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400">Detailed Descriptions</h4>
                <p className="text-sm text-gray-400">
                  Provide comprehensive descriptions that help team members understand the
                  document&apos;s scope and importance.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400">Regular Updates</h4>
                <p className="text-sm text-gray-400">
                  Keep documents current and relevant to maintain quality and compliance standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
