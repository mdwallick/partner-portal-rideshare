"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@auth0/nextjs-auth0"
// import { useRouter } from "next/navigation"
import { MapPin, Car, RefreshCw } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const RideshareMap = dynamic(() => import("./RideshareMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  ),
})

interface MetroArea {
  id: string
  name: string
  airport_code: string
  center: [number, number] // [latitude, longitude]
  zoom: number
  carCount: number
}

// Metro area name to airport code mapping
const metroAreaToAirportCode: Record<string, string> = {
  "San Francisco": "SFO",
  Phoenix: "PHX",
  Dallas: "DFW",
  "New York City": "JFK",
  Tokyo: "NRT",
}

// Default metro area coordinates and zoom levels
const DEFAULT_COORDINATES: Record<string, { center: [number, number]; zoom: number }> = {
  SFO: { center: [37.7749, -122.4194], zoom: 12 },
  PHX: { center: [33.4942, -111.9261], zoom: 11 },
  DFW: { center: [32.7767, -96.797], zoom: 10 },
  JFK: { center: [40.7128, -74.006], zoom: 10 },
  NRT: { center: [35.6812, 139.7671], zoom: 10 },
}

export default function RideshareMapPage() {
  const { user, isLoading } = useUser()
  // const router = useRouter()
  const [metroAreas, setMetroAreas] = useState<MetroArea[]>([])
  const [selectedMetro, setSelectedMetro] = useState<MetroArea | null>(null)
  const [isTechnologyPartner, setIsTechnologyPartner] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkPartnerType = useCallback(async () => {
    try {
      // First check if user is a super admin
      const superAdminResponse = await fetch("/api/test-permissions")
      if (superAdminResponse.ok) {
        const superAdminData = await superAdminResponse.json()
        if (superAdminData.isSuperAdmin) {
          console.log("✅ User is super admin, allowing access to all metro areas")
          setIsTechnologyPartner(true)
          // Super admins can see all metro areas
          await fetchAllMetroAreas()
          return
        }
      }

      // Check partner type for non-super admins
      const response = await fetch("/api/partners/me")
      if (response.ok) {
        const data = await response.json()
        console.log("🔍 Partner data received:", data)
        if (data.partner?.type === "technology" || data.partner?.type === "fleet_maintenance") {
          console.log("✅ User is technology or fleet maintenance partner, allowing access")
          setIsTechnologyPartner(true)
          // Fetch metro areas accessible to this partner
          await fetchMetroAreas(data.partner.id)
        } else {
          console.log(
            "❌ User is not technology or fleet maintenance partner, redirecting. Partner type:",
            data.partner?.type
          )
          // Redirect non-eligible partners
          window.location.href = "/dashboard"
        }
      } else {
        console.log("❌ Failed to fetch partner data, redirecting")
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("Error checking partner type:", error)
      window.location.href = "/dashboard"
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      checkPartnerType()
    }
  }, [user, checkPartnerType])

  const fetchMetroAreas = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/metro-areas?partnerId=${partnerId}`)
      if (response.ok) {
        const data = await response.json()
        // Enhance metro areas with coordinates and car counts
        const enhancedMetroAreas = data.map((metro: any) => {
          // Map metro area name to airport code, then get coordinates
          const airportCode = metroAreaToAirportCode[metro.name]
          const coords = airportCode
            ? DEFAULT_COORDINATES[airportCode]
            : { center: [0, 0], zoom: 10 }
          return {
            ...metro,
            center: coords.center,
            zoom: coords.zoom,
            carCount: Math.floor(Math.random() * 20) + 10, // Random car count for demo
          }
        })
        setMetroAreas(enhancedMetroAreas)
        if (enhancedMetroAreas.length > 0) {
          setSelectedMetro(enhancedMetroAreas[0])
        }
      } else {
        console.error("Failed to fetch metro areas")
      }
    } catch (error) {
      console.error("Error fetching metro areas:", error)
    }
  }

  const fetchAllMetroAreas = async () => {
    try {
      const response = await fetch("/api/metro-areas")
      if (response.ok) {
        const data = await response.json()
        // Enhance metro areas with coordinates and car counts
        const enhancedMetroAreas = data.map((metro: any) => {
          // Map metro area name to airport code, then get coordinates
          const airportCode = metroAreaToAirportCode[metro.name]
          const coords = airportCode
            ? DEFAULT_COORDINATES[airportCode]
            : { center: [0, 0], zoom: 10 }
          return {
            ...metro,
            center: coords.center,
            zoom: coords.zoom,
            carCount: Math.floor(Math.random() * 20) + 10, // Random car count for demo
          }
        })
        setMetroAreas(enhancedMetroAreas)
        if (enhancedMetroAreas.length > 0) {
          setSelectedMetro(enhancedMetroAreas[0])
        }
      } else {
        console.error("Failed to fetch all metro areas")
      }
    } catch (error) {
      console.error("Error fetching all metro areas:", error)
    }
  }

  const handleMetroChange = (metroId: string) => {
    const metro = metroAreas.find(m => m.id === metroId)
    if (metro) {
      setSelectedMetro(metro)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isTechnologyPartner) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold">Rideshare Map</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Real-time view of autonomous rideshare vehicles in your metro area
          </p>
        </div>

        {/* Metro Area Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="metro-select" className="text-lg font-medium">
              Metro Area:
            </label>
            <select
              id="metro-select"
              value={selectedMetro?.id || ""}
              onChange={e => handleMetroChange(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={metroAreas.length === 0}
            >
              {metroAreas.length === 0 ? (
                <option value="">Loading metro areas...</option>
              ) : (
                metroAreas.map(metro => (
                  <option key={metro.id} value={metro.id}>
                    {metro.name} ({metro.airport_code}) - {metro.carCount} vehicles
                  </option>
                ))
              )}
            </select>
            {selectedMetro && (
              <div className="flex items-center space-x-2 text-gray-400">
                <Car className="h-5 w-5" />
                <span>{selectedMetro.carCount} autonomous vehicles available</span>
              </div>
            )}
            <button
              onClick={() => selectedMetro && setSelectedMetro({ ...selectedMetro })}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh autonomous vehicle locations"
              disabled={!selectedMetro}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Map Container */}
        {selectedMetro ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <RideshareMap metroArea={selectedMetro} />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg text-gray-400">No metro areas available</p>
            <p className="text-sm text-gray-500">
              Contact your administrator to assign metro areas
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span>In Use</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Low Battery</span>
          </div>
        </div>
      </div>
    </div>
  )
}
