// Unified User interface - represents all users regardless of access level
export interface User {
  id: string
  email: string
  name: string
  auth0_user_id: string
  created_at: string
  updated_at: string
  partners: {
    id: string
    name: string
    type: string
    logo_url?: string
    role: string
    status: string
    joined_at: string
    updated_at?: string
  }[]
  // Summary statistics (for system users with multiple partners)
  total_partners?: number
  active_partners?: number
  admin_roles?: number
}

// Partner interface
export interface Partner {
  id: string
  name: string
  type: "technology" | "manufacturing" | "fleet_maintenance"
  logo_url?: string
  organization_id?: string
  status: string
  created_at: string
  updated_at: string
}

// Partner User interface (for the relationship table)
export interface PartnerUser {
  id: string
  partner_id: string
  user_id: string
  role: "can_admin" | "can_manage_members" | "can_view"
  status: "active" | "pending" | "inactive"
  email: string
  invited_by?: string
  invited_at: string
  joined_at?: string
  last_login?: string
  created_at: string
  updated_at: string
}

// Client interface
export interface Client {
  id: string
  partner_id: string
  client_name: string
  client_type: "native_mobile_android" | "native_mobile_ios" | "web" | "M2M"
  client_id: string // Stores Auth0 client ID
  picture_url?: string
  created_at: string
  status: string
}

// Document interface
export interface Document {
  id: string
  partner_id: string
  name: string
  description?: string
  status: string
  created_at: string
}

// API Response interfaces
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  details?: string
}
