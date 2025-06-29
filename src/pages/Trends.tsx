import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import TrendingScams from '@/components/TrendingScams';
import Footer from '@/components/Footer';

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  is_safe: boolean;
  created_at: string;
  location?: string;
}

interface Statistics {
  totalReports: number;
  safeCount: number;
  scamCount: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

const Trends = () => {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalReports: 0,
    safeCount: 0,
    scamCount: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent activity
        const activityResponse = await fetch('/api/recent-activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.slice(0, 6));
        }

        // Fetch statistics
        const statsResponse = await fetch('/api/trending-scams');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData.statistics || {
            totalReports: 0,
            safeCount: 0,
            scamCount: 0,
            highConfidence: 0,
            mediumConfidence: 0,
            lowConfidence: 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const getRiskLevel = (confidence: number) => {
    if (confidence >= 80) return 'High Risk';
    if (confidence >= 50) return 'Medium Risk';
    return 'Low Risk';
  };

  const getRiskColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-red-400';
    if (confidence >= 50) return 'bg-yellow-400';
    return 'bg-green-400';
  };

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
          {/* Hero Section for Trends */}
          <section className="pt-20 pb-16 px-4">
            <div className="container mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-blue-600/20 rounded-full">
                    <TrendingUp className="h-12 w-12 text-blue-400" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Weekly Scam Trends
                </h1>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                  Stay informed with the latest scam patterns, emerging threats, and community reports from across Kenya
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Updated Weekly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Real-time Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Data-Driven Insights</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12 space-y-16">
            {/* Trending Scams Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Trending Scams This Week
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  Discover the most reported and dangerous scams currently targeting Kenyans
                </p>
              </div>
              <TrendingScams />
            </motion.div>

            {/* Last Reported Scams Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Recently Reported Scams
                </h2>
                <p className="text-lg text-slate-300">
                  Latest community submissions and verified scam reports
                </p>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/50 animate-pulse">
                      <div className="h-4 bg-slate-600 rounded mb-4"></div>
                      <div className="h-6 bg-slate-600 rounded mb-2"></div>
                      <div className="h-4 bg-slate-600 rounded mb-4"></div>
                      <div className="h-4 bg-slate-600 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-3 h-3 ${getRiskColor(activity.confidence)} rounded-full animate-pulse`}></div>
                        <span className="text-xs text-slate-400">{getTimeAgo(activity.created_at)}</span>
                      </div>
                      <h3 className="font-semibold text-white mb-2">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-slate-300 mb-3">
                        {activity.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{activity.location || 'Kenya'}</span>
                        <span>{getRiskLevel(activity.confidence)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No recent activity to display</p>
                </div>
              )}
            </motion.div>

            {/* Statistics Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {loading ? '...' : statistics.totalReports.toLocaleString()}
                </div>
                <div className="text-slate-300">Total Reports This Week</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {loading ? '...' : statistics.highConfidence}
                </div>
                <div className="text-slate-300">High Confidence Detections</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {loading ? '...' : statistics.scamCount}
                </div>
                <div className="text-slate-300">Scams Identified</div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Trends; 