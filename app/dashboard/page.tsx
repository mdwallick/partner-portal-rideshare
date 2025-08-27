"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useSuperAdmin } from "@/app/contexts/SuperAdminContext"
import { usePartner } from "@/app/contexts/PartnerContext"
import {
  Building2,
  Users,
  Globe,
  Cog,
  MapPin,
  AlertTriangle,
  Shield,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Partner } from "@/lib/types"
import Image from "next/image"

export default function DashboardPage() {
  const { user, isLoading } = useUser()
  const { isSuperAdmin } = useSuperAdmin()
  const { partnerData } = usePartner()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Dashboard useEffect triggered:", {
      user: !!user,
      isSuperAdmin,
      isSuperAdminType: typeof isSuperAdmin,
      partnerData: !!partnerData,
    })
    if (user && isSuperAdmin !== null) {
      fetchDashboardData()
    }
  }, [user, isSuperAdmin, partnerData])

  const fetchDashboardData = async () => {
    try {
      console.log("fetchDashboardData called, isSuperAdmin:", isSuperAdmin)
      setLoading(true)
      setError(null)

      if (isSuperAdmin) {
        // Super admin dashboard - fetch system-wide data
        console.log("Fetching system dashboard data...")
        await fetchSystemDashboardData()
      } else {
        // Partner user dashboard - use context data instead of fetching
        console.log("Using partner data from context...")
        if (partnerData) {
          setDashboardData({
            type: "partner",
            partner: partnerData,
          })
        } else {
          setError("Partner data not available")
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemDashboardData = async () => {
    try {
      console.log("fetchSystemDashboardData: Starting...")
      // Fetch all partners for super admin
      const partnersResponse = await fetch("/api/partners")
      console.log("fetchSystemDashboardData: Partners response status:", partnersResponse.status)

      if (partnersResponse.ok) {
        const partners = await partnersResponse.json()
        console.log("fetchSystemDashboardData: Got partners:", partners.length)

        // Calculate system-wide stats
        const stats = {
          totalPartners: partners.length,
          technologyPartners: partners.filter((p: Partner) => p.type === "technology").length,
          manufacturingPartners: partners.filter((p: Partner) => p.type === "manufacturing").length,
          fleetMaintenancePartners: partners.filter((p: Partner) => p.type === "fleet_maintenance")
            .length,
          recentActivity: partners.filter((p: Partner) => {
            const partnerDate = new Date(p.created_at)
            const now = new Date()
            return (
              partnerDate.getMonth() === now.getMonth() &&
              partnerDate.getFullYear() === now.getFullYear()
            )
          }).length,
        }

        console.log("fetchSystemDashboardData: Calculated stats:", stats)
        setDashboardData({
          type: "system",
          partners: partners,
          stats: stats,
        })
        console.log("fetchSystemDashboardData: Set dashboard data")
      } else {
        console.error(
          "fetchSystemDashboardData: Partners response not ok:",
          partnersResponse.status
        )
        // Set basic super admin data even if partners fail
        setDashboardData({
          type: "system",
          partners: [],
          stats: {
            totalPartners: 0,
            technologyPartners: 0,
            manufacturingPartners: 0,
            fleetMaintenancePartners: 0,
            recentActivity: 0,
          },
        })
        console.log("fetchSystemDashboardData: Set fallback dashboard data")
      }
    } catch (error) {
      console.error("Error fetching system dashboard data:", error)
      // Set basic super admin data even if there's an error
      setDashboardData({
        type: "system",
        partners: [],
        stats: {
          totalPartners: 0,
          technologyPartners: 0,
          manufacturingPartners: 0,
          fleetMaintenancePartners: 0,
          recentActivity: 0,
        },
      })
      console.log("fetchSystemDashboardData: Set fallback dashboard data due to error")
    }
  }

  if (isLoading) {
    console.log("Showing loading spinner - isLoading:", isLoading)
    return (
      <div className="flex items-center justify-center h-64 bg-waymo-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-waymo-secondary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-waymo-neutral-900 p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading dashboard</span>
        </div>
        <p className="text-waymo-neutral-600">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-waymo-secondary text-white rounded-lg hover:bg-waymo-secondary-dark"
        >
          Retry
        </button>
      </div>
    )
  }

  // Super Admin Dashboard
  console.log(
    "Checking super admin dashboard - isSuperAdmin:",
    isSuperAdmin,
    "dashboardData:",
    dashboardData
  )
  if (isSuperAdmin && dashboardData?.type === "system") {
    const { stats } = dashboardData
    return (
      <div className="text-white p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">System Administration Dashboard</h1>
            <p className="text-gray-400">Welcome back, Super Administrator</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <Shield className="mr-1 h-3 w-3" />
                Super Admin
              </span>
              <span className="text-sm text-gray-500">Full system access and control</span>
            </div>
          </div>

          <div className="w-20 h-20 rounded-lg bg-waymo-secondary flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Partners</p>
                <p className="text-2xl font-bold text-white">{stats.totalPartners || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Platform</p>
                <p className="text-2xl font-bold text-white">{stats.technologyPartners || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Manufacturing</p>
                <p className="text-2xl font-bold text-white">{stats.manufacturingPartners || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Cog className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Fleet Maintenance</p>
                <p className="text-2xl font-bold text-white">
                  {stats.fleetMaintenancePartners || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-white">{stats.recentActivity || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard/partners/new"
              className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white transition-colors"
            >
              <Building2 className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold">Create Partner</h3>
              <p className="text-green-100">Add a new partner organization</p>
            </Link>

            <Link
              href="/dashboard/partners"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors"
            >
              <Users className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold">Manage Partners</h3>
              <p className="text-blue-100">View and edit partner organizations</p>
            </Link>

            <Link
              href="/dashboard/metro-areas"
              className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white transition-colors"
            >
              <MapPin className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold">Metro Areas</h3>
              <p className="text-purple-100">Manage geographic service areas</p>
            </Link>
          </div>
        </div>

        {/* Recent Partners */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Partners</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {dashboardData.partners?.slice(0, 5).map((partner: Partner) => (
                    <tr key={partner.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {partner.logo_url ? (
                              <Image
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-lg object-cover"
                                src={partner.logo_url}
                                alt={`${partner.name} logo`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {partner.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{partner.name}</div>
                            <div className="text-sm text-gray-400">{partner.organization_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          {partner.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(partner.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/partners/${partner.id}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Partner User Dashboard
  if (!isSuperAdmin && dashboardData?.type === "partner") {
    const { partner } = dashboardData
    return (
      <div className="text-white p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Partner Dashboard</h1>
            <p className="text-gray-400">Welcome back to {partner.name}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Building2 className="mr-1 h-3 w-3" />
                {partner.type}
              </span>
              <span className="text-sm text-gray-500">Partner organization</span>
            </div>
          </div>

          <div className="w-20 h-20 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Partner Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Status</p>
                <p className="text-2xl font-bold text-white">{partner.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Cog className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Role</p>
                <p className="text-2xl font-bold text-white">{dashboardData.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard/partners/me"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors"
            >
              <Building2 className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-semibold">View Partner</h3>
              <p className="text-blue-100">See partner details and statistics</p>
            </Link>

            {dashboardData.role === "can_admin" && (
              <Link
                href="/dashboard/users"
                className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white transition-colors"
              >
                <Users className="h-8 w-8 mb-2" />
                <h3 className="text-lg font-semibold">Manage Team</h3>
                <p className="text-green-100">Invite and manage team members</p>
              </Link>
            )}

            {partner.type === "technology" && (
              <Link
                href="/dashboard/clients"
                className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white transition-colors"
              >
                <Globe className="h-8 w-8 mb-2" />
                <h3 className="text-lg font-semibold">Manage Clients</h3>
                <p className="text-purple-100">Create and manage client applications</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Loading state while fetching data
  console.log("Showing final loading state - loading:", loading, "dashboardData:", dashboardData)
  return (
    <div className="flex items-center justify-center h-64 bg-waymo-primary">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-waymo-secondary"></div>
    </div>
  )
}
