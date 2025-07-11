
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, RefreshCw, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScamReport {
  id: string;
  content: string;
  category: string;
  confidence: number;
  threats: string[];
  created_at: string;
  is_safe: boolean;
}

interface CategoryTrend {
  category: string;
  count: number;
  change: number;
  icon: string;
  recentScams: ScamReport[];
}

interface TrendingData {
  categoryTrends: CategoryTrend[];
}

const TrendingScams = () => {
  const [trendingData, setTrendingData] = useState<TrendingData>({
    categoryTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTrend | null>(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const { toast } = useToast();

  const fetchTrendingData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('trending-scams', {
        body: { cache_key: 'category_breakdown' }
      });
      
      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = {
        categoryTrends: data.categories?.map((cat: any) => ({
          category: cat.name,
          count: cat.total,
          change: Math.floor(Math.random() * 40) - 20, // Placeholder for now
          icon: cat.icon,
          recentScams: [] // Will be populated when category is clicked
        })) || []
      };
      
      setTrendingData(transformedData);
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      toast({
        title: "Error",
        description: "Failed to load trending scams data",
        variant: "destructive"
      });
      
      // Show empty state instead of dummy data
      setTrendingData({
        categoryTrends: []
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCategoryScams = async (categoryName: string) => {
    try {
      const { data, error } = await supabase
        .from('scam_reports')
        .select(`
          id,
          content,
          confidence,
          threats,
          created_at,
          is_safe,
          categories(name)
        `)
        .eq('categories.name', categoryName)
        .eq('is_safe', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map((scam: any) => ({
        id: scam.id,
        content: scam.content,
        category: scam.categories?.name || categoryName,
        confidence: scam.confidence,
        threats: scam.threats || [],
        created_at: scam.created_at,
        is_safe: scam.is_safe
      })) || [];
    } catch (error) {
      console.error('Failed to fetch category scams:', error);
      return [];
    }
  };

  const handleCategoryClick = async (category: CategoryTrend) => {
    setIsLoading(true);
    const scams = await fetchCategoryScams(category.category);
    setSelectedCategory({
      ...category,
      recentScams: scams
    });
    setShowCategoryDetails(true);
    setIsLoading(false);
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

  if (trendingData.categoryTrends.length === 0) {
    return (
      <section id="trending" className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">No Scam Reports Yet</h2>
          <p className="text-lg text-slate-300 mb-8">
            Be the first to report a scam and help protect others in Kenya
          </p>
          <Button 
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="trending" className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">Trending Scam Categories</h2>
          <p className="text-lg text-slate-300 mb-8">
            Click on any category to see recent scam reports and protect yourself
          </p>
          
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingData.categoryTrends.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group cursor-pointer"
            onClick={() => handleCategoryClick(item)}
          >
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:border-slate-600/50 transition-all duration-300 h-full">
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
                  <span className="text-slate-400">reports</span>
                </div>
                
                <motion.div
                  className="mt-4 p-3 bg-slate-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <p className="text-xs text-slate-400">
                    Click to view detailed reports and protection tips
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Category Details Dialog */}
      <Dialog open={showCategoryDetails} onOpenChange={setShowCategoryDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800/95 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl">
                {selectedCategory?.icon}
              </div>
              {selectedCategory?.category} Scams
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-slate-300 mb-4">
                Recent scam reports in the {selectedCategory?.category.toLowerCase()} category
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                <span>Total Reports: {selectedCategory?.count}</span>
                <span>•</span>
                <span>Change: {selectedCategory?.change > 0 ? '+' : ''}{selectedCategory?.change}%</span>
              </div>
            </div>

            {selectedCategory?.recentScams.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300">No recent scam reports in this category</p>
                <p className="text-slate-400 text-sm mt-2">
                  This could mean the category is relatively safe, or reports are being processed
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {selectedCategory?.recentScams.map((scam, index) => (
                  <motion.div
                    key={scam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-700/50 border-slate-600/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-2 line-clamp-2">
                              {scam.content.substring(0, 200)}
                              {scam.content.length > 200 && '...'}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                              <span>{scam.confidence}% confidence</span>
                              <span>•</span>
                              <span>{new Date(scam.created_at).toLocaleDateString()}</span>
                            </div>
                            {scam.threats.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {scam.threats.map((threat, threatIndex) => (
                                  <Badge key={threatIndex} variant="destructive" className="text-xs">
                                    {threat}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TrendingScams;
