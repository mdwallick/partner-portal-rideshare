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
import { useSuperAdmin } from "./SuperAdminContext"

interface PartnerData {
  role: string
  partner: any
  isSuperAdmin: boolean
}

interface PartnerContextType {
  partnerData: PartnerData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined)

export function usePartner() {
  const context = useContext(PartnerContext)
  if (context === undefined) {
    throw new Error("usePartner must be used within a PartnerProvider")
  }
  return context
}

interface PartnerProviderProps {
  children: ReactNode
}

export function PartnerProvider({ children }: PartnerProviderProps) {
  const { user, isLoading: authLoading } = useUser()
  const { isSuperAdmin } = useSuperAdmin()
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPartnerData = useCallback(async () => {
    if (!user) {
      setPartnerData(null)
      setIsLoading(false)
      return
    }

    // If user is super admin, don't fetch partner data
    if (isSuperAdmin) {
      setPartnerData({
        role: "super_admin",
        partner: null,
        isSuperAdmin: true,
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/partners/me")
      if (response.ok) {
        const data = await response.json()
        setPartnerData(data)
      } else {
        console.error("Failed to fetch partner data:", response.status)
        setError("Failed to fetch partner data")
        setPartnerData(null)
      }
    } catch (error) {
      console.error("Error fetching partner data:", error)
      setError("Error fetching partner data")
      setPartnerData(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, isSuperAdmin])

  const refetch = async () => {
    await fetchPartnerData()
  }

  // Fetch partner data when user or super admin status changes
  useEffect(() => {
    if (!authLoading && user && isSuperAdmin !== null) {
      fetchPartnerData()
    } else if (!authLoading && !user) {
      setPartnerData(null)
      setIsLoading(false)
    }
  }, [user, authLoading, isSuperAdmin, fetchPartnerData])

  const value: PartnerContextType = {
    partnerData,
    isLoading,
    error,
    refetch,
  }

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
}
