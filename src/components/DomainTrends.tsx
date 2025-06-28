import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useDomainAnalysis } from '../hooks/useDomainAnalysis'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

interface DomainTrendsProps {
  domain: string
}

interface TrendData {
  date: string
  trust_score: number
  blacklisted: boolean
  threat_level: string
}

export function DomainTrends({ domain }: DomainTrendsProps) {
  const [history, setHistory] = useState<TrendData[]>([])
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getDomainHistory } = useDomainAnalysis()

  useEffect(() => {
    if (domain) {
      loadHistory()
    }
  }, [domain, timeRange])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getDomainHistory(domain, timeRange)
      if (result && result.historical_data) {
        setHistory(result.historical_data)
      } else {
        setHistory([])
      }
    } catch (err) {
      setError('Failed to load historical data')
    } finally {
      setLoading(false)
    }
  }

  const getTrendDirection = () => {
    if (history.length < 2) return 'stable'
    
    const first = history[history.length - 1]
    const last = history[0]
    
    if (last.trust_score > first.trust_score) return 'up'
    if (last.trust_score < first.trust_score) return 'down'
    return 'stable'
  }

  const getTrendIcon = () => {
    const direction = getTrendDirection()
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendText = () => {
    const direction = getTrendDirection()
    switch (direction) {
      case 'up':
        return 'Improving'
      case 'down':
        return 'Declining'
      default:
        return 'Stable'
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getAverageScore = () => {
    if (history.length === 0) return 0
    const sum = history.reduce((acc, item) => acc + item.trust_score, 0)
    return Math.round(sum / history.length)
  }

  const getScoreChange = () => {
    if (history.length < 2) return 0
    const first = history[history.length - 1]
    const last = history[0]
    return last.trust_score - first.trust_score
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading historical data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No historical data available for this domain
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trust Score Trends
          </CardTitle>
          <CardDescription>
            Historical analysis of {domain} over the last {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-sm font-medium">{getTrendText()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{history[0]?.trust_score || 0}</p>
              <p className="text-sm text-muted-foreground">Current Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{getAverageScore()}</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${getScoreChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getScoreChange() >= 0 ? '+' : ''}{getScoreChange()}
              </p>
              <p className="text-sm text-muted-foreground">Score Change</p>
            </div>
          </div>

          {/* Simple Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Trust Score Timeline</span>
              <span>{history.length} data points</span>
            </div>
            <div className="relative h-32 bg-gray-50 rounded-lg p-4">
              <div className="flex items-end justify-between h-full">
                {history.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-4 bg-primary rounded-t"
                      style={{ 
                        height: `${(item.trust_score / 100) * 100}%`,
                        minHeight: '4px'
                      }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDate(item.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Trust Score</th>
                  <th className="text-left py-2">Threat Level</th>
                  <th className="text-left py-2">Blacklisted</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{formatDate(item.date)}</td>
                    <td className="py-2 font-medium">{item.trust_score}/100</td>
                    <td className="py-2">
                      <span className={`font-medium ${getThreatLevelColor(item.threat_level)}`}>
                        {item.threat_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2">
                      {item.blacklisted ? (
                        <span className="text-red-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-green-600 font-medium">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 