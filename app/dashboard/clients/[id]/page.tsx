"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Smartphone,
  Edit,
  Trash2,
  ArrowLeft,
  Globe,
  Monitor,
  Server,
  Calendar,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Copy,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  type: "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
  picture_url?: string
  auth0_client_id?: string // This field now contains the Auth0 client ID from the client_id field
  created_at: string
  status: "active" | "inactive"
}

export default function ClientDetailsPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const clientData = await response.json()
        setClient(clientData)
      } else {
        setError("Failed to fetch client information")
      }
    } catch (error) {
      console.error("Error fetching client:", error)
      setError("Failed to load client data")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!client) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Redirect to clients list
        router.push("/dashboard/clients")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete client")
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      setError("Failed to delete client. Please try again.")
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const copyClientId = async () => {
    if (client?.id) {
      try {
        await navigator.clipboard.writeText(client.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy client ID:", error)
      }
    }
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case "native_mobile_android":
      case "native_mobile_ios":
        return <Smartphone className="h-5 w-5" />
      case "web":
        return <Monitor className="h-5 w-5" />
      case "M2M":
        return <Server className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
  }

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case "native_mobile_android":
        return "bg-green-100 text-green-800"
      case "native_mobile_ios":
        return "bg-blue-100 text-blue-800"
      case "web":
        return "bg-purple-100 text-purple-800"
      case "M2M":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getClientTypeDescription = (type: string) => {
    switch (type) {
      case "web":
        return "Web-based application accessible via browser"
      case "native_mobile_android":
        return "Native Android mobile application"
      case "native_mobile_ios":
        return "Native iOS mobile application"
      case "M2M":
        return "Machine-to-machine integration or API client"
      default:
        return "Unknown client type"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link
            href="/dashboard/clients"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">Client not found</div>
          <Link
            href="/dashboard/clients"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Clients
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
            href="/dashboard/clients"
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{client.name}</h1>
            <p className="text-gray-400">Client Application Details</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/dashboard/clients/${clientId}/edit`}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
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

      {/* Client Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
          <div className="flex items-start space-x-6">
            {/* Client Picture */}
            {client.picture_url ? (
              <img
                src={client.picture_url}
                alt={client.name}
                className="w-24 h-24 rounded-lg object-cover bg-gray-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-600 flex items-center justify-center">
                <Globe className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Client Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">{client.name}</h2>

              {/* Status and Type */}
              <div className="flex items-center space-x-3 mb-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    client.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.status === "active" ? (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  ) : (
                    <AlertTriangle className="mr-1 h-4 w-4" />
                  )}
                  {client.status === "active" ? "Active" : "Inactive"}
                </span>

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getClientTypeColor(client.type)}`}
                >
                  {getClientTypeIcon(client.type)}
                  <span className="ml-1 capitalize">{client.type.replace(/_/g, " ")}</span>
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-4">{getClientTypeDescription(client.type)}</p>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="mr-2 h-4 w-4" />
                Created on {new Date(client.created_at).toLocaleDateString()} at{" "}
                {new Date(client.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={copyClientId}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Copy Client ID"}
            </button>

            <Link
              href={`/dashboard/clients/${clientId}/edit`}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Client
            </button>
          </div>
        </div>
      </div>

      {/* Client Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Client ID */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Client ID</h3>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-700 text-orange-400 rounded text-sm font-mono break-all">
              {client.id}
            </code>
            <button
              onClick={copyClientId}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              title="Copy Client ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use this ID for API integrations and client identification
          </p>
        </div>

        {/* Auth0 Client ID */}
        {client.auth0_client_id && client.auth0_client_id.startsWith("auth0|") && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Auth0 Client ID</h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-gray-700 text-blue-400 rounded text-sm font-mono break-all">
                {client.auth0_client_id}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(client.auth0_client_id!)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                title="Copy Auth0 Client ID"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Auth0 client identifier for authentication and authorization
            </p>
          </div>
        )}

        {/* Client Type Details */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Client Type</h3>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${getClientTypeColor(client.type)}`}>
              {getClientTypeIcon(client.type)}
            </div>
            <div>
              <p className="font-medium text-white capitalize">{client.type.replace(/_/g, " ")}</p>
              <p className="text-sm text-gray-400">{getClientTypeDescription(client.type)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Status</h4>
            <p
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                client.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {client.status === "active" ? (
                <CheckCircle className="mr-1 h-4 w-4" />
              ) : (
                <AlertTriangle className="mr-1 h-4 w-4" />
              )}
              {client.status === "active" ? "Active" : "Inactive"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {client.status === "active"
                ? "This client is currently active and can be used for integrations"
                : "This client is inactive and cannot be used for integrations"}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Created</h4>
            <p className="text-white font-medium">
              {new Date(client.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-400">
              {new Date(client.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Delete Client</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">{client.name}</span>? This action cannot be
              undone and will revoke all access for this client.
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
                  "Delete Client"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
