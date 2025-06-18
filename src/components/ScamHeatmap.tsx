
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const heatmapData = [
  { region: 'North America', intensity: 85, reports: 2341, color: 'bg-red-500' },
  { region: 'Europe', intensity: 72, reports: 1876, color: 'bg-orange-500' },
  { region: 'Asia Pacific', intensity: 91, reports: 2987, color: 'bg-red-600' },
  { region: 'South America', intensity: 64, reports: 1234, color: 'bg-yellow-500' },
  { region: 'Africa', intensity: 43, reports: 876, color: 'bg-green-500' },
  { region: 'Middle East', intensity: 67, reports: 1456, color: 'bg-orange-400' }
];

const recentActivity = [
  { type: 'Crypto Scam', location: 'California, US', time: '2 min ago', severity: 'high' },
  { type: 'Phishing', location: 'London, UK', time: '5 min ago', severity: 'medium' },
  { type: 'Romance Scam', location: 'Sydney, AU', time: '8 min ago', severity: 'high' },
  { type: 'Tech Support', location: 'Mumbai, IN', time: '12 min ago', severity: 'low' },
  { type: 'Employment', location: 'São Paulo, BR', time: '15 min ago', severity: 'medium' }
];

const ScamHeatmap = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);

  return (
    <section id="heatmap" className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">Global Scam Activity</h2>
        <p className="text-slate-300 text-lg">
          Real-time visualization of scam reports worldwide
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Activity Heatmap</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>High</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {heatmapData.map((region, index) => (
                  <motion.div
                    key={region.region}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedRegion === region.region 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedRegion(region.region)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${region.color}`}></div>
                        <div>
                          <h4 className="font-medium text-white">{region.region}</h4>
                          <p className="text-sm text-slate-400">{region.reports} reports</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{region.intensity}%</div>
                        <div className="text-xs text-slate-400">activity level</div>
                      </div>
                    </div>
                    
                    {/* Activity Bar */}
                    <div className="mt-3 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-full ${region.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${region.intensity}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Feed */}
        <div>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Activity className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Live Activity</h3>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant={activity.severity === 'high' ? 'destructive' : 
                                activity.severity === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span className="text-sm text-slate-300">{activity.location}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Community Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">12,847</div>
                    <div className="text-xs text-slate-400">Total Reports</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">94.2%</div>
                    <div className="text-xs text-slate-400">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ScamHeatmap;
