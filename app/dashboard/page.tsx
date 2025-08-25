"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Users,
  FileText,
  Building2,
  Plus,
  Eye,
  Settings,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Shield,
  Globe,
} from "lucide-react"
import Link from "next/link"

interface Partner {
  id: string
  name: string
  type: "technology" | "manufacturing"
  logo_url?: string
  created_at: string
}

interface DashboardStats {
  totalClients?: number
  totalDocuments?: number
  totalUsers?: number
  recentActivity?: number
  totalPartners?: number
  technologyPartners?: number
  manufacturingPartners?: number
}

export default function DashboardPage() {
  const { user, isLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [allPartners, setAllPartners] = useState<Partner[]>([])
  const [stats, setStats] = useState<DashboardStats>({})
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors

      // First check if user is a super admin
      console.log("🔍 Checking super admin status...")
      const superAdminResponse = await fetch("/api/test-permissions")
      console.log("📡 Super admin response status:", superAdminResponse.status)

      if (superAdminResponse.ok) {
        const superAdminData = await superAdminResponse.json()
        console.log("📋 Super admin data:", superAdminData)

        if (superAdminData.isSuperAdmin) {
          console.log("✅ User is super admin, setting up super admin dashboard")
          setIsSuperAdmin(true)
          await fetchSuperAdminData()
          return
        } else {
          console.log("❌ User is NOT super admin")
        }
      } else {
        console.log("❌ Super admin check failed:", superAdminResponse.status)
      }

      // For non-super admins, fetch partner information
      const partnerResponse = await fetch("/api/partners/me")

      if (partnerResponse.ok) {
        const partnerData = await partnerResponse.json()
        if (partnerData) {
          setPartner(partnerData)
          // Fetch stats based on partner type
          await fetchPartnerStats(partnerData)
        } else {
          // No partner assigned
          setPartner(null)
        }
      } else if (partnerResponse.status === 404) {
        // No partner assigned to this user
        setPartner(null)
      } else {
        setError("Failed to fetch partner information")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchSuperAdminData = async () => {
    try {
      // Fetch all partners for super admin overview
      const partnersResponse = await fetch("/api/partners")
      if (partnersResponse.ok) {
        const partnersData = await partnersResponse.json()
        setAllPartners(partnersData)

        // Calculate system-wide stats
        const systemStats: DashboardStats = {
          totalPartners: partnersData.length,
          technologyPartners: partnersData.filter((p: Partner) => p.type === "technology").length,
          manufacturingPartners: partnersData.filter((p: Partner) => p.type === "manufacturing")
            .length,
          recentActivity: partnersData.filter((p: Partner) => {
            const partnerDate = new Date(p.created_at)
            const now = new Date()
            return (
              partnerDate.getMonth() === now.getMonth() &&
              partnerDate.getFullYear() === now.getFullYear()
            )
          }).length,
        }
        setStats(systemStats)
      }
    } catch (error) {
      console.error("Error fetching super admin data:", error)
      setError("Failed to load system data")
    }
  }

  const fetchPartnerStats = async (partnerData: Partner) => {
    try {
      const statsData: DashboardStats = {}

      if (partnerData.type === "technology") {
        // Fetch client stats
        const clientsResponse = await fetch("/api/clients")
        if (clientsResponse.ok) {
          const clients = await clientsResponse.json()
          statsData.totalClients = clients.length
        }
      } else if (partnerData.type === "manufacturing") {
        // Fetch document stats
        const documentsResponse = await fetch("/api/documents")
        if (documentsResponse.ok) {
          const documents = await documentsResponse.json()
          statsData.totalDocuments = documents.length
        }
      }

      // Fetch user stats
      const usersResponse = await fetch("/api/users")
      if (usersResponse.ok) {
        const users = await usersResponse.json()
        statsData.totalUsers =
          users.users?.filter((u: any) => u.partners?.some((p: any) => p.status === "active"))
            .length || 0
      }

      setStats(statsData)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-white p-6">
        <div className="flex items-center space-x-2 text-red-400 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading dashboard</span>
        </div>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Super Admin Dashboard
  if (isSuperAdmin) {
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

          <div className="w-20 h-20 rounded-lg bg-orange-600 flex items-center justify-center">
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
                <p className="text-sm font-medium text-gray-400">Technology</p>
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
              <div className="flex items-center mb-3">
                <Plus className="h-6 w-6 mr-3" />
                <h3 className="text-lg font-semibold">Create Partner</h3>
              </div>
              <p className="text-sm opacity-90">Register a new partner organization</p>
            </Link>

            <Link
              href="/dashboard/partners"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors"
            >
              <div className="flex items-center mb-3">
                <Building2 className="h-6 w-6 mr-3" />
                <h3 className="text-lg font-semibold">Manage Partners</h3>
              </div>
              <p className="text-sm opacity-90">View and manage all partners</p>
            </Link>

            <Link
              href="/dashboard/admin"
              className="bg-orange-600 hover:bg-orange-700 rounded-lg p-6 text-white transition-colors"
            >
              <div className="flex items-center mb-3">
                <Shield className="h-6 w-6 mr-3" />
                <h3 className="text-lg font-semibold">Admin Panel</h3>
              </div>
              <p className="text-sm opacity-90">Manage partners and system settings</p>
            </Link>
          </div>
        </div>

        {/* Recent Partners */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Partners</h2>
          {allPartners.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">No partners registered yet</p>
              <p className="text-sm">Get started by creating your first partner</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPartners.slice(0, 5).map(partner => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-white font-medium">{partner.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            partner.type === "technology"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {partner.type === "technology" ? (
                            <Globe className="h-3 w-3 mr-1" />
                          ) : (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {partner.type}
                        </span>
                        <span className="text-sm text-gray-400">
                          Created {formatDate(partner.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/partners/${partner.id}`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    title="View Partner"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              ))}

              {allPartners.length > 5 && (
                <div className="text-center pt-4">
                  <Link
                    href="/dashboard/partners"
                    className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                  >
                    View all {allPartners.length} partners →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular Partner Dashboard
  if (!partner) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Partner Assigned</h2>
          <p className="text-gray-400 mb-4">
            You haven't been assigned to a partner organization yet.
          </p>
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Partners
          </Link>
        </div>
      </div>
    )
  }

  const getQuickActions = () => {
    const actions = [
      {
        name: "Manage Users",
        href: "/dashboard/users",
        icon: Users,
        description: "Invite and manage team members",
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        description: "Configure partner settings",
        color: "bg-gray-600 hover:bg-gray-700",
      },
    ]

    if (partner.type === "technology") {
      actions.unshift({
        name: "Add Client",
        href: "/dashboard/clients/new",
        icon: Plus,
        description: "Register a new client application",
        color: "bg-green-600 hover:bg-green-700",
      })
    } else if (partner.type === "manufacturing") {
      actions.unshift({
        name: "Add Document",
        href: "/dashboard/documents/new",
        icon: Plus,
        description: "Create a new document",
        color: "bg-green-600 hover:bg-green-700",
      })
    }

    return actions
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Partner Dashboard</h1>
          <p className="text-gray-400">Welcome back to {partner.name}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {partner.type}
            </span>
            <span className="text-sm text-gray-500">
              Member since {formatDate(partner.created_at)}
            </span>
          </div>
        </div>

        {partner.logo_url && (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
            <img
              src={partner.logo_url}
              alt={`${partner.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Team Members</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        {partner.type === "technology" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Clients</p>
                <p className="text-2xl font-bold text-white">{stats.totalClients || 0}</p>
              </div>
            </div>
          </div>
        )}

        {partner.type === "manufacturing" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Documents</p>
                <p className="text-2xl font-bold text-white">{stats.totalDocuments || 0}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Recent Activity</p>
              <p className="text-2xl font-bold text-white">{stats.recentActivity || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getQuickActions().map(action => (
            <Link
              key={action.name}
              href={action.href}
              className={`${action.color} rounded-lg p-6 text-white transition-colors`}
            >
              <div className="flex items-center mb-3">
                <action.icon className="h-6 w-6 mr-3" />
                <h3 className="text-lg font-semibold">{action.name}</h3>
              </div>
              <p className="text-sm opacity-90">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Dashboard accessed</span>
            <span className="text-sm">Just now</span>
          </div>
          {partner.type === "technology" && (
            <div className="flex items-center space-x-3 text-gray-400">
              <Users className="h-4 w-4" />
              <span>Client management available</span>
              <span className="text-sm">Ready</span>
            </div>
          )}
          {partner.type === "manufacturing" && (
            <div className="flex items-center space-x-3 text-gray-400">
              <FileText className="h-4 w-4" />
              <span>Document management available</span>
              <span className="text-sm">Ready</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
