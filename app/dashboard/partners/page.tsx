"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Users,
  Calendar,
  Globe,
  Shield,
  MoreVertical,
} from "lucide-react"
import Link from "next/link"

interface Partner {
  id: string
  name: string
  type: "technology" | "manufacturing"
  logo_url?: string
  created_at: string
  status: string
}

export default function PartnersPage() {
  const { user, isLoading } = useUser()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      checkUserRole()
    }
  }, [user])

  const checkUserRole = async () => {
    try {
      // Check if user is a super admin
      const superAdminResponse = await fetch("/api/test-permissions")
      if (superAdminResponse.ok) {
        const superAdminData = await superAdminResponse.json()
        if (superAdminData.isSuperAdmin) {
          setIsSuperAdmin(true)
        }
      }

      // Fetch partners
      await fetchPartners()
    } catch (error) {
      console.error("Error checking user role:", error)
      await fetchPartners()
    }
  }

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/partners")
      if (response.ok) {
        const data = await response.json()
        setPartners(data)
      } else {
        setError("Failed to fetch partners")
      }
    } catch (error) {
      console.error("Error fetching partners:", error)
      setError("Failed to load partners")
    } finally {
      setLoading(false)
    }
  }

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || partner.type === filterType
    return matchesSearch && matchesFilter
  })

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case "technology":
        return <Globe className="h-4 w-4" />
      case "manufacturing":
        return <Shield className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case "technology":
        return "bg-blue-100 text-blue-800"
      case "manufacturing":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchPartners}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Partner Management</h1>
          <p className="text-gray-400">
            {isSuperAdmin
              ? "Manage all partner organizations in the system"
              : "View and manage your assigned partners"}
          </p>
        </div>
        {isSuperAdmin && (
          <Link
            href="/dashboard/partners/new"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Partner
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Partners</p>
              <p className="text-2xl font-bold text-white">{partners.length}</p>
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
              <p className="text-2xl font-bold text-white">
                {partners.filter(p => p.type === "technology").length}
              </p>
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
              <p className="text-2xl font-bold text-white">
                {partners.filter(p => p.type === "manufacturing").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-white">
                {
                  partners.filter(p => {
                    const partnerDate = new Date(p.created_at)
                    const now = new Date()
                    return (
                      partnerDate.getMonth() === now.getMonth() &&
                      partnerDate.getFullYear() === now.getFullYear()
                    )
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              <option value="technology">Technology</option>
              <option value="manufacturing">Manufacturing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partners List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">
            {isSuperAdmin ? "All Partners" : "Your Partners"}
          </h2>
        </div>

        {filteredPartners.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {partners.length === 0 ? (
              <div>
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg mb-2">
                  {isSuperAdmin ? "No partners registered yet" : "No partners assigned yet"}
                </p>
                <p className="mb-4">
                  {isSuperAdmin
                    ? "Get started by creating your first partner organization"
                    : "You haven't been assigned to any partner organizations yet"}
                </p>
                {isSuperAdmin && (
                  <Link
                    href="/dashboard/partners/new"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Partner
                  </Link>
                )}
              </div>
            ) : (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No partners match your search criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredPartners.map(partner => (
              <div key={partner.id} className="p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white">{partner.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnerTypeColor(partner.type)}`}
                        >
                          {getPartnerTypeIcon(partner.type)}
                          <span className="ml-1 capitalize">{partner.type}</span>
                        </span>
                        <span className="text-sm text-gray-400">
                          Created {new Date(partner.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/partners/${partner.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title="View Partner"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    {isSuperAdmin && (
                      <>
                        <Link
                          href={`/dashboard/partners/${partner.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Edit Partner"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/dashboard/partners/${partner.id}/users`}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Manage Users"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
