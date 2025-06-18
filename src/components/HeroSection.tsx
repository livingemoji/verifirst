
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Verify First,
            </span>
            <br />
            <span className="text-white">Stay Safe</span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Protect yourself from scams with AI-powered analysis. Verify URLs, messages, 
            and emails instantly with our advanced detection system.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Shield className="h-5 w-5 text-green-400" />
              <span>AI-Powered Detection</span>
            </motion.div>
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Instant Analysis</span>
            </motion.div>
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <span>Community Verified</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
