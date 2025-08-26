"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Car {
  id: string
  location: [number, number] // [latitude, longitude]
  status: "available" | "in-use" | "offline"
  carType: "sedan" | "suv" | "luxury"
  vehicleId: string // Autonomous vehicle ID instead of driver name
  rating: number
  eta?: number // minutes to destination
  batteryLevel: number // Battery percentage for autonomous vehicles
  softwareVersion: string // Current software version
}

interface MetroArea {
  id: string
  name: string
  center: [number, number]
  zoom: number
  carCount: number
}

interface RideshareMapProps {
  metroArea: MetroArea
}

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom car icons
const createCarIcon = (status: string) => {
  const color = status === "available" ? "#10b981" : status === "in-use" ? "#f59e0b" : "#6b7280"

  return L.divIcon({
    className: "custom-car-icon",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        🚗
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Generate sample car data for a metro area
const generateSampleCars = (metroArea: MetroArea): Car[] => {
  const cars: Car[] = []
  const carTypes = ["sedan", "suv", "luxury"] as const
  const vehicleIds = [
    "AV-001",
    "AV-002",
    "AV-003",
    "AV-004",
    "AV-005",
    "AV-006",
    "AV-007",
    "AV-008",
    "AV-009",
    "AV-010",
    "AV-011",
    "AV-012",
    "AV-013",
    "AV-014",
    "AV-015",
    "AV-016",
  ]

  // Metro area name to airport code mapping
  const metroAreaToAirportCode: Record<string, string> = {
    "San Francisco": "SFO",
    Phoenix: "PHX",
    Dallas: "DFW",
    "New York City": "JFK",
    Tokyo: "NRT",
  }

  // Define boundaries for each metro area based on airport codes
  const boundaries: Record<
    string,
    {
      lat: [number, number]
      lng: [number, number]
      landmarks: Array<{ name: string; lat: number; lng: number }>
    }
  > = {
    SFO: {
      lat: [37.7, 37.8],
      lng: [-122.5, -122.4],
      landmarks: [
        { name: "Downtown SF", lat: 37.7749, lng: -122.4194 },
        { name: "Fisherman's Wharf", lat: 37.808, lng: -122.4177 },
        { name: "Golden Gate Park", lat: 37.7694, lng: -122.4862 },
        { name: "Mission District", lat: 37.7599, lng: -122.4148 },
      ],
    },
    PHX: {
      lat: [33.4, 33.6],
      lng: [-112.0, -111.8],
      landmarks: [
        { name: "Downtown Phoenix", lat: 33.4484, lng: -112.074 },
        { name: "Old Town Scottsdale", lat: 33.4942, lng: -111.9261 },
        { name: "Tempe", lat: 33.4255, lng: -111.94 },
        { name: "Mesa", lat: 33.4152, lng: -111.8315 },
      ],
    },
    DFW: {
      lat: [32.7, 32.9],
      lng: [-96.9, -96.7],
      landmarks: [
        { name: "Downtown Dallas", lat: 32.7767, lng: -96.797 },
        { name: "Deep Ellum", lat: 32.7875, lng: -96.797 },
        { name: "Uptown Dallas", lat: 32.7967, lng: -96.797 },
        { name: "Oak Cliff", lat: 32.7467, lng: -96.797 },
      ],
    },
    JFK: {
      lat: [40.6, 40.8],
      lng: [-74.0, -73.8],
      landmarks: [
        { name: "Manhattan", lat: 40.7589, lng: -73.9851 },
        { name: "Brooklyn", lat: 40.6782, lng: -73.9442 },
        { name: "Queens", lat: 40.7282, lng: -73.7949 },
        { name: "Bronx", lat: 40.8448, lng: -73.8648 },
      ],
    },
    NRT: {
      lat: [35.7, 35.8],
      lng: [139.7, 139.8],
      landmarks: [
        { name: "Tokyo Station", lat: 35.6812, lng: 139.7671 },
        { name: "Shibuya", lat: 35.658, lng: 139.7016 },
        { name: "Shinjuku", lat: 35.6895, lng: 139.6917 },
        { name: "Ginza", lat: 35.672, lng: 139.7673 },
      ],
    },
  }

  // Map metro area name to airport code, then get boundaries
  const airportCode = metroAreaToAirportCode[metroArea.name]
  let bounds = airportCode ? boundaries[airportCode] : null

  // Safety check: if bounds not found, use default coordinates
  if (!bounds) {
    console.warn(
      `No boundaries found for metro area: ${metroArea.name} (${airportCode || "no airport code"}), using default coordinates`
    )
    // Use the metro area's center coordinates with a reasonable bounding box
    bounds = {
      lat: [metroArea.center[0] - 0.05, metroArea.center[0] + 0.05],
      lng: [metroArea.center[1] - 0.05, metroArea.center[1] + 0.05],
      landmarks: [{ name: "Center", lat: metroArea.center[0], lng: metroArea.center[1] }],
    }
  }

  // Generate cars with some clustering around landmarks
  for (let i = 0; i < metroArea.carCount; i++) {
    let lat, lng

    // 60% chance to cluster around landmarks, 40% random distribution
    if (Math.random() < 0.6 && bounds.landmarks && bounds.landmarks.length > 0) {
      const landmark = bounds.landmarks[Math.floor(Math.random() * bounds.landmarks.length)]
      // Add some randomness around the landmark (±0.01 degrees ≈ ±1km)
      lat = landmark.lat + (Math.random() - 0.5) * 0.02
      lng = landmark.lng + (Math.random() - 0.5) * 0.02
    } else {
      // Random distribution across the metro area
      lat = bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0])
      lng = bounds.lng[0] + Math.random() * (bounds.lng[1] - bounds.lng[0])
    }

    cars.push({
      id: `${metroArea.id}-car-${i + 1}`,
      location: [lat, lng],
      status: Math.random() > 0.7 ? "available" : Math.random() > 0.4 ? "in-use" : "offline",
      carType: carTypes[Math.floor(Math.random() * carTypes.length)],
      vehicleId: vehicleIds[Math.floor(Math.random() * vehicleIds.length)],
      rating: 4.0 + Math.random() * 1.0,
      eta: Math.random() > 0.5 ? Math.floor(Math.random() * 15) + 1 : undefined,
      batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100% battery
      softwareVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    })
  }

  return cars
}

export default function RideshareMap({ metroArea }: RideshareMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)

  useEffect(() => {
    // Generate new sample data when metro area changes
    setCars(generateSampleCars(metroArea))
  }, [metroArea])

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView(metroArea.center, metroArea.zoom)
    mapInstanceRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    // Add car markers
    cars.forEach(car => {
      const marker = L.marker(car.location, { icon: createCarIcon(car.status) }).addTo(map)
        .bindPopup(`
                      <div style="min-width: 240px;">
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">
                          ${car.vehicleId}
                        </h3>
                        <div style="margin: 8px 0; padding: 8px; background-color: #f3f4f6; border-radius: 6px;">
                          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                            <strong>Status:</strong> <span style="color: ${
                              car.status === "available"
                                ? "#10b981"
                                : car.status === "in-use"
                                  ? "#f59e0b"
                                  : "#6b7280"
                            }; font-weight: bold;">${car.status.toUpperCase()}</span>
                          </p>
                          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                            <strong>Vehicle Type:</strong> <span style="text-transform: capitalize;">${car.carType}</span>
                          </p>
                          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                            <strong>Battery:</strong> <span style="color: ${car.batteryLevel > 80 ? "#10b981" : car.batteryLevel > 50 ? "#f59e0b" : "#ef4444"}; font-weight: bold;">${car.batteryLevel}%</span>
                          </p>
                          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                            <strong>Software:</strong> ${car.softwareVersion}
                          </p>
                          ${car.eta ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>ETA:</strong> ${car.eta} min</p>` : ""}
                        </div>
                        <p style="margin: 4px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                          Click for more details
                        </p>
                      </div>
                    `)

      marker.on("click", () => {
        setSelectedCar(car)
      })
    })

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [metroArea, cars])

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />

      {/* Selected Car Info Panel */}
      {selectedCar && (
        <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white shadow-lg max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Autonomous Vehicle Details</h3>
            <button onClick={() => setSelectedCar(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Vehicle ID:</strong> {selectedCar.vehicleId}
            </p>
            <p>
              <strong>Status:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedCar.status === "available"
                    ? "bg-green-600"
                    : selectedCar.status === "in-use"
                      ? "bg-orange-600"
                      : "bg-gray-600"
                }`}
              >
                {selectedCar.status}
              </span>
            </p>
            <p>
              <strong>Vehicle Type:</strong> {selectedCar.carType}
            </p>
            <p>
              <strong>Battery Level:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedCar.batteryLevel > 80
                    ? "bg-green-600"
                    : selectedCar.batteryLevel > 50
                      ? "bg-orange-600"
                      : "bg-red-600"
                }`}
              >
                {selectedCar.batteryLevel}%
              </span>
            </p>
            <p>
              <strong>Software Version:</strong> {selectedCar.softwareVersion}
            </p>
            {selectedCar.eta && (
              <p>
                <strong>ETA:</strong> {selectedCar.eta} minutes
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
