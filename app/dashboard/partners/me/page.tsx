"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@auth0/nextjs-auth0"
import { Building2, Loader2 } from "lucide-react"

export default function MyPartnerPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchPartnerInfo()
    }
  }, [user])

  const fetchPartnerInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/partners/me")

      if (response.ok) {
        const data = await response.json()

        if (data.partner) {
          // Redirect to the edit page for this partner
          router.push(`/dashboard/partners/${data.partner.id}/edit`)
        } else {
          setError("No partner information found")
        }
      } else {
        setError("Failed to fetch partner information")
      }
    } catch (error) {
      console.error("Error fetching partner info:", error)
      setError("Failed to load partner data")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Building2 className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold">My Partner</h1>
          </div>

          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading partner information...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Building2 className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold">My Partner</h1>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null // Will redirect
}
