
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategorySelector from './CategorySelector';
import FileUploader from './FileUploader';
import ResultCard from './ResultCard';

const AnalysisForm = ({ onResult }) => {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [files, setFiles] = useState([]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock result based on input content
    const mockResult = {
      isSafe: Math.random() > 0.6,
      confidence: Math.floor(Math.random() * 30) + 70,
      category: category || 'General',
      threats: Math.random() > 0.5 ? ['Phishing', 'Malware'] : [],
      analysis: 'AI analysis completed using advanced pattern recognition.',
      timestamp: new Date().toISOString()
    };
    
    setResult(mockResult);
    setIsAnalyzing(false);
    onResult(mockResult);
  };

  return (
    <section id="analyze" className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Analyze Potential Scam</h2>
              <p className="text-slate-300">
                Enter a URL, message, or email to check if it's legitimate or a scam
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content to Analyze
                </label>
                <Textarea
                  placeholder="Paste URL, email content, or suspicious message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-32 bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
              
              <CategorySelector value={category} onChange={setCategory} />
              
              <FileUploader files={files} onChange={setFiles} />
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isAnalyzing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-medium transition-all duration-200"
                >
                  {isAnalyzing ? (
                    <motion.div
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="h-5 w-5" />
                      <span>Analyze Now</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
        
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <ResultCard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default AnalysisForm;
