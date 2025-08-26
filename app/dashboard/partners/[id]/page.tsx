"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useSuperAdmin } from "@/app/contexts/SuperAdminContext"
import { useParams, useRouter } from "next/navigation"
import {
  Building2,
  Users,
  Globe,
  Cog,
  FileText,
  Edit,
  MapPin,
  Shield,
  ArrowLeft,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { Partner } from "@/lib/types"

export default function PartnerDetailPage() {
  const { user, isLoading } = useUser()
  const { isSuperAdmin } = useSuperAdmin()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && partnerId) {
      fetchPartnerDetails()
    }
  }, [user, partnerId])

  const fetchPartnerDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/partners/${partnerId}`)
      if (response.ok) {
        const data = await response.json()
        setPartner(data)
      } else {
        setError("Failed to fetch partner details")
      }
    } catch (error) {
      console.error("Error fetching partner details:", error)
      setError("Failed to fetch partner details")
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePartner = async () => {
    if (!confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard/partners")
      } else {
        setError("Failed to delete partner")
      }
    } catch (error) {
      console.error("Error deleting partner:", error)
      setError("Failed to delete partner")
    }
  }

  const getPartnerTypeLabel = (type: string) => {
    switch (type) {
      case "technology":
        return "Platform Partner"
      case "manufacturing":
        return "Manufacturing Partner"
      case "fleet_maintenance":
        return "Fleet Maintenance Partner"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case "technology":
        return "🌐"
      case "manufacturing":
        return "🏭"
      case "fleet_maintenance":
        return "🔧"
      default:
        return "🏢"
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please sign in to access the partner portal.</p>
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Partner Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || "The requested partner could not be found."}
          </p>
          <Link href="/dashboard/partners" className="btn-primary">
            Back to Partners
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={`${partner.name} logo`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{partner.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{getPartnerTypeIcon(partner.type)}</span>
                  <span className="text-lg text-gray-400">{getPartnerTypeLabel(partner.type)}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Created {new Date(partner.created_at).toLocaleDateString()}
                </p>
                {partner.organization_id && (
                  <p className="text-sm text-gray-400 mt-1">
                    Group ID:{" "}
                    <span className="font-mono text-gray-300">{partner.organization_id}</span>
                  </p>
                )}
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/dashboard/partners/${partnerId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Partner
                </Link>
                <button
                  onClick={handleDeletePartner}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Partner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-lg">{getPartnerTypeIcon(partner.type)}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Partner Type</p>
                <p className="text-lg font-semibold text-white">
                  {getPartnerTypeLabel(partner.type)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-900 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Status</p>
                <p className="text-lg font-semibold text-white capitalize">{partner.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Team Members</p>
                <p className="text-lg font-semibold text-white">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Details */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Partner Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Organization ID</h3>
              <p className="text-white font-mono">{partner.organization_id || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Created</h3>
              <p className="text-white">{new Date(partner.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Manufacturing Capabilities */}
        {partner.type === "manufacturing" && partner.manufacturingCapabilities && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Manufacturing Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg border-2 ${
                  partner.manufacturingCapabilities.hardware_sensors
                    ? "border-green-500 bg-green-900/20"
                    : "border-gray-600 bg-gray-700/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      partner.manufacturingCapabilities.hardware_sensors
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <Cog className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Hardware Sensors</h3>
                    <p className="text-sm text-gray-400">
                      {partner.manufacturingCapabilities.hardware_sensors
                        ? "Available"
                        : "Not Available"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  partner.manufacturingCapabilities.hardware_parts
                    ? "border-green-500 bg-green-900/20"
                    : "border-gray-600 bg-gray-700/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      partner.manufacturingCapabilities.hardware_parts
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Hardware Parts</h3>
                    <p className="text-sm text-gray-400">
                      {partner.manufacturingCapabilities.hardware_parts
                        ? "Available"
                        : "Not Available"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  partner.manufacturingCapabilities.software_firmware
                    ? "border-green-500 bg-green-900/20"
                    : "border-gray-600 bg-gray-700/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      partner.manufacturingCapabilities.software_firmware
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Software/Firmware</h3>
                    <p className="text-sm text-gray-400">
                      {partner.manufacturingCapabilities.software_firmware
                        ? "Available"
                        : "Not Available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href={`/dashboard/partners/${partnerId}/users`}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-white transition-colors"
            >
              <Users className="h-6 w-6 mb-2" />
              <h3 className="font-semibold">Manage Team</h3>
              <p className="text-sm text-blue-100">Invite and manage team members</p>
            </Link>

            {partner.type === "technology" && (
              <Link
                href={`/dashboard/partners/${partnerId}/clients`}
                className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-white transition-colors"
              >
                <Globe className="h-6 w-6 mb-2" />
                <h3 className="font-semibold">Manage Clients</h3>
                <p className="text-sm text-green-100">Create and manage client applications</p>
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                href={`/dashboard/partners/${partnerId}/edit`}
                className="bg-yellow-600 hover:bg-yellow-700 rounded-lg p-4 text-white transition-colors"
              >
                <Edit className="h-6 w-6 mb-2" />
                <h3 className="font-semibold">Edit Partner</h3>
                <p className="text-sm text-yellow-100">Update partner information and settings</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
