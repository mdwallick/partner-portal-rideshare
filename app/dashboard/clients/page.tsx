"use client"

import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useSuperAdmin } from "@/app/contexts/SuperAdminContext"
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Smartphone,
  Monitor,
  Globe,
} from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  type: "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
  picture_url?: string
  client_id: string // Auth0 client ID
  created_at: string
  status: "active" | "inactive"
}

export default function ClientsPage() {
  const { user, isLoading } = useUser()
  const { isSuperAdmin } = useSuperAdmin()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [isTechnologyPartner, setIsTechnologyPartner] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    if (user) {
      if (isSuperAdmin) {
        // Super admins can access clients directly
        setIsTechnologyPartner(true)
        fetchClients()
        setCheckingAccess(false)
      } else {
        checkPartnerType()
      }
    }
  }, [user, isSuperAdmin])

  const checkPartnerType = async () => {
    try {
      const response = await fetch("/api/partners/me")
      if (response.ok) {
        const data = await response.json()
        if (data.partner?.type === "technology") {
          setIsTechnologyPartner(true)
          fetchClients()
        } else {
          // Redirect non-technology partners
          window.location.href = "/dashboard"
        }
      } else {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Error checking partner type:", error)
      window.location.href = "/dashboard"
    } finally {
      setCheckingAccess(false)
    }
  }

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        console.log("📋 Received clients data:", data)
        setClients(data)
      } else {
        setError("Failed to fetch clients")
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      setError("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to revoke this client?")) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from local state
        setClients(clients.filter(client => client.id !== clientId))
      } else {
        alert("Failed to revoke client")
      }
    } catch (error) {
      console.error("Error revoking client:", error)
      alert("Failed to revoke client")
    }
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case "native_mobile_android":
      case "native_mobile_ios":
        return <Smartphone className="h-4 w-4" />
      case "web":
        return <Globe className="h-4 w-4" />
      case "M2M":
        return <Monitor className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getClientTypeLabel = (type: string) => {
    switch (type) {
      case "native_mobile_android":
        return "Android App"
      case "native_mobile_ios":
        return "iOS App"
      case "web":
        return "Web App"
      case "M2M":
        return "Machine to Machine"
      default:
        return type
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

  const filteredClients = clients.filter(client => {
    // Add safety checks to prevent errors
    if (!client || !client.name || !client.type) {
      console.warn("Invalid client data:", client)
      return false
    }

    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || client.type === filterType
    return matchesSearch && matchesFilter
  })

  if (isLoading || checkingAccess) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!isTechnologyPartner) {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchClients}
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
          <h1 className="text-3xl font-bold text-white">Client Management</h1>
          <p className="text-gray-400">Manage your registered client applications</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Clients</p>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Mobile Apps</p>
              <p className="text-2xl font-bold text-white">
                {clients.filter(c => c.type.includes("mobile")).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Web Apps</p>
              <p className="text-2xl font-bold text-white">
                {clients.filter(c => c.type === "web").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">M2M</p>
              <p className="text-2xl font-bold text-white">
                {clients.filter(c => c.type === "M2M").length}
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
                placeholder="Search clients..."
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
              <option value="native_mobile_android">Android Apps</option>
              <option value="native_mobile_ios">iOS Apps</option>
              <option value="web">Web Apps</option>
              <option value="M2M">M2M</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Registered Clients</h2>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {clients.length === 0 ? (
              <div>
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg mb-2">No clients registered yet</p>
                <p className="mb-4">Get started by adding your first client application</p>
                <Link
                  href="/dashboard/clients/new"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Link>
              </div>
            ) : (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No clients match your search criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredClients.map(client => (
              <div key={client.id} className="p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {client.picture_url ? (
                      <img
                        src={client.picture_url}
                        alt={client.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center">
                        {getClientTypeIcon(client.type)}
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClientTypeColor(client.type)}`}
                        >
                          {getClientTypeIcon(client.type)}
                          <span className="ml-1">{getClientTypeLabel(client.type)}</span>
                        </span>
                        <span className="text-sm text-gray-400">
                          Created {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    <Link
                      href={`/dashboard/clients/${client.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Revoke Client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
