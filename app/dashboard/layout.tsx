"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import {
  Home,
  Users,
  ShoppingBag,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Building2,
  FileText,
  Shield,
  Cog,
} from "lucide-react"

// Navigation structure based on available routes
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Partners", href: "/dashboard/partners", icon: Building2, adminOnly: true },
  { name: "Clients", href: "/dashboard/clients", icon: ShoppingBag, techOnly: true },
  { name: "Documents", href: "/dashboard/documents", icon: FileText, manufacturingOnly: true },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Admin", href: "/dashboard/admin", icon: Shield, adminOnly: true },
  { name: "Settings", href: "/dashboard/settings", icon: Cog },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userPartner, setUserPartner] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Fetch user's partner information and role
  useEffect(() => {
    if (user) {
      fetchUserInfo()
    }
  }, [user])

  const fetchUserInfo = async () => {
    try {
      // First check if user is a super admin
      const superAdminResponse = await fetch("/api/test-permissions")
      if (superAdminResponse.ok) {
        const superAdminData = await superAdminResponse.json()
        if (superAdminData.isSuperAdmin) {
          setIsSuperAdmin(true)
          setUserRole("sys_super_admin")
          return // Super admins don't need partner info
        }
      }

      // For non-super admins, fetch partner information
      const partnerResponse = await fetch("/api/partners/me")
      if (partnerResponse.ok) {
        const partnerData = await partnerResponse.json()
        setUserPartner(partnerData)

        // Determine user role based on partner user relationship
        if (partnerData) {
          setUserRole(partnerData.role)
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Handle logout
  const handleLogout = () => {
    // Clear any local state
    setUserMenuOpen(false)
    setSidebarOpen(false)

    // Redirect to logout endpoint
    window.location.href = "/auth/logout"
  }

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter navigation based on user role and partner type
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && userRole !== "can_admin" && !isSuperAdmin) return false
    if (item.techOnly && userPartner?.type !== "technology") return false
    if (item.manufacturingOnly && userPartner?.type !== "manufacturing") return false
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Partner Portal</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Partner Info or Super Admin Status */}
        {isSuperAdmin ? (
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="text-sm text-gray-400">System Role</div>
            <div className="text-white font-medium">Super Administrator</div>
            <div className="text-xs text-orange-500">Full System Access</div>
          </div>
        ) : userPartner ? (
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="text-sm text-gray-400">Current Partner</div>
            <div className="text-white font-medium">{userPartner.name}</div>
            <div className="text-xs text-gray-500 capitalize">{userPartner.type}</div>
          </div>
        ) : null}

        <nav className="mt-8 px-4">
          <div className="space-y-1">
            {filteredNavigation.map(item => {
              const isActive = pathname === item.href

              return (
                <div key={item.name}>
                  {isActive ? (
                    <Link
                      href={item.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-gray-700"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                        }`}
                      />
                      {item.name}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
                      {item.name}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors w-full"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-900">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-gray-800 border-b border-gray-700 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {userRole && (
                      <p className="text-xs text-orange-400 capitalize">
                        {userRole.replace("_", " ")}
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-full bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-50">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-400" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full"
                    >
                      <LogOut className="mr-3 h-4 w-5 text-gray-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
