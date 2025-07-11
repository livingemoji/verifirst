
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, MapPin, Users, AlertTriangle, Upload, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ScamHeatmap = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hasData, setHasData] = useState(false);

  return (
    <section id="heatmap" className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">Kenya Scam Activity Heatmap</h2>
        <p className="text-slate-300 text-lg">
          Real-time visualization of scam reports across Kenyan counties
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">County Activity Levels</h3>
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
              
              {hasData ? (
                <div className="space-y-4">
                  {/* This would be populated with real data when available */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Globe className="h-16 w-16 text-slate-400" />
                    <h3 className="text-xl font-semibold text-white">No County Data Available</h3>
                    <p className="text-slate-400 max-w-md">
                      County activity levels will appear here once scam reports with location data are submitted.
                      The heatmap will show real-time activity across all 47 Kenyan counties.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Feed */}
        <div>
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Activity className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Live Activity in Kenya</h3>
              </div>
              
              {hasData ? (
                <div className="space-y-4">
                  {/* This would be populated with real activity data when available */}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-slate-400" />
                    <h3 className="text-lg font-semibold text-white">No Recent Activity</h3>
                    <p className="text-slate-400 text-sm">
                      Live activity feed will show real-time scam reports and alerts as they come in.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-red-500/20 rounded-lg border border-green-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Kenya Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">0</div>
                    <div className="text-xs text-slate-400">Total Reports</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">0%</div>
                    <div className="text-xs text-slate-400">Accuracy Rate</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-slate-400">
                    Stats will update as reports are submitted
                  </p>
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
