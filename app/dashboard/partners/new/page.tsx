"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import { Save, X, Globe, Shield, AlertTriangle, CheckCircle, Cog } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface PartnerFormData {
  name: string
  type: "technology" | "manufacturing" | "fleet_maintenance"
  logo_url?: string
  manufacturingCapabilities: {
    hardware_sensors: boolean
    hardware_parts: boolean
    software_firmware: boolean
  }
}

interface MetroArea {
  id: string
  name: string
  airport_code: string
}

export default function NewPartnerPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState<PartnerFormData>({
    name: "",
    type: "technology",
    logo_url: "",
    manufacturingCapabilities: {
      hardware_sensors: false,
      hardware_parts: false,
      software_firmware: false,
    },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [metroAreas, setMetroAreas] = useState<MetroArea[]>([])
  const [assignedMetroAreas, setAssignedMetroAreas] = useState<string[]>([])
  const [loadingMetroAreas, setLoadingMetroAreas] = useState(false)

  const checkSuperAdminStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/test-permissions")
      if (response.ok) {
        const data = await response.json()
        if (data.isSuperAdmin) {
          setIsSuperAdmin(true)
          await fetchMetroAreas()
        }
      }
    } catch (error) {
      console.error("Error checking super admin status:", error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      checkSuperAdminStatus()
    }
  }, [user, checkSuperAdminStatus])

  const fetchMetroAreas = async () => {
    try {
      console.log("🔍 Fetching metro areas...")
      setLoadingMetroAreas(true)
      const response = await fetch("/api/metro-areas")
      console.log("📡 Metro areas response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📋 Metro areas data received:", data)
        setMetroAreas(data)
      } else {
        console.log("❌ Metro areas fetch failed with status:", response.status)
        const errorText = await response.text()
        console.log("❌ Error response:", errorText)
      }
    } catch (error) {
      console.error("❌ Error fetching metro areas:", error)
    } finally {
      setLoadingMetroAreas(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Clear metro areas if partner type changes to manufacturing
    if (name === "type" && value === "manufacturing") {
      setAssignedMetroAreas([])
      console.log("🏭 Partner type changed to manufacturing, cleared metro area assignments")
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, logo_url: url }))
    setLogoPreview(url)
  }

  const removeLogo = () => {
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, logo_url: "" }))
  }

  const handleManufacturingCapabilityChange = (
    capability: keyof PartnerFormData["manufacturingCapabilities"]
  ) => {
    setFormData(prev => ({
      ...prev,
      manufacturingCapabilities: {
        ...prev.manufacturingCapabilities,
        [capability]: !prev.manufacturingCapabilities[capability],
      },
    }))
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

    // Validate logo URL if provided
    if (formData.logo_url && formData.logo_url.trim()) {
      try {
        new URL(formData.logo_url.trim())
      } catch {
        setError("Please enter a valid logo URL")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      // Create request body for JSON submission
      const requestBody: any = {
        name: formData.name.trim(),
        type: formData.type,
        logo_url: formData.logo_url || null,
        manufacturingCapabilities: formData.manufacturingCapabilities,
      }

      // Add metro areas if super admin and partner type supports it
      if (
        isSuperAdmin &&
        (formData.type === "technology" || formData.type === "fleet_maintenance")
      ) {
        requestBody.metroAreaIds = assignedMetroAreas.join(",")
        console.log("🗺️ Including metro areas in submission:", requestBody.metroAreaIds)
      }

      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        // const result = await response.json()
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
              <option value="technology">Platform Partner</option>
              <option value="manufacturing">Manufacturing Partner</option>
              <option value="fleet_maintenance">Fleet Maintenance Partner</option>
            </select>
            <div className="mt-2 flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              {formData.type === "technology" ? (
                <>
                  <Globe className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-400 font-medium">Platform Partner</p>
                    <p className="text-gray-400">
                      Manages client applications (mobile apps, web apps, M2M integrations)
                    </p>
                  </div>
                </>
              ) : formData.type === "manufacturing" ? (
                <>
                  <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-400 font-medium">Manufacturing Partner</p>
                    <p className="text-gray-400">
                      Manages manufacturing documents and specifications
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Cog className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-purple-400 font-medium">Fleet Maintenance Partner</p>
                    <p className="text-gray-400">
                      Performs mechanical maintenance and software updates on autonomous vehicles
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Manufacturing Capabilities */}
          {formData.type === "manufacturing" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Manufacturing Capabilities
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manufacturingCapabilities.hardware_sensors}
                    onChange={() => handleManufacturingCapabilityChange("hardware_sensors")}
                    className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Hardware Sensors</span>
                    <p className="text-xs text-gray-400">
                      Sensors for monitoring vehicle health, location, and environmental conditions.
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manufacturingCapabilities.hardware_parts}
                    onChange={() => handleManufacturingCapabilityChange("hardware_parts")}
                    className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Hardware Parts</span>
                    <p className="text-xs text-gray-400">
                      Access to manufacturing parts and components for repairs and replacements.
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manufacturingCapabilities.software_firmware}
                    onChange={() => handleManufacturingCapabilityChange("software_firmware")}
                    className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Software/Firmware</span>
                    <p className="text-xs text-gray-400">
                      Access to software updates and firmware for autonomous vehicles.
                    </p>
                  </div>
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Select the manufacturing capabilities this partner will provide. These can be
                updated later.
              </p>
            </div>
          )}

          {/* Logo URL */}
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium text-gray-300 mb-2">
              Partner Logo URL
            </label>
            <div className="space-y-4">
              {/* Logo Preview */}
              {logoPreview && (
                <div className="flex items-center space-x-4">
                  <div className="relative">
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
                  id="logo_url"
                  name="logo_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url || ""}
                  onChange={handleLogoChange}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => setLogoPreview(formData.logo_url || null)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Preview
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Optional: Enter the URL of a logo image to represent the partner organization
            </p>
          </div>

          {/* Metro Areas Assignment */}
          {isSuperAdmin &&
            (formData.type === "technology" || formData.type === "fleet_maintenance") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Metro Areas Access
                </label>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Select which metro areas this partner can access for rideshare operations.
                    Changes will be saved when you create the partner.
                  </p>

                  {loadingMetroAreas ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                      <span className="text-gray-400">Loading metro areas...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      {metroAreas.map(metro => (
                        <label
                          key={metro.id}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={assignedMetroAreas.includes(metro.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setAssignedMetroAreas(prev => [...prev, metro.id])
                              } else {
                                setAssignedMetroAreas(prev => prev.filter(id => id !== metro.id))
                              }
                            }}
                            className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800"
                          />
                          <div>
                            <span className="text-sm font-medium text-white">{metro.name}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({metro.airport_code})
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {assignedMetroAreas.length} metro area(s) selected
                    </p>
                    <p className="text-xs text-blue-400">
                      Metro areas will be saved with partner creation
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  {isSuperAdmin &&
                  (formData.type === "technology" || formData.type === "fleet_maintenance")
                    ? "Creating Partner & Metro Areas..."
                    : "Creating..."}
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
                <h4 className="font-medium text-blue-400">Platform Partners</h4>
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
            <div className="flex items-start space-x-3">
              <Cog className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-400">Fleet Maintenance Partners</h4>
                <p className="text-sm text-gray-400">
                  Perform mechanical maintenance and software updates on autonomous vehicles. Access
                  to maintenance task management, software update tools, and vehicle health
                  monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
