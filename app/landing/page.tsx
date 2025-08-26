"use client"

import Link from "next/link"
import {
  Users,
  Shield,
  BarChart3,
  Zap,
  Building2,
  Cpu,
  Wrench,
  ArrowRight,
  CheckCircle,
  Globe,
  TrendingUp,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">Partner Portal</h1>
              </div>
            </div>
            <div>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Partner Portal for
              <span className="text-orange-500 block">Rideshare Innovation</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Manage partnerships, users, and integrations in one powerful platform. Built for
              growing partner ecosystems with enterprise-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 border border-gray-600 text-lg font-medium rounded-lg text-gray-300 hover:text-white hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive tools for managing your partner ecosystem, from user administration to
              integration management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Partner Management */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Partner Management</h3>
              <p className="text-gray-400 mb-6">
                Create and manage partner organizations with role-based access control. Streamline
                onboarding and partnership workflows.
              </p>
              <div className="flex items-center text-sm text-orange-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Role-based permissions
              </div>
            </div>

            {/* User Administration */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">User Administration</h3>
              <p className="text-gray-400 mb-6">
                Invite team members, assign roles, and manage permissions across your partner
                network with ease.
              </p>
              <div className="flex items-center text-sm text-blue-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Bulk user management
              </div>
            </div>

            {/* Integration Hub */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Integration Hub</h3>
              <p className="text-gray-400 mb-6">
                Connect web apps, mobile apps, and IoT devices seamlessly. Manage API keys and
                client configurations.
              </p>
              <div className="flex items-center text-sm text-green-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Multi-platform support
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h3>
              <p className="text-gray-400 mb-6">
                Monitor partner performance, system metrics, and integration health with real-time
                dashboards.
              </p>
              <div className="flex items-center text-sm text-purple-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Real-time insights
              </div>
            </div>

            {/* Security & Compliance */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Security & Compliance</h3>
              <p className="text-gray-400 mb-6">
                Enterprise-grade authentication with Auth0, fine-grained authorization with FGA, and
                comprehensive audit trails.
              </p>
              <div className="flex items-center text-sm text-red-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                Enterprise security
              </div>
            </div>

            {/* Scalability */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-orange-500 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Built to Scale</h3>
              <p className="text-gray-400 mb-6">
                Designed for growing partner ecosystems. Handle thousands of partners and users with
                optimal performance.
              </p>
              <div className="flex items-center text-sm text-indigo-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                High performance
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Types Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Designed for Every Partner Type
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Whether you&apos;re building technology solutions, manufacturing hardware, or managing
              fleet operations, we have you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Technology Partners */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Technology Partners</h3>
              <p className="text-gray-400">
                Build web applications, mobile apps, and services that integrate seamlessly with our
                platform. Manage API keys and client configurations.
              </p>
            </div>

            {/* Manufacturing Partners */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wrench className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Manufacturing Partners</h3>
              <p className="text-gray-400">
                Deploy hardware sensors, IoT devices, and firmware solutions. Track device
                deployments and manage firmware updates.
              </p>
            </div>

            {/* Fleet Maintenance */}
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Fleet Operations</h3>
              <p className="text-gray-400">
                Manage vehicle operations, maintenance workflows, and fleet analytics. Coordinate
                with service providers and track vehicle health.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join our growing partner ecosystem and start building the future of rideshare
            technology.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:scale-105"
          >
            Sign In to Partner Portal
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
            </div>
            <p className="text-gray-400">© 2024 Partner Portal. Built for rideshare innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
