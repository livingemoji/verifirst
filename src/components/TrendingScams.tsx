
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const trendingData = [
  {
    category: 'Cryptocurrency',
    count: 1247,
    change: '+23%',
    icon: '₿',
    color: 'from-orange-500 to-yellow-500',
    examples: ['Fake crypto exchanges', 'Ponzi schemes', 'Fake ICOs']
  },
  {
    category: 'Phishing',
    count: 892,
    change: '+15%',
    icon: '🎣',
    color: 'from-red-500 to-pink-500',
    examples: ['Fake bank emails', 'Social media phishing', 'Tax scams']
  },
  {
    category: 'Romance',
    count: 634,
    change: '+8%',
    icon: '💕',
    color: 'from-pink-500 to-rose-500',
    examples: ['Dating app scams', 'Fake profiles', 'Catfishing']
  },
  {
    category: 'Employment',
    count: 521,
    change: '+12%',
    icon: '💼',
    color: 'from-blue-500 to-indigo-500',
    examples: ['Fake job offers', 'Work from home', 'Pyramid schemes']
  },
  {
    category: 'Tech Support',
    count: 387,
    change: '+5%',
    icon: '🔧',
    color: 'from-green-500 to-emerald-500',
    examples: ['Fake Microsoft calls', 'Computer viruses', 'Remote access']
  },
  {
    category: 'Investment',
    count: 298,
    change: '+18%',
    icon: '📈',
    color: 'from-purple-500 to-violet-500',
    examples: ['Forex scams', 'Stock tips', 'High-yield investments']
  }
];

const TrendingScams = () => {
  return (
    <section id="trending" className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">Weekly Trending Scams</h2>
        <p className="text-slate-300 text-lg">
          Stay informed about the latest scam patterns detected this week
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingData.map((item, index) => (
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
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} text-white text-2xl`}>
                    {item.icon}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="bg-green-500/20 text-green-400 border-green-500/30"
                  >
                    {item.change}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{item.category}</h3>
                
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <span className="text-2xl font-bold text-white">{item.count.toLocaleString()}</span>
                  <span className="text-slate-400">reports this week</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-300">Common Examples:</p>
                  <ul className="space-y-1">
                    {item.examples.map((example, idx) => (
                      <li key={idx} className="text-sm text-slate-400 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-2 text-yellow-500" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <motion.div
                  className="mt-4 p-3 bg-slate-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <p className="text-xs text-slate-400">
                    Click to view detailed analysis and protection tips
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrendingScams;
