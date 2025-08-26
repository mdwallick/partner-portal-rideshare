"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react"
import { useUser } from "@auth0/nextjs-auth0"

interface SuperAdminContextType {
  isSuperAdmin: boolean | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined)

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext)
  if (context === undefined) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider")
  }
  return context
}

interface SuperAdminProviderProps {
  children: ReactNode
}

export function SuperAdminProvider({ children }: SuperAdminProviderProps) {
  const { user, isLoading: authLoading } = useUser()
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkSuperAdminStatus = useCallback(async () => {
    if (!user) {
      setIsSuperAdmin(false)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/test-permissions")
      if (response.ok) {
        const data = await response.json()
        setIsSuperAdmin(data.isSuperAdmin || false)
      } else {
        console.error("Failed to check super admin status:", response.status)
        setError("Failed to check super admin status")
        setIsSuperAdmin(false)
      }
    } catch (error) {
      console.error("Error checking super admin status:", error)
      setError("Error checking super admin status")
      setIsSuperAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const refetch = async () => {
    await checkSuperAdminStatus()
  }

  // Check super admin status when user changes
  useEffect(() => {
    if (!authLoading && user) {
      checkSuperAdminStatus()
    } else if (!authLoading && !user) {
      setIsSuperAdmin(false)
      setIsLoading(false)
    }
  }, [user, authLoading, checkSuperAdminStatus])

  const value: SuperAdminContextType = {
    isSuperAdmin,
    isLoading,
    error,
    refetch,
  }

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>
}
