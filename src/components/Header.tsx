import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const Header = () => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">VerifyFirst Scam Shield</h1>
              <p className="text-sm text-slate-300">Protecting Kenya from online scams - Live & Updated!</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#analysis" className="text-slate-300 hover:text-white transition-colors">
              Analysis
            </a>
            <a href="#domain-check" className="text-slate-300 hover:text-white transition-colors">
              Domain Check
            </a>
            <a href="#batch-processing" className="text-slate-300 hover:text-white transition-colors">
              Batch Processing
            </a>
            <a href="#trends" className="text-slate-300 hover:text-white transition-colors">
              Trends
            </a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
