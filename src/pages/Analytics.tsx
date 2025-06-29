import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Activity, Globe, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import ScamHeatmap from '@/components/ScamHeatmap';
import Footer from '@/components/Footer';

interface LiveActivity {
  type: string;
  message: string;
  time: string;
  color: string;
}

interface RegionalStat {
  region: string;
  reports: number;
  risk: string;
  trend: string;
}

const Analytics = () => {
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    totalAnalyses: 0,
    activeHotspots: 0,
    regionsCovered: 0,
    detectionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch live activity data
        const activityResponse = await fetch('/api/recent-activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          
          // Transform activity data into live feed format
          const transformedActivity = activityData.slice(0, 8).map((item: any, index: number) => ({
            type: item.is_safe ? 'analysis' : 'report',
            message: item.is_safe 
              ? `Safe content analysis completed for ${item.category}`
              : `Scam report submitted: ${item.title}`,
            time: `${index + 1} min ago`,
            color: item.is_safe ? 'blue' : 'red'
          }));
          
          setLiveActivity(transformedActivity);
        }

        // Fetch statistics
        const statsResponse = await fetch('/api/trending-scams');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const stats = statsData.statistics || {};
          
          setAnalyticsData({
            totalAnalyses: stats.totalReports || 0,
            activeHotspots: Math.floor((stats.scamCount || 0) / 10), // Estimate hotspots
            regionsCovered: 47, // Fixed for Kenya
            detectionRate: stats.totalReports > 0 ? Math.round((stats.highConfidence / stats.totalReports) * 100) : 0
          });
        }

        // Generate regional stats (mock data for now, can be enhanced with real location data)
        const mockRegionalStats = [
          { region: 'Nairobi', reports: Math.floor(Math.random() * 500) + 300, risk: 'High', trend: '+12%' },
          { region: 'Mombasa', reports: Math.floor(Math.random() * 300) + 200, risk: 'Medium', trend: '+8%' },
          { region: 'Kisumu', reports: Math.floor(Math.random() * 200) + 100, risk: 'Medium', trend: '+5%' },
          { region: 'Nakuru', reports: Math.floor(Math.random() * 150) + 50, risk: 'Low', trend: '+3%' },
          { region: 'Eldoret', reports: Math.floor(Math.random() * 100) + 50, risk: 'Low', trend: '+2%' },
          { region: 'Thika', reports: Math.floor(Math.random() * 80) + 30, risk: 'Low', trend: '+1%' },
        ];
        setRegionalStats(mockRegionalStats);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
        </div>
        
        <Header />
        
        <main className="relative z-10">
          {/* Hero Section for Analytics */}
          <section className="pt-20 pb-16 px-4">
            <div className="container mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-600/20 rounded-full">
                    <Activity className="h-12 w-12 text-green-400" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Scam Analytics Dashboard
                </h1>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                  Visualize scam patterns, track live activity, and understand the geographical distribution of threats across Kenya
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    <span>Geographic Heatmap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Live Activity Feed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Real-time Data</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12 space-y-16">
            {/* Scam Heatmap Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Scam Activity Heatmap
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  Interactive map showing scam hotspots and activity levels across different regions of Kenya
                </p>
              </div>
              <ScamHeatmap />
            </motion.div>

            {/* Live Activity Feed Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Live Activity Feed
                </h2>
                <p className="text-lg text-slate-300">
                  Real-time updates on scam reports, analysis requests, and system activity
                </p>
              </div>
              
              {/* Live Activity Feed */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 animate-pulse">
                      <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                      </div>
                      <div className="w-16 h-3 bg-slate-600 rounded"></div>
                    </div>
                  ))
                ) : liveActivity.length > 0 ? (
                  liveActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full bg-${activity.color}-400 animate-pulse`}></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.message}</p>
                      </div>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No recent activity to display</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Analytics Cards */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {loading ? '...' : analyticsData.totalAnalyses.toLocaleString()}
                </div>
                <div className="text-slate-300 text-sm">Total Analyses Today</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 rounded-xl p-6 border border-red-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-red-600/20 rounded-lg">
                    <Map className="h-6 w-6 text-red-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {loading ? '...' : analyticsData.activeHotspots}
                </div>
                <div className="text-slate-300 text-sm">Active Hotspots</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Globe className="h-6 w-6 text-green-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {loading ? '...' : analyticsData.regionsCovered}
                </div>
                <div className="text-slate-300 text-sm">Regions Covered</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {loading ? '...' : analyticsData.detectionRate}%
                </div>
                <div className="text-slate-300 text-sm">Detection Rate</div>
              </div>
            </motion.div>

            {/* Regional Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Regional Statistics
                </h2>
                <p className="text-lg text-slate-300">
                  Scam activity breakdown by major Kenyan regions
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/50 animate-pulse">
                      <div className="h-6 bg-slate-600 rounded mb-4"></div>
                      <div className="h-8 bg-slate-600 rounded mb-2"></div>
                      <div className="h-4 bg-slate-600 rounded mb-2"></div>
                      <div className="h-4 bg-slate-600 rounded"></div>
                    </div>
                  ))
                ) : (
                  regionalStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">{stat.region}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          stat.risk === 'High' ? 'bg-red-500/20 text-red-400' :
                          stat.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {stat.risk}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">{stat.reports}</div>
                      <div className="text-sm text-slate-300">Reports this week</div>
                      <div className="text-xs text-green-400 mt-2">{stat.trend} from last week</div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Analytics; 