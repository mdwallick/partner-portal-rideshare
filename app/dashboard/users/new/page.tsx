"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useRouter } from "next/navigation"
import { UserPlus, Mail, User, Shield, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Partner {
  id: string
  name: string
  type: string
}

export default function NewUserPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentPartner, setCurrentPartner] = useState<any>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [partnerId, setPartnerId] = useState("")
  const [clientType, setClientType] = useState<
    "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
  >("web")

  useEffect(() => {
    if (user) {
      checkUserRole()
    }
  }, [user])

  const checkUserRole = async () => {
    try {
      const response = await fetch("/api/partners/me")
      if (response.ok) {
        const data = await response.json()
        if (data.role === "super_admin" || data.isSuperAdmin) {
          setIsSuperAdmin(true)
          fetchPartners()
        } else {
          setIsSuperAdmin(false)
          setCurrentPartner(data.partner)
        }
      } else {
        setError("Failed to determine user role")
      }
    } catch (error) {
      console.error("Error checking user role:", error)
      setError("Failed to load user information")
    } finally {
      setLoading(false)
    }
  }

  const fetchPartners = async () => {
    try {
      const response = await fetch("/api/partners")
      if (response.ok) {
        const partnersData = await response.json()
        setPartners(partnersData)
      }
    } catch (error) {
      console.error("Error fetching partners:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (isSuperAdmin) {
        // Super admin creates user directly
        await createSystemUser()
      } else {
        // Partner admin invites user
        await invitePartnerUser()
      }
    } catch (error) {
      console.error("Error creating/inviting user:", error)
      setError("Failed to create/invite user")
    } finally {
      setSubmitting(false)
    }
  }

  const createSystemUser = async () => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim(),
        role,
        partnerId,
        clientType,
      }),
    })

    if (response.ok) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard/users")
      }, 2000)
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create user")
    }
  }

  const invitePartnerUser = async () => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        display_name: name.trim(),
        partnerId: currentPartner?.id,
        role: role,
      }),
    })

    if (response.ok) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard/users")
      }, 2000)
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to invite user")
    }
  }

  const getRoleOptions = () => {
    if (isSuperAdmin) {
      return [
        {
          value: "can_admin",
          label: "Admin",
          description: "Full partner access and member management",
        },
        {
          value: "can_manage_members",
          label: "Manager",
          description: "Can manage team members and view data",
        },
        { value: "can_view", label: "Viewer", description: "Read-only access to partner data" },
      ]
    } else {
      return [
        {
          value: "can_admin",
          label: "Admin",
          description: "Full access to partner organization",
        },
        {
          value: "can_view",
          label: "User",
          description: "Standard access to partner resources",
        },
      ]
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <Link
              href="/dashboard/users"
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-green-400 mb-4">
              {isSuperAdmin ? "User created successfully!" : "User invited successfully!"}
            </div>
            <p className="text-gray-400 mb-4">
              {isSuperAdmin
                ? "The user has been created in Auth0 and can now log in to the system. A password reset email has been sent to their email address."
                : "An invitation has been sent to the user's email address."}
            </p>
            <p className="text-gray-500">Redirecting to users list...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard/users"
            className="mr-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isSuperAdmin ? "Create New User" : "Invite Team Member"}
            </h1>
            <p className="text-gray-400 mt-2">
              {isSuperAdmin
                ? "Create a new user and assign them to a partner organization"
                : `Invite a new team member to ${currentPartner?.name || "your organization"}`}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Partner Selection (Super Admin Only) */}
            {isSuperAdmin && (
              <div>
                <label htmlFor="partner" className="block text-sm font-medium text-gray-300 mb-2">
                  Partner Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="partner"
                    value={partnerId}
                    onChange={e => setPartnerId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select a partner organization</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} ({partner.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select a role</option>
                  {getRoleOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {role && (
                <p className="text-sm text-gray-400 mt-1">
                  {getRoleOptions().find(opt => opt.value === role)?.description}
                </p>
              )}
            </div>

            {/* Client Type (Super Admin Only) */}
            {isSuperAdmin && (
              <div>
                <label
                  htmlFor="clientType"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Client Type (Optional)
                </label>
                <select
                  id="clientType"
                  value={clientType}
                  onChange={e => setClientType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="web">Web Application</option>
                  <option value="native_mobile_android">Android Mobile App</option>
                  <option value="native_mobile_ios">iOS Mobile App</option>
                  <option value="M2M">Machine-to-Machine</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  This will create a client application for the user if specified
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{isSuperAdmin ? "Create User" : "Send Invitation"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-blue-300 font-medium mb-2">
            {isSuperAdmin ? "About User Creation" : "About User Invitations"}
          </h3>
          <p className="text-blue-200 text-sm">
            {isSuperAdmin
              ? "As a super admin, you can create users directly in Auth0 and assign them to partner organizations. The user will receive a password reset email and can log in immediately."
              : "When you invite a team member, they'll receive an email invitation. Once they accept, they'll be added to your team with the specified role."}
          </p>
          {isSuperAdmin && (
            <div className="mt-3 p-3 bg-blue-800/30 rounded border border-blue-700">
              <h4 className="text-blue-200 text-sm font-medium mb-2">
                What happens when you create a user:
              </h4>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• Auth0 user account created with secure temporary password</li>
                <li>• User added to partner's Auth0 organization</li>
                <li>• Password reset email sent to user's email address</li>
                <li>• User can immediately log in using password reset</li>
                <li>• Optional client application created if specified</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
