import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { useDomainAnalysis } from '../hooks/useDomainAnalysis'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Globe, Server, MapPin, Info } from 'lucide-react'
import CredibilityScore from './ui/credibility-score'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface DomainAnalysisProps {
  initialDomain?: string
  onAnalysisComplete?: (analysis: any) => void
}

export function DomainAnalysis({ initialDomain, onAnalysisComplete }: DomainAnalysisProps) {
  const [domain, setDomain] = useState(initialDomain || '')
  const [analysis, setAnalysis] = useState<any>(null)

  const { analyzeDomain, getDomainHistory, loading, error, clearError } = useDomainAnalysis()

  useEffect(() => {
    if (initialDomain) {
      handleAnalyze(initialDomain)
    }
  }, [initialDomain])

  const handleAnalyze = async (targetDomain: string) => {
    clearError()
    const result = await analyzeDomain(targetDomain)
    if (result) {
      setAnalysis(result)
      setDomain(targetDomain)
      onAnalysisComplete?.(result)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (domain.trim()) {
      handleAnalyze(domain.trim())
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getTrustScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    if (score >= 40) return <AlertTriangle className="w-5 h-5 text-orange-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Domain Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Domain Analysis
          </CardTitle>
          <CardDescription>
            Check the trust score and security status of any domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter domain (e.g., example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !domain.trim()}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Trust Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Trust Score
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on domain age, blacklists, SSL, and other factors.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
              <CredibilityScore score={analysis.trust_score} size="large" />
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Threat Level:</span>
                  <Badge className={getThreatLevelColor(analysis.threat_level)}>
                    {analysis.threat_level.toUpperCase()}
                  </Badge>
                </div>

                {analysis.is_blacklisted && (
                  <div>
                    <span className="text-lg font-semibold">Blacklist Status:</span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge className="bg-red-500 text-white">Blacklisted</Badge>
                      <span className="text-sm text-muted-foreground">
                        Flagged by: {analysis.blacklist_sources.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {analysis.cached && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Cached {analysis.cache_age ? `${Math.floor(analysis.cache_age / 60)} minutes ago` : 'recently'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Domain Information */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Domain:</span>
                    <span className="font-mono">{analysis.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Server:</span>
                    <span>{analysis.server_location || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span>{analysis.country_code || 'Unknown'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">SSL Certificate:</span>
                    {analysis.ssl_valid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{analysis.ssl_valid ? 'Valid' : 'Invalid'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Response Time:</span>
                    <span>{analysis.response_time_ms}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Domain Age:</span>
                    <span>
                      {analysis.domain_age_days > 0 ? `${analysis.domain_age_days} days` : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {analysis.risk_factors && Object.keys(analysis.risk_factors).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analysis.risk_factors).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div>
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="ml-2 text-muted-foreground">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blacklist Sources */}
          {analysis.blacklist_sources && analysis.blacklist_sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Blacklist Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.blacklist_sources.map((source: string, index: number) => (
                    <Badge key={index} className="bg-red-500 text-white">
                      {source}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default DomainAnalysis 