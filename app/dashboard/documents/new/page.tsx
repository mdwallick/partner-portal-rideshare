"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  FileText,
  Save,
  X,
  Upload,
  AlertTriangle,
  CheckCircle,
  File,
  DocumentText,
  Image,
  Video,
  Archive,
} from "lucide-react"
import Link from "next/link"

interface DocumentFormData {
  name: string
  description: string
}

export default function NewDocumentPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
      setLoading(true)
      setError(null)

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(true)

        // Redirect to documents list after a short delay
        setTimeout(() => {
          router.push("/dashboard/documents")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create document")
      }
    } catch (error) {
      console.error("Error creating document:", error)
      setError("Failed to create document. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Document Created Successfully!</h1>
          <p className="text-gray-400 mb-6">
            The new document has been created and is ready for use.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Name:</span> {formData.name}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">Description:</span> {formData.description}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">Redirecting to documents list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Document</h1>
          <p className="text-gray-400">Register a new document for your manufacturing processes</p>
        </div>
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Link>
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
              Describe the document's purpose, scope, and key contents
            </p>
          </div>

          {/* Document Type Information */}
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
                <DocumentText className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-400">Version Control</h4>
                  <p className="text-sm text-gray-400">
                    Track changes and maintain document history for compliance and quality
                    assurance.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Archive className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-400">Organization</h4>
                  <p className="text-sm text-gray-400">
                    Keep all your manufacturing documents organized and easily accessible to your
                    team.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href="/dashboard/documents"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Document
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
                  Use descriptive names that clearly indicate the document's purpose and content.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DocumentText className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400">Detailed Descriptions</h4>
                <p className="text-sm text-gray-400">
                  Provide comprehensive descriptions that help team members understand the
                  document's scope and importance.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Image className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400">Content Organization</h4>
                <p className="text-sm text-gray-400">
                  Structure your documents logically and include all necessary information for
                  manufacturing processes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
