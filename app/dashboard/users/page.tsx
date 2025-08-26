"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Users,
  Search,
  Edit,
  Shield,
  User,
  Mail,
  CheckCircle,
  AlertTriangle,
  Eye,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { User as UserType } from "@/lib/types"

export default function UsersPage() {
  const { user, isLoading } = useUser()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentPartner, setCurrentPartner] = useState<any>(null)

  useEffect(() => {
    if (user) {
      checkUserRole()
    }
  }, [user])

  const checkUserRole = async () => {
    try {
      console.log("🔍 Checking user role...")
      const response = await fetch("/api/partners/me")
      console.log("📡 Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 User data:", data)

        if (data.role === "super_admin" || data.isSuperAdmin) {
          console.log("🛡️ User is super admin")
          setIsSuperAdmin(true)
          fetchUsers()
        } else {
          console.log("👥 User is partner user")
          setIsSuperAdmin(false)
          setCurrentPartner(data.partner)
          fetchUsers()
        }
      } else {
        console.error("❌ Failed to determine user role, status:", response.status)
        const errorText = await response.text()
        console.error("❌ Error response:", errorText)
        setError("Failed to determine user role")
      }
    } catch (error) {
      console.error("❌ Error checking user role:", error)
      setError("Failed to load user information")
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching users...")
      const response = await fetch("/api/users")
      console.log("📡 Users response status:", response.status)

      if (response.ok) {
        const usersData = await response.json()
        console.log("📊 Users data:", usersData)
        // Ensure we have an array of users, fallback to empty array if structure is unexpected
        if (usersData && Array.isArray(usersData.users)) {
          setUsers(usersData.users)
        } else {
          console.warn("⚠️ Unexpected API response structure:", usersData)
          setUsers([])
        }
      } else {
        const errorText = await response.text()
        console.error("❌ Failed to fetch users, status:", response.status)
        console.error("❌ Error response:", errorText)
        setError(`Failed to fetch users: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "partner_admin":
      case "can_admin":
        return <Shield className="h-4 w-4" />
      case "partner_user":
      case "can_view":
        return <User className="h-4 w-4" />
      case "can_manage_members":
        return <Users className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "partner_admin":
      case "can_admin":
        return "bg-orange-100 text-orange-800"
      case "partner_user":
      case "can_view":
        return "bg-blue-100 text-blue-800"
      case "can_manage_members":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case "active":
  //       return <CheckCircle className="h-4 w-4" />
  //     case "inactive":
  //       return <AlertTriangle className="h-4 w-4" />
  //     case "pending":
  //       return <Mail className="h-4 w-4" />
  //     default:
  //       return <AlertTriangle className="h-4 w-4" />
  //   }
  // }

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "active":
  //       return "bg-green-100 text-green-800"
  //     case "inactive":
  //       return "bg-red-100 text-red-800"
  //     case "pending":
  //       return "bg-yellow-100 text-yellow-800"
  //     default:
  //       return "bg-gray-100 text-gray-800"
  //   }
  // }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Ensure users is an array and we're not still loading
  const filteredUsers = (Array.isArray(users) ? users : []).filter((user: UserType) => {
    // Safety check: ensure user has required properties
    if (!user || !user.email) {
      return false
    }

    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (isSuperAdmin) {
      // For super admins, filter by partner role if specified
      if (roleFilter !== "all") {
        const hasMatchingRole = user.partners.some(p => p.role === roleFilter)
        if (!hasMatchingRole) return false
      }
      return matchesSearch
    } else {
      // For partner users, filter by role and status within their partner
      if (roleFilter !== "all") {
        const hasMatchingRole = user.partners.some(p => p.role === roleFilter)
        if (!hasMatchingRole) return false
      }
      if (statusFilter !== "all") {
        const hasMatchingStatus = user.partners.some(p => p.status === statusFilter)
        if (!hasMatchingStatus) return false
      }
      return matchesSearch
    }
  })

  // Show loading state while checking user role or fetching data
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-2">Error Loading Users</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={checkUserRole}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Don't render main content until we know the user's role
  if (!isSuperAdmin && !currentPartner) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{isSuperAdmin ? "System Users" : "Team Members"}</h1>
            <p className="text-gray-400 mt-2">
              {isSuperAdmin
                ? "Manage all users across the platform"
                : `Manage team members for ${currentPartner?.name || "your organization"}`}
            </p>
          </div>

          {isSuperAdmin && (
            <Link
              href="/dashboard/users/new"
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create User</span>
            </Link>
          )}

          {!isSuperAdmin && (
            <Link
              href="/dashboard/users/new"
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Member</span>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Roles</option>
              <option value="can_admin">Admin</option>
              <option value="can_manage_members">Manager</option>
              <option value="can_view">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-gray-400">
              {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : isSuperAdmin
                  ? "No users have been registered yet"
                  : "No team members have been added yet"}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Partner Access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.name || user.email.split("@")[0]}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {user.partners?.map((partner: any) => (
                            <div key={partner.id} className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(partner.role)}`}
                              >
                                {getRoleIcon(partner.role)}
                                <span className="ml-1">
                                  {partner.role.replace("can_", "").replace("_", " ")}
                                </span>
                              </span>
                              <span className="text-xs text-gray-400">at {partner.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="text-orange-400 hover:text-orange-300 p-1 rounded hover:bg-gray-700 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/dashboard/users/${user.id}/edit`}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-700 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics */}
        {users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Active</p>
                  <p className="text-2xl font-bold">
                    {
                      users.filter((u: UserType) => u.partners.some(p => p.status === "active"))
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold">
                    {
                      users.filter((u: UserType) => u.partners.some(p => p.status === "pending"))
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-orange-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-400">Admins</p>
                  <p className="text-2xl font-bold">
                    {
                      users.filter((u: UserType) => u.partners.some(p => p.role === "can_admin"))
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
