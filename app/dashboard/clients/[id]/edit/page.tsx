"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Smartphone,
  Save,
  X,
  Globe,
  Monitor,
  Server,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Client {
  id: string
  name: string
  type: "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
  picture_url?: string
  created_at: string
}

interface ClientFormData {
  name: string
  type: "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
  picture_url?: string
}

export default function EditClientPage() {
  const { isLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    type: "web",
    picture_url: "",
  })
  const [_loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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
        setFormData({
          name: clientData.name,
          type: clientData.type,
          picture_url: clientData.picture_url || "",
        })
        if (clientData.picture_url) {
          setLogoPreview(clientData.picture_url)
        }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, picture_url: value }))

    // Clear preview if URL is empty
    if (!value.trim()) {
      setLogoPreview(null)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, picture_url: "" }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Client name is required")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Client name must be at least 2 characters long")
      return false
    }
    if (!formData.type) {
      setError("Client type is required")
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

      // Create JSON payload for URL submission
      const submitData = {
        name: formData.name.trim(),
        type: formData.type,
        picture_url: formData.picture_url || null,
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        setSuccess(true)

        // Redirect to client details after a short delay
        setTimeout(() => {
          router.push(`/dashboard/clients/${clientId}`)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update client")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      setError("Failed to update client. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case "native_mobile_android":
      case "native_mobile_ios":
        return <Smartphone className="h-4 w-4" />
      case "web":
        return <Monitor className="h-4 w-4" />
      case "M2M":
        return <Server className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
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

  if (success) {
    return (
      <div className="text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Client Updated Successfully!</h1>
          <p className="text-gray-400 mb-6">The client information has been updated and saved.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Name:</span> {formData.name}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">Type:</span> {formData.type}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">Redirecting to client details...</p>
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
            href={`/dashboard/clients/${clientId}`}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Client</h1>
            <p className="text-gray-400">Update client information and settings</p>
          </div>
        </div>
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Link>
      </div>

      {/* Current Client Info */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Current Client</h3>
        <div className="flex items-center space-x-4">
          {client.picture_url ? (
            <Image
              width={64}
              height={64}
              src={client.picture_url}
              alt={client.name}
              className="w-16 h-16 rounded-lg object-cover bg-gray-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center">
              <Globe className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div>
            <h4 className="text-lg font-semibold text-white">{client.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getClientTypeColor(client.type)}`}
              >
                {getClientTypeIcon(client.type)}
                <span className="ml-1 capitalize">{client.type.replace(/_/g, " ")}</span>
              </span>
              <span className="text-sm text-gray-400">
                Created {new Date(client.created_at).toLocaleDateString()}
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

          {/* Client Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter client application name"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be the display name for the client application
            </p>
          </div>

          {/* Client Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Client Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="web">Web Application</option>
              <option value="native_mobile_android">Android Mobile App</option>
              <option value="native_mobile_ios">iOS Mobile App</option>
              <option value="M2M">Machine-to-Machine (M2M)</option>
            </select>
            <div className="mt-2 flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <div className={`p-2 rounded-lg ${getClientTypeColor(formData.type)}`}>
                {getClientTypeIcon(formData.type)}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white capitalize">
                  {formData.type.replace(/_/g, " ")}
                </p>
                <p className="text-gray-400">
                  {formData.type === "web" && "Web-based application accessible via browser"}
                  {formData.type === "native_mobile_android" && "Native Android mobile application"}
                  {formData.type === "native_mobile_ios" && "Native iOS mobile application"}
                  {formData.type === "M2M" && "Machine-to-machine integration or API client"}
                </p>
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="picture_url" className="block text-sm font-medium text-gray-300 mb-2">
              Client Logo URL
            </label>
            <div className="space-y-4">
              {/* Logo Preview */}
              {logoPreview && (
                <div className="flex items-center space-x-4">
                  <Image
                    width={80}
                    height={80}
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 rounded-lg object-cover bg-gray-700"
                    onError={e => {
                      // Show error state for broken images
                      e.currentTarget.style.display = "none"
                      const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                      if (errorDiv) {
                        errorDiv.style.display = "block"
                      }
                    }}
                  />
                  <div
                    className="hidden w-20 h-20 rounded-lg bg-gray-700 border-2 border-red-500 flex items-center justify-center"
                    style={{ display: "none" }}
                  >
                    <span className="text-red-400 text-xs text-center">Invalid URL</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Remove Logo
                  </button>
                </div>
              )}

              {/* URL Input */}
              <div className="flex items-center space-x-3">
                <input
                  id="picture_url"
                  name="picture_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.picture_url || ""}
                  onChange={handleLogoChange}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {formData.picture_url && (
                  <button
                    type="button"
                    onClick={() => setLogoPreview(formData.picture_url || null)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Preview
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter the URL of the logo image. The image will be displayed as a preview above.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href={`/dashboard/clients/${clientId}`}
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
          <h3 className="text-lg font-semibold text-white mb-4">About Client Types</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Monitor className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-400">Web Applications</h4>
                <p className="text-sm text-gray-400">
                  Browser-based applications accessible from any device with internet access.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Smartphone className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400">Mobile Applications</h4>
                <p className="text-sm text-gray-400">
                  Native mobile apps for Android and iOS devices with platform-specific features.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Server className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-400">Machine-to-Machine (M2M)</h4>
                <p className="text-sm text-gray-400">
                  API clients and integrations for automated system-to-system communication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
