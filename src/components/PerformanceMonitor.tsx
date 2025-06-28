import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  cache_hit_rate: number;
  avg_response_time: number;
  error_rate: number;
  requests_per_minute: number;
  active_uploads: number;
  queue_length: number;
  system_health: 'healthy' | 'warning' | 'critical';
}

interface MetricData {
  metric_name: string;
  metric_value: number;
  tags: any;
  recorded_at: string;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cache_hit_rate: 0,
    avg_response_time: 0,
    error_rate: 0,
    requests_per_minute: 0,
    active_uploads: 0,
    queue_length: 0,
    system_health: 'healthy'
  });
  const [recentMetrics, setRecentMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Fetch recent performance metrics
      const { data: metricData } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (metricData) {
        setRecentMetrics(metricData);

        // Calculate aggregated metrics
        const cacheHits = metricData.filter(m => m.metric_name === 'cache_hit').length;
        const cacheMisses = metricData.filter(m => m.metric_name === 'cache_miss').length;
        const totalCacheRequests = cacheHits + cacheMisses;
        const cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;

        const responseTimes = metricData
          .filter(m => m.metric_name === 'response_time')
          .map(m => m.metric_value);
        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0;

        const errors = metricData.filter(m => m.metric_name === 'analysis_error').length;
        const totalRequests = metricData.filter(m => m.metric_name === 'analysis_success').length + errors;
        const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

        const requestsPerMinute = metricData
          .filter(m => m.metric_name === 'analysis_success' || m.metric_name === 'analysis_error')
          .filter(m => new Date(m.recorded_at) > new Date(Date.now() - 60 * 1000)).length;

        const activeUploads = metricData
          .filter(m => m.metric_name === 'file_upload')
          .filter(m => new Date(m.recorded_at) > new Date(Date.now() - 5 * 60 * 1000)).length;

        const queueLength = metricData
          .filter(m => m.metric_name === 'processing_queue')
          .reduce((sum, m) => sum + m.metric_value, 0);

        // Determine system health
        let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (errorRate > 10 || avgResponseTime > 5000 || cacheHitRate < 50) {
          systemHealth = 'warning';
        }
        if (errorRate > 25 || avgResponseTime > 10000 || cacheHitRate < 30) {
          systemHealth = 'critical';
        }

        setMetrics({
          cache_hit_rate: Math.round(cacheHitRate),
          avg_response_time: Math.round(avgResponseTime),
          error_rate: Math.round(errorRate),
          requests_per_minute: requestsPerMinute,
          active_uploads: activeUploads,
          queue_length: queueLength,
          system_health: systemHealth
        });
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2 text-slate-300">Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-500" />
          System Performance Monitor
        </CardTitle>
        <div className="flex items-center space-x-4">
          <Badge className={getHealthColor(metrics.system_health)}>
            {getHealthIcon(metrics.system_health)}
            <span className="ml-1">System {metrics.system_health}</span>
          </Badge>
          <span className="text-slate-400 text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cache Hit Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Cache Hit Rate</h4>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">{metrics.cache_hit_rate}%</div>
            <Progress 
              value={metrics.cache_hit_rate} 
              className="h-2"
              style={{
                '--progress-background': metrics.cache_hit_rate > 70 ? '#10b981' : 
                                       metrics.cache_hit_rate > 50 ? '#f59e0b' : '#ef4444'
              } as React.CSSProperties}
            />
          </motion.div>

          {/* Average Response Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Avg Response Time</h4>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">{metrics.avg_response_time}ms</div>
            <Progress 
              value={Math.min((metrics.avg_response_time / 5000) * 100, 100)} 
              className="h-2"
              style={{
                '--progress-background': metrics.avg_response_time < 1000 ? '#10b981' : 
                                       metrics.avg_response_time < 3000 ? '#f59e0b' : '#ef4444'
              } as React.CSSProperties}
            />
          </motion.div>

          {/* Error Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Error Rate</h4>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">{metrics.error_rate}%</div>
            <Progress 
              value={Math.min(metrics.error_rate * 4, 100)} 
              className="h-2"
              style={{
                '--progress-background': metrics.error_rate < 5 ? '#10b981' : 
                                       metrics.error_rate < 15 ? '#f59e0b' : '#ef4444'
              } as React.CSSProperties}
            />
          </motion.div>

          {/* Requests per Minute */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Requests/min</h4>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.requests_per_minute}</div>
          </motion.div>

          {/* Active Uploads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Active Uploads</h4>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.active_uploads}</div>
          </motion.div>

          {/* Queue Length */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Queue Length</h4>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.queue_length}</div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Recent Activity</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentMetrics.slice(0, 10).map((metric, index) => (
              <motion.div
                key={`${metric.metric_name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-slate-900/30 rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <Badge className="text-xs">
                    {metric.metric_name}
                  </Badge>
                  <span className="text-slate-300">
                    {metric.metric_value}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">
                  {new Date(metric.recorded_at).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Recommendations */}
        {metrics.system_health !== 'healthy' && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-400 mb-2">System Recommendations</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              {metrics.cache_hit_rate < 50 && (
                <li>• Consider increasing cache TTL or implementing better caching strategies</li>
              )}
              {metrics.avg_response_time > 3000 && (
                <li>• Response times are high - consider optimizing database queries or scaling resources</li>
              )}
              {metrics.error_rate > 10 && (
                <li>• Error rate is elevated - check logs for recent failures</li>
              )}
              {metrics.queue_length > 10 && (
                <li>• Processing queue is backing up - consider scaling worker processes</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor; 