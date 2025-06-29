import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Github, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const handleEmailClick = (type: 'report' | 'help') => {
    const subject = type === 'report' 
      ? 'Report Issue - VerifyFirst Scam Shield'
      : 'Help Center - VerifyFirst Scam Shield';
    
    const body = type === 'report'
      ? `Hello VerifyFirst Team,

I would like to report an issue with the VerifyFirst Scam Shield platform.

Issue Details:
- Type of Issue: [Please describe the issue]
- Description: [Please provide detailed description]
- Steps to Reproduce: [If applicable]
- Expected Behavior: [What should happen]
- Actual Behavior: [What actually happened]

Additional Information:
- Browser: [Your browser and version]
- Device: [Your device type]
- Date: ${new Date().toLocaleDateString()}

Thank you for your attention to this matter.

Best regards,
[Your Name]`
      : `Hello VerifyFirst Team,

I need assistance with the VerifyFirst Scam Shield platform.

Help Request:
- Topic: [What do you need help with?]
- Description: [Please describe your question or issue]
- What I've tried: [If applicable]

Additional Information:
- Browser: [Your browser and version]
- Device: [Your device type]
- Date: ${new Date().toLocaleDateString()}

Thank you for your help.

Best regards,
[Your Name]`;

    const mailtoLink = `mailto:livingemoji30@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <footer className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-xl mt-12 sm:mt-16 md:mt-20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                VerifyFirst
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 max-w-md">
              Protecting communities worldwide through AI-powered scam detection and verification. 
              Stay safe, verify first.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Github className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.a>
              <motion.a
                href="mailto:livingemoji30@gmail.com"
                whileHover={{ scale: 1.1 }}
                className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/trends" className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors">Trending Scams</Link></li>
              <li><Link to="/analytics" className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors">Analytics</Link></li>
              <li><a href="#" className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleEmailClick('help')}
                  className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleEmailClick('report')}
                  className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors text-left"
                >
                  Report Issue
                </button>
              </li>
              <li><a href="#" className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm sm:text-base text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm text-slate-400">
            © 2024 VerifyFirst. All rights reserved. Built to protect communities from scams.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
