"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  User,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Mail,
  Shield,
  Users,
  Copy,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { User as UserType } from "@/lib/types"

export default function UserDetailsPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
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
          fetchUserDetails()
        } else {
          console.log("👥 User is partner user")
          setIsSuperAdmin(false)
          setCurrentPartner(data.partner)
          fetchUserDetails()
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

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      console.log(`🔍 Fetching user details from: /api/users/${userId}`)
      const response = await fetch(`/api/users/${userId}`)

      if (response.ok) {
        const userData = await response.json()
        console.log("📊 User data:", userData)
        setUserData(userData)
      } else {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch user, status: ${response.status}`)
        console.error("❌ Error response:", errorText)
        setError(`Failed to fetch user information: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!userData) return

    try {
      setDeleting(true)
      console.log(`🗑️ Deleting user from unified API: /api/users?id=${userId}`)
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Redirect to users list
        router.push("/dashboard/users")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to remove user")
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error("Error removing user:", error)
      setError("Failed to remove user. Please try again.")
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const copyUserId = async () => {
    if (userData?.id) {
      try {
        await navigator.clipboard.writeText(userData.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy user ID:", error)
      }
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "partner_admin":
        return <Shield className="h-5 w-5" />
      case "partner_user":
        return <User className="h-5 w-5" />
      default:
        return <Users className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "partner_admin":
        return "bg-orange-100 text-orange-800"
      case "partner_user":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5" />
      case "inactive":
        return <AlertTriangle className="h-5 w-5" />
      case "pending":
        return <Mail className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "pending":
        return "Pending Invitation"
      default:
        return "Unknown"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error && !userData) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Link
            href="/dashboard/users"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">User not found</div>
          <Link
            href="/dashboard/users"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Back to Users
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
            href="/dashboard/users"
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{userData.name}</h1>
            <p className="text-gray-400">User Details</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/dashboard/users/${userId}/edit`}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Link>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove User
          </button>
        </div>
      </div>

      {/* User Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
          <div className="flex items-start space-x-6">
            {/* User Avatar */}
            <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {userData.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-3">{userData.name}</h2>

              {/* Status and Role */}
              {isSuperAdmin && "total_partners" in userData ? (
                // System user view - show partner relationships
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-400">
                      {userData.total_partners} partner{userData.total_partners !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-400">
                      {userData.admin_roles} admin role{userData.admin_roles !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ) : (
                // Show partner relationships for all users
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-400">
                    Partner Access: {userData.partners.length} organization
                    {userData.partners.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300">{userData.email}</span>
              </div>

              {/* Created Date */}
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="mr-2 h-4 w-4" />
                Member since {formatDate(userData.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={copyUserId}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Copy User ID"}
            </button>

            <Link
              href={`/dashboard/users/${userId}/edit`}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove User
            </button>
          </div>
        </div>
      </div>

      {/* User Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* User ID */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">User ID</h3>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-700 text-orange-400 rounded text-sm font-mono break-all">
              {userData.id}
            </code>
            <button
              onClick={copyUserId}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              title="Copy User ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Unique identifier for this user in the system
          </p>
        </div>

        {/* Role Details */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {isSuperAdmin ? "System User" : "User Role"}
          </h3>
          {isSuperAdmin ? (
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-800">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-white">System User</p>
                <p className="text-sm text-gray-400">
                  Platform-level user with access to multiple partners
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-800">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-white capitalize">Partner User</p>
                <p className="text-sm text-gray-400">User with access to partner organizations</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Partner Relationships - Show for all users */}
      {userData && userData.partners && userData.partners.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Partner Relationships</h3>
          <div className="space-y-4">
            {userData.partners.map((partner, index) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {partner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{partner.name}</h4>
                    <p className="text-sm text-gray-400 capitalize">{partner.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(partner.role)}`}
                  >
                    {getRoleIcon(partner.role)}
                    <span className="ml-1 capitalize">{partner.role.replace("_", " ")}</span>
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partner.status)}`}
                  >
                    {getStatusIcon(partner.status)}
                    <span className="ml-1 capitalize">{partner.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Activity */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">User Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Account Status</h4>
            {isSuperAdmin ? (
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-800">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-green-400 capitalize">Active</p>
                  <p className="text-sm text-gray-400">System user with platform-level access</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-800">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-green-400 capitalize">Active</p>
                  <p className="text-sm text-gray-400">User has access to partner organizations</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Activity Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="text-white font-medium">{formatDate(userData.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">User account active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Permissions</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>View partner resources and information</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Access assigned partner organizations</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Account Details</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>Email: {userData.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Calendar className="h-4 w-4 text-green-400" />
                <span>Created: {formatDate(userData.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Users className="h-4 w-4 text-purple-400" />
                <span>Partner Organizations: {userData.partners.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Remove User</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-white">{userData.name}</span>? This action cannot
              be undone and will revoke all access for this user.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                    Removing...
                  </>
                ) : (
                  "Remove User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
