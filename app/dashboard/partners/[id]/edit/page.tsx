"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Building2,
  Save,
  X,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Cog,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Partner {
  id: string
  name: string
  type: "technology" | "manufacturing" | "fleet_maintenance"
  logo_url?: string
  created_at: string
  manufacturingCapabilities?: {
    id: string
    partner_id: string
    hardware_sensors: boolean
    hardware_parts: boolean
    software_firmware: boolean
    created_at: string
    updated_at: string
  }
}

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

export default function EditPartnerPage() {
  const { isLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
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
  const [_loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [userPartner, setUserPartner] = useState<any>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [metroAreas, setMetroAreas] = useState<MetroArea[]>([])
  const [assignedMetroAreas, setAssignedMetroAreas] = useState<string[]>([])
  const [loadingMetroAreas, setLoadingMetroAreas] = useState(false)

  useEffect(() => {
    if (partnerId) {
      checkAccessAndFetchPartner()
    }
  }, [partnerId])

  const checkAccessAndFetchPartner = async () => {
    try {
      // First check if user is a super admin
      const superAdminResponse = await fetch("/api/test-permissions")
      if (superAdminResponse.ok) {
        const superAdminData = await superAdminResponse.json()
        if (superAdminData.isSuperAdmin) {
          setIsSuperAdmin(true)
          // Super admins can edit any partner
          await fetchPartner()
          // Fetch metro areas after super admin status is set
          await fetchMetroAreas()
          return
        }
      }

      // For non-super admins, check if they can edit this specific partner
      const partnerResponse = await fetch("/api/partners/me")
      if (partnerResponse.ok) {
        const partnerData = await partnerResponse.json()
        setUserPartner(partnerData)

        if (partnerData.partner && partnerData.partner.id === partnerId) {
          // User can edit this partner (it's their own)
          await fetchPartner()
        } else {
          // User cannot edit this partner
          setAccessDenied(true)
          setLoading(false)
        }
      } else {
        setAccessDenied(true)
        setLoading(false)
      }
    } catch (error) {
      console.error("Error checking access:", error)
      setAccessDenied(true)
      setLoading(false)
    }
  }

  const fetchPartner = async () => {
    try {
      const response = await fetch(`/api/partners/${partnerId}`)
      if (response.ok) {
        const partnerData = await response.json()
        setPartner(partnerData)
        setFormData({
          name: partnerData.name,
          type: partnerData.type,
          logo_url: partnerData.logo_url || "",
          manufacturingCapabilities: partnerData.manufacturingCapabilities || {
            hardware_sensors: false,
            hardware_parts: false,
            software_firmware: false,
          },
        })
        if (partnerData.logo_url) {
          setLogoPreview(partnerData.logo_url)
        }

        // Set assigned metro areas if they exist
        if (partnerData.metroAreas && Array.isArray(partnerData.metroAreas)) {
          const metroAreaIds = partnerData.metroAreas.map((metro: any) => metro.id)
          setAssignedMetroAreas(metroAreaIds)
          console.log("🗺️ Set assigned metro areas from partner data:", metroAreaIds)
        }
      } else {
        setError("Failed to fetch partner information")
      }
    } catch (error) {
      console.error("Error fetching partner:", error)
      setError("Failed to load partner data")
    } finally {
      setLoading(false)
    }
  }

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
    capability: "hardware_sensors" | "hardware_parts" | "software_firmware"
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
      setSaving(true)
      setError(null)

      // Create request body for JSON submission
      const requestBody: any = {
        name: formData.name.trim(),
        type: formData.type,
        logo_url: formData.logo_url || null,
      }

      // Add manufacturing capabilities if super admin and partner type supports it
      if (isSuperAdmin && formData.type === "manufacturing") {
        requestBody.manufacturingCapabilities = formData.manufacturingCapabilities
        console.log(
          "🛠️ Including manufacturing capabilities in submission:",
          requestBody.manufacturingCapabilities
        )
      }

      // Add metro areas if super admin and partner type supports it
      if (
        isSuperAdmin &&
        (formData.type === "technology" || formData.type === "fleet_maintenance")
      ) {
        requestBody.metroAreaIds = assignedMetroAreas.join(",")
        console.log("🗺️ Including metro areas in submission:", requestBody.metroAreaIds)
      }

      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setSuccess(true)

        // Redirect to partner details after a short delay
        setTimeout(() => {
          router.push(`/dashboard/partners/${partnerId}`)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update partner")
      }
    } catch (error) {
      console.error("Error updating partner:", error)
      setError("Failed to update partner. Please try again.")
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

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Building2 className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Access Restricted</h2>
            <p className="text-red-300 mb-4">
              You don&apos;t have permission to edit this partner record. You can only edit your own
              partner information.
            </p>
            <div className="space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              {userPartner?.partner && (
                <Link
                  href={`/dashboard/partners/${userPartner.partner.id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Edit My Partner
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !partner) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link
            href="/dashboard/partners"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Partners
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
          <h1 className="text-2xl font-bold mb-2">Partner Updated Successfully!</h1>
          <p className="text-gray-400 mb-6">The partner information has been updated and saved.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Name:</span> {formData.name}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">Type:</span> {formData.type}
            </p>
            {isSuperAdmin && formData.type === "manufacturing" && (
              <p className="text-sm text-gray-300">
                <span className="font-medium">Manufacturing Capabilities:</span>
                {formData.manufacturingCapabilities.hardware_sensors && " Hardware Sensors, "}
                {formData.manufacturingCapabilities.hardware_parts && " Hardware Parts, "}
                {formData.manufacturingCapabilities.software_firmware && " Software Firmware"}
              </p>
            )}
            {isSuperAdmin &&
              (formData.type === "technology" || formData.type === "fleet_maintenance") && (
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Metro Areas:</span> {assignedMetroAreas.length}{" "}
                  assigned
                </p>
              )}
          </div>
          <p className="text-sm text-gray-500 mt-6">Redirecting to partner details...</p>
        </div>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">Partner not found</div>
          <Link
            href="/dashboard/partners"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Partners
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
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Partner</h1>
            <p className="text-gray-400">Update partner information and settings</p>
          </div>
        </div>
        <Link
          href={`/dashboard/partners/${partnerId}`}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Link>
      </div>

      {/* Current Partner Info */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Current Partner</h3>
          {isSuperAdmin ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin Access
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Building2 className="h-3 w-3 mr-1" />
              Your Partner
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {partner.logo_url ? (
            <Image
              width={64}
              height={64}
              src={partner.logo_url}
              alt={partner.name}
              className="w-16 h-16 rounded-lg object-cover bg-gray-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div>
            <h4 className="text-lg font-semibold text-white">{partner.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  partner.type === "technology"
                    ? "bg-blue-100 text-blue-800"
                    : partner.type === "manufacturing"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                }`}
              >
                {partner.type === "technology" ? (
                  <Globe className="h-3 w-3 mr-1" />
                ) : partner.type === "manufacturing" ? (
                  <Shield className="h-3 w-3 mr-1" />
                ) : (
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-1"></div>
                )}
                {partner.type === "technology"
                  ? "Platform"
                  : partner.type === "manufacturing"
                    ? "Manufacturing"
                    : "Fleet Maintenance"}
              </span>
              <span className="text-sm text-gray-400">
                Created {new Date(partner.created_at).toLocaleDateString()}
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
              {!isSuperAdmin && (
                <span className="ml-2 text-xs text-gray-500">(Read-only for non-super admins)</span>
              )}
            </label>
            {isSuperAdmin ? (
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
            ) : (
              <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300">
                {formData.type === "technology"
                  ? "Platform Partner"
                  : formData.type === "manufacturing"
                    ? "Manufacturing Partner"
                    : "Fleet Maintenance Partner"}
              </div>
            )}
            {isSuperAdmin && (
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
                        Manages autonomous vehicle maintenance, software updates, and fleet
                        operations
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

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
                      width={64}
                      height={64}
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
              Enter the URL of the logo image. The image will be displayed as a preview above.
            </p>
          </div>

          {/* Manufacturing Capabilities (Super Admin Only) */}
          {isSuperAdmin && formData.type === "manufacturing" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Manufacturing Capabilities
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manufacturingCapabilities.hardware_sensors}
                    onChange={() => handleManufacturingCapabilityChange("hardware_sensors")}
                    className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Hardware Sensors</span>
                    <p className="text-xs text-gray-400">
                      Ability to monitor and collect data from physical sensors on vehicles.
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manufacturingCapabilities.hardware_parts}
                    onChange={() => handleManufacturingCapabilityChange("hardware_parts")}
                    className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Hardware Parts</span>
                    <p className="text-xs text-gray-400">
                      Access to inventory and management of physical vehicle components.
                    </p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.manufacturingCapabilities.software_firmware}
                    onChange={() => handleManufacturingCapabilityChange("software_firmware")}
                    className="rounded border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-800"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Software Firmware</span>
                    <p className="text-xs text-gray-400">
                      Access to manage and update software firmware on autonomous vehicles.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Metro Area Management (Super Admin Only) */}

          {isSuperAdmin &&
            (formData.type === "technology" || formData.type === "fleet_maintenance") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Metro Areas Access
                </label>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Select which metro areas this partner can access for rideshare operations.
                    Changes will be saved when you click &apos;Save Changes&apos; below.
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
                      Metro areas will be saved with partner changes
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href={`/dashboard/partners/${partnerId}`}
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
                  {isSuperAdmin && formData.type === "manufacturing"
                    ? "Saving Partner & Manufacturing Capabilities..."
                    : "Saving..."}
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
              <div className="h-5 w-5 text-purple-400 mt-0.5 flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              </div>
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
