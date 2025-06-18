
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VerifyFirst
          </span>
        </motion.div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#analyze" className="text-slate-300 hover:text-white transition-colors duration-200">
            Analyze
          </a>
          <a href="#trending" className="text-slate-300 hover:text-white transition-colors duration-200">
            Trending
          </a>
          <a href="#heatmap" className="text-slate-300 hover:text-white transition-colors duration-200">
            Heatmap
          </a>
        </nav>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
