import { useState, useCallback } from 'react'
import { supabase } from '../integrations/supabase/client'

interface DomainAnalysis {
  domain: string
  trust_score: number
  is_blacklisted: boolean
  blacklist_sources: string[]
  domain_age_days: number
  ssl_valid: boolean
  registrar: string
  country_code: string
  server_location: string
  response_time_ms: number
  threat_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: Record<string, any>
  last_analyzed: string
  cached?: boolean
  cache_age?: number
}

interface DomainAnalysisHistory {
  domain: string
  current_trust_score: number
  current_blacklisted: boolean
  current_threat_level: string
  historical_data: Array<{
    date: string
    trust_score: number
    blacklisted: boolean
    threat_level: string
  }>
}

interface UseDomainAnalysisReturn {
  analyzeDomain: (domain: string) => Promise<DomainAnalysis | null>
  getDomainHistory: (domain: string, daysBack?: number) => Promise<DomainAnalysisHistory | null>
  getDomainRankings: () => Promise<any[]>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useDomainAnalysis(): UseDomainAnalysisReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const analyzeDomain = useCallback(async (domain: string): Promise<DomainAnalysis | null> => {
    setLoading(true)
    setError(null)

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domain-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ domain })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze domain')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getDomainHistory = useCallback(async (domain: string, daysBack: number = 30): Promise<DomainAnalysisHistory | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('get_domain_analysis_with_history', {
        p_domain: domain,
        p_days_back: daysBack
      })

      if (error) {
        throw new Error(error.message)
      }

      return data?.[0] || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getDomainRankings = useCallback(async (): Promise<any[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('domain_trust_rankings')
        .select('*')
        .order('trust_score', { ascending: false })
        .limit(50)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    analyzeDomain,
    getDomainHistory,
    getDomainRankings,
    loading,
    error,
    clearError
  }
} 