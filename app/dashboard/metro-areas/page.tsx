"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, MapPin, Plane, Save } from "lucide-react"
import Link from "next/link"

interface MetroArea {
  id: string
  name: string
  airport_code: string
  created_at: string
  updated_at: string
}

interface MetroAreaFormData {
  name: string
  airport_code: string
}

export default function MetroAreasPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [metroAreas, setMetroAreas] = useState<MetroArea[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMetroArea, setEditingMetroArea] = useState<MetroArea | null>(null)
  const [formData, setFormData] = useState<MetroAreaFormData>({
    name: "",
    airport_code: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const checkSuperAdminAccess = useCallback(async () => {
    try {
      const response = await fetch("/api/test-permissions")
      if (response.ok) {
        const data = await response.json()
        if (data.isSuperAdmin) {
          setIsSuperAdmin(true)
          fetchMetroAreas()
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error checking super admin access:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (user) {
      checkSuperAdminAccess()
    }
  }, [user, checkSuperAdminAccess])

  const fetchMetroAreas = async () => {
    try {
      const response = await fetch("/api/metro-areas")
      if (response.ok) {
        const data = await response.json()
        setMetroAreas(data)
      } else {
        setError("Failed to fetch metro areas")
      }
    } catch (error) {
      console.error("Error fetching metro areas:", error)
      setError("Failed to fetch metro areas")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === "airport_code" ? value.toUpperCase() : value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Metro area name is required")
      return false
    }
    if (!formData.airport_code.trim()) {
      setError("Airport code is required")
      return false
    }
    if (!/^[A-Z]{3}$/.test(formData.airport_code)) {
      setError("Airport code must be a 3-letter IATA code")
      return false
    }
    return true
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const response = await fetch("/api/metro-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess("Metro area created successfully")
        setFormData({ name: "", airport_code: "" })
        setShowCreateForm(false)
        fetchMetroAreas()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create metro area")
      }
    } catch (error) {
      console.error("Error creating metro area:", error)
      setError("Failed to create metro area")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !editingMetroArea) return

    try {
      const response = await fetch(`/api/metro-areas/${editingMetroArea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess("Metro area updated successfully")
        setEditingMetroArea(null)
        setFormData({ name: "", airport_code: "" })
        fetchMetroAreas()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update metro area")
      }
    } catch (error) {
      console.error("Error updating metro area:", error)
      setError("Failed to update metro area")
    }
  }

  const handleDelete = async (metroAreaId: string) => {
    if (!confirm("Are you sure you want to delete this metro area?")) return

    try {
      const response = await fetch(`/api/metro-areas/${metroAreaId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Metro area deleted successfully")
        fetchMetroAreas()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete metro area")
      }
    } catch (error) {
      console.error("Error deleting metro area:", error)
      setError("Failed to delete metro area")
    }
  }

  const startEdit = (metroArea: MetroArea) => {
    setEditingMetroArea(metroArea)
    setFormData({
      name: metroArea.name,
      airport_code: metroArea.airport_code,
    })
  }

  const cancelEdit = () => {
    setEditingMetroArea(null)
    setFormData({ name: "", airport_code: "" })
    setError(null)
  }

  const cancelCreate = () => {
    setShowCreateForm(false)
    setFormData({ name: "", airport_code: "" })
    setError(null)
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-waymo-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Metro Areas Management</h1>
          <p className="text-gray-400">
            Manage metro areas and airport codes for the rideshare system
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Metro Area
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Create New Metro Area</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Metro Area Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., San Francisco Bay Area"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="airport_code"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Airport Code (IATA)
                </label>
                <input
                  type="text"
                  id="airport_code"
                  name="airport_code"
                  value={formData.airport_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., SFO"
                  maxLength={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">3-letter IATA airport code</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Create Metro Area
              </button>
              <button
                type="button"
                onClick={cancelCreate}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingMetroArea && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Edit Metro Area</h2>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Metro Area Name
                </label>
                <input
                  type="text"
                  id="edit_name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_airport_code"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Airport Code (IATA)
                </label>
                <input
                  type="text"
                  id="edit_airport_code"
                  name="airport_code"
                  value={formData.airport_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  maxLength={3}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Metro Area
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metro Areas List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Metro Areas ({metroAreas.length})</h2>
        </div>
        {metroAreas.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg text-gray-400">No metro areas created yet</p>
            <p className="text-sm text-gray-500">Get started by creating your first metro area</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {metroAreas.map(metroArea => (
              <div key={metroArea.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{metroArea.name}</h3>
                    <p className="text-sm text-gray-400">
                      Airport Code:{" "}
                      <span className="font-mono text-blue-400">{metroArea.airport_code}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(metroArea.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(metroArea)}
                    className="p-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Edit metro area"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(metroArea.id)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Delete metro area"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Dashboard */}
      <div className="mt-8 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
