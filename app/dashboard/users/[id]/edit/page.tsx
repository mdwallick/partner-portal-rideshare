"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  User,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Shield,
  Mail,
  Users,
} from "lucide-react"
import Link from "next/link"
import { User as UserType } from "@/lib/types"

interface UserFormData {
  email: string
  display_name: string
}

export default function EditUserPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [userData, setUserData] = useState<UserType | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    display_name: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const user = await response.json()
        setUserData(user)
        setFormData({
          email: user.email,
          display_name: user.display_name || user.name || "",
        })
      } else {
        setError("Failed to fetch user information")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }
    if (formData.display_name.trim().length > 0 && formData.display_name.trim().length < 2) {
      setError("Display name must be at least 2 characters long if provided")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          display_name: formData.display_name.trim(),
        }),
      })

      if (response.ok) {
        setSuccess(true)

        // Redirect to user details after a short delay
        setTimeout(() => {
          router.push(`/dashboard/users/${userId}`)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Failed to update user. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "partner_admin":
        return <Shield className="h-4 w-4" />
      case "partner_user":
        return <User className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
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
        return <CheckCircle className="h-4 w-4" />
      case "inactive":
        return <AlertTriangle className="h-4 w-4" />
      case "pending":
        return <Mail className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "partner_admin":
        return "Full access to manage partners, users, and settings"
      case "partner_user":
        return "Standard access to view and manage assigned resources"
      default:
        return "Unknown role"
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "active":
        return "User has access to the system and can perform actions"
      case "inactive":
        return "User account is inactive and cannot access the system"
      case "pending":
        return "User has been invited but hasn't joined yet"
      default:
        return "Unknown status"
    }
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

  if (success) {
    return (
      <div className="text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">User Updated Successfully!</h1>
          <p className="text-gray-400 mb-6">The user information has been updated and saved.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Email:</span> {formData.email}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium">Display Name:</span>{" "}
              {formData.display_name || "Not set"}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">Redirecting to user details...</p>
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
            href={`/dashboard/users/${userId}`}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit User</h1>
            <p className="text-gray-400">Update user information and permissions</p>
          </div>
        </div>
        <Link
          href={`/dashboard/users/${userId}`}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Link>
      </div>

      {/* Current User Info */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Current User</h3>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {userData.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white">{userData.name}</h4>
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
              <Mail className="h-4 w-4" />
              <span>{userData.email}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>
                {userData.partners.length} partner organization
                {userData.partners.length !== 1 ? "s" : ""}
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

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              The user's email address for login and communication
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter display name (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">Optional display name shown in the system</p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href={`/dashboard/users/${userId}`}
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
                  Saving...
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
          <h3 className="text-lg font-semibold text-white mb-4">Important Notes</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-400">Email Updates</h4>
                <p className="text-sm text-gray-400">
                  Changing a user's email address will affect their login credentials and may
                  require re-authentication.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400">Display Name</h4>
                <p className="text-sm text-gray-400">
                  The display name is optional and used for better user identification in the
                  system.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400">Partner Access</h4>
                <p className="text-sm text-gray-400">
                  User permissions and partner access are managed through the FGA authorization
                  system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
