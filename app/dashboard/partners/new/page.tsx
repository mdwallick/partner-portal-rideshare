"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import { Building2, Save, X, Upload, Globe, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface PartnerFormData {
  name: string
  type: "technology" | "manufacturing"
  logo_url?: string
}

export default function NewPartnerPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState<PartnerFormData>({
    name: "",
    type: "technology",
    logo_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = e => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, logo_url: "" }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Partner name is required")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Partner name must be at least 2 characters long")
      return false
    }
    if (!formData.type) {
      setError("Partner type is required")
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

      // Create form data for file upload
      const submitData = new FormData()
      submitData.append("name", formData.name.trim())
      submitData.append("type", formData.type)
      if (logoFile) {
        submitData.append("logo", logoFile)
      }

      const response = await fetch("/api/partners", {
        method: "POST",
        body: submitData,
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(true)

        // Redirect to partner list after a short delay
        setTimeout(() => {
          router.push("/dashboard/partners")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create partner")
      }
    } catch (error) {
      console.error("Error creating partner:", error)
      setError("Failed to create partner. Please try again.")
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
          <h1 className="text-2xl font-bold mb-2">Partner Created Successfully!</h1>
          <p className="text-gray-400 mb-6">
            The new partner organization has been created and is ready for use.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Name:</span> {formData.name}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">Type:</span> {formData.type}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">Redirecting to partners list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Partner</h1>
          <p className="text-gray-400">Register a new partner organization</p>
        </div>
        <Link
          href="/dashboard/partners"
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

          {/* Partner Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Partner Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter partner organization name"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be the display name for the partner organization
            </p>
          </div>

          {/* Partner Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Partner Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="technology">Technology Partner</option>
              <option value="manufacturing">Manufacturing Partner</option>
            </select>
            <div className="mt-2 flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              {formData.type === "technology" ? (
                <>
                  <Globe className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-400 font-medium">Technology Partner</p>
                    <p className="text-gray-400">
                      Manages client applications (mobile apps, web apps, M2M integrations)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-400 font-medium">Manufacturing Partner</p>
                    <p className="text-gray-400">
                      Manages manufacturing documents and specifications
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-300 mb-2">
              Partner Logo
            </label>
            <div className="space-y-4">
              {/* Logo Preview */}
              {logoPreview && (
                <div className="flex items-center space-x-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 rounded-lg object-cover bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Remove Logo
                  </button>
                </div>
              )}

              {/* File Input */}
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="logo"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Optional: Upload a logo to represent the partner organization
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href="/dashboard/partners"
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
                  Create Partner
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-12 max-w-2xl">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">About Partner Types</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Globe className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400">Technology Partners</h4>
                <p className="text-sm text-gray-400">
                  Develop and manage client applications. They can register mobile apps, web
                  applications, and M2M integrations. Access to client management tools and API
                  credentials.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400">Manufacturing Partners</h4>
                <p className="text-sm text-gray-400">
                  Create and manage manufacturing documents, specifications, and technical
                  documentation. Access to document management tools and version control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
