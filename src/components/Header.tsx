import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', description: 'Analyze & Submit' },
    { path: '/trends', label: 'Trending Scams', description: 'Weekly Reports' },
    { path: '/analytics', label: 'Analytics', description: 'Heatmap & Activity' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">VerifyFirst Scam Shield</h1>
              <p className="text-sm text-slate-300 hidden sm:block">Protecting Kenya from online scams</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span className="block text-xs opacity-70">{item.description}</span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <motion.nav
          initial={false}
          animate={{ height: isMenuOpen ? 'auto' : 0, opacity: isMenuOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden overflow-hidden"
        >
          <div className="py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-sm opacity-70">{item.description}</div>
              </Link>
            ))}
          </div>
        </motion.nav>
      </div>
    </motion.header>
  );
};

export default Header;
