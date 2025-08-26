"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Users, Eye } from "lucide-react"
import Image from "next/image"
import { Partner, User } from "@/lib/types"

export default function PartnerDetailPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    if (!isLoading && user && partnerId) {
      const checkSuperAdminStatus = async () => {
        try {
          const response = await fetch("/api/test-permissions")
          if (response.ok) {
            const data = await response.json()
            setIsSuperAdmin(data.isSuperAdmin)
          }
        } catch (error) {
          console.error("Error checking super admin status:", error)
        }
      }

      const fetchUsersData = async () => {
        try {
          const usersResponse = await fetch(`/api/users?partnerId=${partnerId}`)
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            // Transform the unified endpoint response to match frontend expectations
            const transformedUsers = (usersData.users || []).map(user => {
              // Find the partner-specific data for this partner
              const partnerData = user.partners.find(p => p.id === partnerId)
              return {
                id: user.id,
                email: user.email,
                display_name: user.name,
                role: partnerData?.role || "unknown",
                created_at: partnerData?.joined_at || user.created_at,
                auth0_user_id: user.auth0_user_id,
              }
            })
            setUsers(transformedUsers)
          }
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }

      const fetchPartnerData = async () => {
        try {
          setLoading(true)

          // Fetch partner details with Authorization header
          const partnerResponse = await fetch(`/api/partners/${partnerId}`)
          if (partnerResponse.ok) {
            const partnerData = await partnerResponse.json()
            setPartner(partnerData)

            // Always fetch team members
            await fetchUsersData()
          } else {
            setError("Partner not found")
          }
        } catch (error) {
          console.error("Error fetching partner data:", error)
          setError("Failed to load partner data")
        } finally {
          setLoading(false)
        }
      }

      // Check super admin status and fetch data
      checkSuperAdminStatus()
      fetchPartnerData()
    }
  }, [user, isLoading, partnerId])

  const handleDeletePartner = async () => {
    if (
      !confirm(`Are you sure you want to delete ${partner?.name}? This action cannot be undone.`)
    ) {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "can_admin":
      case "partner_admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">
            Can Admin
          </span>
        )
      case "can_manage_members":
      case "partner_manager":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
            Can Manage Members
          </span>
        )
      case "can_view":
      case "partner_viewer":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
            Can View
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
            {role}
          </span>
        )
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
                  <Image
                    src={partner.logo_url}
                    alt={`${partner.name} logo`}
                    width={80}
                    height={80}
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

            {(partner.userCanAdmin || isSuperAdmin) && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/dashboard/partners/${partnerId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Partner
                </Link>
                {isSuperAdmin && (
                  <button
                    onClick={handleDeletePartner}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Partner
                  </button>
                )}
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
                  <span className="text-blue-400 text-lg">
                    {partner.type === "technology"
                      ? "🌐"
                      : partner.type === "manufacturing"
                        ? "🏭"
                        : partner.type === "fleet_maintenance"
                          ? "🔧"
                          : "🏢"}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  {partner.type === "technology"
                    ? "Clients"
                    : partner.type === "manufacturing"
                      ? "Documents"
                      : partner.type === "fleet_maintenance"
                        ? "Maintenance Tasks"
                        : "Items"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {partner.type === "technology"
                    ? "0"
                    : partner.type === "manufacturing"
                      ? "0"
                      : partner.type === "fleet_maintenance"
                        ? "0"
                        : "0"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-lg">🗺️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Metro Areas</p>
                <p className="text-2xl font-bold text-white">
                  {partner.metroAreas ? partner.metroAreas.length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-400 text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metro Areas Section */}
        {(partner.type === "technology" || partner.type === "fleet_maintenance") && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">🗺️</span>
                Metro Areas
              </h2>
              {partner.userCanAdmin && (
                <Link
                  href={`/dashboard/partners/${partnerId}/edit`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Link>
              )}
            </div>

            {partner.metroAreas && partner.metroAreas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {partner.metroAreas.map((metro: any) => (
                  <div
                    key={metro.id}
                    className="border border-gray-600 rounded-lg p-3 bg-gray-700 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-400 text-sm font-medium">
                            {metro.airport_code}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{metro.name}</h3>
                        <p className="text-xs text-gray-400">Airport: {metro.airport_code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <span className="text-4xl">🗺️</span>
                </div>
                <p className="text-gray-400 mb-4">No metro areas assigned</p>
                {partner.userCanAdmin && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Assign Metro Areas
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manufacturing Capabilities Section */}
        {partner.type === "manufacturing" && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">🏭</span>
                Manufacturing Capabilities
              </h2>
              {partner.userCanAdmin && (
                <Link
                  href={`/dashboard/partners/${partnerId}/edit`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`border rounded-lg p-4 transition-colors ${
                  partner.manufacturingCapabilities?.hardware_sensors
                    ? "border-green-500 bg-green-900/20"
                    : "border-gray-600 bg-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      partner.manufacturingCapabilities?.hardware_sensors
                        ? "bg-green-900"
                        : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        partner.manufacturingCapabilities?.hardware_sensors
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      🔍
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Hardware Sensors</h3>
                    <p className="text-xs text-gray-400">
                      {partner.manufacturingCapabilities?.hardware_sensors
                        ? "Capability enabled"
                        : "Capability disabled"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 transition-colors ${
                  partner.manufacturingCapabilities?.hardware_parts
                    ? "border-green-500 bg-green-900/20"
                    : "border-gray-600 bg-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      partner.manufacturingCapabilities?.hardware_parts
                        ? "bg-green-900"
                        : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        partner.manufacturingCapabilities?.hardware_parts
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      ⚙️
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Hardware Parts</h3>
                    <p className="text-xs text-gray-400">
                      {partner.manufacturingCapabilities?.hardware_parts
                        ? "Capability enabled"
                        : "Capability disabled"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 transition-colors ${
                  partner.manufacturingCapabilities?.software_firmware
                    ? "border-green-500 bg-green-900/20"
                    : "border-gray-600 bg-gray-700"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      partner.manufacturingCapabilities?.software_firmware
                        ? "bg-green-900"
                        : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        partner.manufacturingCapabilities?.software_firmware
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      💾
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Software/Firmware</h3>
                    <p className="text-xs text-gray-400">
                      {partner.manufacturingCapabilities?.software_firmware
                        ? "Capability enabled"
                        : "text-gray-400"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(!partner.manufacturingCapabilities ||
              (!partner.manufacturingCapabilities.hardware_sensors &&
                !partner.manufacturingCapabilities.hardware_parts &&
                !partner.manufacturingCapabilities.software_firmware)) && (
              <div className="text-center py-6 mt-4">
                <div className="text-gray-400 mb-2">
                  <span className="text-4xl">🏭</span>
                </div>
                <p className="text-gray-400 mb-4">No manufacturing capabilities configured</p>
                {partner.userCanAdmin && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Configure Capabilities
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content based on partner type */}
        {partner.type === "technology" ? (
          <div className="space-y-8">
            {/* Clients Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Clients</h2>
                {partner.userCanAdmin && (
                  <Link
                    href="/dashboard/clients"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Clients
                  </Link>
                )}
              </div>

              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <span className="text-4xl">🌐</span>
                </div>
                <p className="text-gray-400 mb-4">
                  Client management is available in the Clients section
                </p>
                {partner.userCanAdmin && (
                  <Link
                    href="/dashboard/clients"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Go to Clients
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : partner.type === "manufacturing" ? (
          <div className="space-y-8">
            {/* Documents Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Documents</h2>
                {partner.userCanAdmin && (
                  <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Documents
                  </Link>
                )}
              </div>

              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <span className="text-4xl">📄</span>
                </div>
                <p className="text-gray-400 mb-4">
                  Document management is available in the Documents section
                </p>
                {partner.userCanAdmin && (
                  <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Go to Documents
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : partner.type === "fleet_maintenance" ? (
          <div className="space-y-8">
            {/* Fleet Maintenance Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Fleet Maintenance</h2>
                {partner.userCanAdmin && (
                  <Link
                    href="/dashboard/fleet-maintenance"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Fleet Maintenance
                  </Link>
                )}
              </div>

              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <span className="text-4xl">🔧</span>
                </div>
                <p className="text-gray-400 mb-4">
                  Fleet maintenance tools are available in the Fleet Maintenance section
                </p>
                {partner.userCanAdmin && (
                  <Link
                    href="/dashboard/fleet-maintenance"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Go to Fleet Maintenance
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Default Section for other partner types */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <span className="text-4xl">🏢</span>
                </div>
                <p className="text-gray-400 mb-4">Partner type: {partner.type}</p>
                <p className="text-gray-400">
                  No specific content available for this partner type.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team Members Section */}
        {partner.userCanView && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              {partner.userCanManageMembers && (
                <Link
                  href={`/dashboard/partners/${partnerId}/users`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Link>
              )}
              {!partner.userCanManageMembers && partner.userCanView && (
                <Link
                  href={`/dashboard/partners/${partnerId}/users`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Team
                </Link>
              )}
            </div>

            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.display_name || user.email}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">No team members yet.</p>
                {partner.userCanManageMembers && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/users`}
                    className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Invite First Member
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
