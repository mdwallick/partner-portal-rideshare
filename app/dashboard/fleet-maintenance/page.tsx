"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Cog,
  Plus,
  Search,
  Filter,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Car,
  Download,
  Upload,
  Eye,
} from "lucide-react"

interface MaintenanceTask {
  id: string
  title: string
  description: string
  vehicle_id: string
  task_type: "mechanical" | "software" | "inspection" | "calibration"
  priority: "low" | "medium" | "high" | "critical"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  assigned_to?: string
  estimated_duration: number // in hours
  created_at: string
  due_date?: string
  completed_at?: string
}

interface SoftwareUpdate {
  id: string
  version: string
  description: string
  release_notes: string
  file_size: number
  compatibility: string[]
  status: "available" | "downloading" | "installing" | "completed" | "failed"
  created_at: string
  installed_at?: string
}

export default function FleetMaintenancePage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isFleetMaintenancePartner, setIsFleetMaintenancePartner] = useState(false)
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [softwareUpdates, setSoftwareUpdates] = useState<SoftwareUpdate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [taskFilter, setTaskFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      checkPartnerType()
    }
  }, [user])

  const checkPartnerType = async () => {
    try {
      const response = await fetch("/api/partners/me")
      if (response.ok) {
        const data = await response.json()
        if (data.partner?.type === "fleet_maintenance") {
          setIsFleetMaintenancePartner(true)
          fetchMaintenanceData()
        } else {
          // Redirect non-fleet maintenance partners
          router.push("/dashboard")
        }
      } else {
        setError("Failed to verify partner type")
      }
    } catch (error) {
      console.error("Error checking partner type:", error)
      setError("Failed to verify partner type")
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenanceData = async () => {
    try {
      // For now, we'll use sample data since we don't have the actual API endpoints yet
      const sampleTasks: MaintenanceTask[] = [
        {
          id: "1",
          title: "Brake System Inspection",
          description: "Routine brake system inspection and maintenance",
          vehicle_id: "AV-001",
          task_type: "inspection",
          priority: "high",
          status: "pending",
          estimated_duration: 2,
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          title: "Software Update v2.1.0",
          description: "Install latest autonomous driving software update",
          vehicle_id: "AV-003",
          task_type: "software",
          priority: "medium",
          status: "in_progress",
          assigned_to: "John Smith",
          estimated_duration: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "LIDAR Calibration",
          description: "Calibrate LIDAR sensors for optimal performance",
          vehicle_id: "AV-002",
          task_type: "calibration",
          priority: "critical",
          status: "completed",
          assigned_to: "Sarah Johnson",
          estimated_duration: 3,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      ]

      const sampleUpdates: SoftwareUpdate[] = [
        {
          id: "1",
          version: "2.1.0",
          description: "Enhanced object detection and improved safety protocols",
          release_notes:
            "This update includes significant improvements to pedestrian detection and emergency braking systems.",
          file_size: 256,
          compatibility: ["AV-001", "AV-002", "AV-003"],
          status: "available",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          version: "2.0.5",
          description: "Bug fixes and performance improvements",
          release_notes:
            "Minor bug fixes and performance optimizations for better vehicle handling.",
          file_size: 128,
          compatibility: ["AV-001", "AV-002", "AV-003"],
          status: "completed",
          created_at: new Date().toISOString(),
          installed_at: new Date().toISOString(),
        },
      ]

      setMaintenanceTasks(sampleTasks)
      setSoftwareUpdates(sampleUpdates)
    } catch (error) {
      console.error("Error fetching maintenance data:", error)
      setError("Failed to load maintenance data")
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "mechanical":
        return <Wrench className="h-4 w-4" />
      case "software":
        return <Download className="h-4 w-4" />
      case "inspection":
        return <CheckCircle className="h-4 w-4" />
      case "calibration":
        return <Cog className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={checkPartnerType}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isFleetMaintenancePartner) {
    return (
      <div className="text-white p-6">
        <div className="text-center">
          <Cog className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            This page is only available to fleet maintenance partners.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const filteredTasks = maintenanceTasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTaskType = taskFilter === "all" || task.task_type === taskFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesTaskType && matchesPriority
  })

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Fleet Maintenance</h1>
          <p className="text-gray-400">
            Manage autonomous vehicle maintenance and software updates
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/fleet-maintenance/new"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Link>
          <Link
            href="/dashboard/fleet-maintenance/software"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Software Updates
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-white">{maintenanceTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceTasks.filter(t => t.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Cog className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceTasks.filter(t => t.status === "in_progress").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceTasks.filter(t => t.status === "completed").length}
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
                placeholder="Search tasks by title, description, or vehicle ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={taskFilter}
              onChange={e => setTaskFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              <option value="mechanical">Mechanical</option>
              <option value="software">Software</option>
              <option value="inspection">Inspection</option>
              <option value="calibration">Calibration</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Maintenance Tasks List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Maintenance Tasks</h2>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            {maintenanceTasks.length === 0 ? (
              <div>
                <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg mb-2">No maintenance tasks yet</p>
                <p className="mb-4">Get started by adding your first maintenance task</p>
                <Link
                  href="/dashboard/fleet-maintenance/new"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Task
                </Link>
              </div>
            ) : (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No tasks match your search criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredTasks.map(task => (
              <div key={task.id} className="p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-600 rounded-lg">
                      {getTaskTypeIcon(task.task_type)}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <p className="text-gray-400 mt-1">{task.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-500">Vehicle: {task.vehicle_id}</span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span className="text-sm text-gray-500">
                          Est. {task.estimated_duration}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/fleet-maintenance/${task.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
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
