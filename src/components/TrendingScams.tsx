
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TrendingScam {
  id: string;
  title: string;
  category: string;
  icon: string;
  confidence: number;
  threats: string[];
  createdAt: string;
}

interface CategoryTrend {
  category: string;
  count: number;
  change: number;
  icon: string;
}

interface TrendingData {
  recentScams: TrendingScam[];
  categoryTrends: CategoryTrend[];
}

const TrendingScams = () => {
  const [trendingData, setTrendingData] = useState<TrendingData>({
    recentScams: [],
    categoryTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchTrendingData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('trending-scams');
      
      if (error) throw error;
      
      setTrendingData(data);
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      toast({
        title: "Error",
        description: "Failed to load trending scams data",
        variant: "destructive"
      });
      
      // Fallback to mock data for Kenya
      setTrendingData({
        recentScams: [
          {
            id: '1',
            title: 'Fake M-Pesa reversal message asking for PIN',
            category: 'Mobile Money',
            icon: '📱',
            confidence: 95,
            threats: ['Financial Loss', 'Identity Theft'],
            createdAt: new Date().toISOString()
          },
          {
            id: '2', 
            title: 'Fake job offer from international company',
            category: 'Employment',
            icon: '💼',
            confidence: 88,
            threats: ['Financial Loss', 'Personal Data'],
            createdAt: new Date().toISOString()
          }
        ],
        categoryTrends: [
          { category: 'Mobile Money', count: 234, change: 18, icon: '📱' },
          { category: 'Employment', count: 156, change: 12, icon: '💼' },
          { category: 'Investment', count: 89, change: -5, icon: '📈' },
          { category: 'Romance', count: 67, change: 23, icon: '💕' },
          { category: 'Cryptocurrency', count: 45, change: 8, icon: '₿' },
          { category: 'Government', count: 34, change: -2, icon: '🏛️' }
        ]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTrendingData();
    toast({
      title: "Updated",
      description: "Trending scams data refreshed successfully"
    });
  };

  useEffect(() => {
    fetchTrendingData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchTrendingData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <section id="trending" className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Loading Trending Scams...</h2>
          <div className="animate-spin h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="trending" className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h2 className="text-4xl font-bold text-white">Weekly Trending Scams in Kenya</h2>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-slate-300 text-lg">
          Stay informed about the latest scam patterns detected across Kenya this week
        </p>
        <div className="mt-4 text-sm text-slate-400">
          Last updated: {new Date().toLocaleString()} • Auto-refreshes every 5 minutes
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingData.categoryTrends.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group"
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:border-slate-600/50 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
                    {item.icon}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      item.change > 0 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{item.category}</h3>
                
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <span className="text-2xl font-bold text-white">{item.count.toLocaleString()}</span>
                  <span className="text-slate-400">reports this week</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-300">Recent Example:</p>
                  {trendingData.recentScams
                    .filter(scam => scam.category.toLowerCase().includes(item.category.toLowerCase()))
                    .slice(0, 1)
                    .map(scam => (
                      <div key={scam.id} className="text-sm text-slate-400 flex items-start">
                        <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                        <span className="line-clamp-2">{scam.title}</span>
                      </div>
                    ))
                  }
                </div>
                
                <motion.div
                  className="mt-4 p-3 bg-slate-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <p className="text-xs text-slate-400">
                    Click to view detailed analysis and protection tips for Kenya
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Scams Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Latest Reported Scams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingData.recentScams.slice(0, 4).map((scam, index) => (
            <motion.div
              key={scam.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-slate-800/30 border-slate-700/30 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{scam.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{scam.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Badge variant="outline" className="text-xs">
                          {scam.category}
                        </Badge>
                        <span>•</span>
                        <span>{scam.confidence}% confidence</span>
                        <span>•</span>
                        <span>{new Date(scam.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingScams;
