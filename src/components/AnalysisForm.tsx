import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import CategorySelector from './CategorySelector';
import FileUploader from './FileUploader';
import ResultCard from './ResultCard';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';

const AnalysisForm = ({ onResult }) => {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState([]);
  const { analyzeContent, isAnalyzing, result } = useScamAnalysis();

  const handleAnalyze = async () => {
    const analysisResult = await analyzeContent(input, category);
    if (analysisResult && onResult) {
      onResult(analysisResult);
    }
  };

  return (
    <section id="analyze" className="max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Analyze Potential Scam</h2>
              <p className="text-sm sm:text-base text-slate-300 px-2">
                Enter a URL, message, or email to check if it's legitimate or a scam
              </p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content to Analyze
                </label>
                <Textarea
                  placeholder="Paste URL, email content, or suspicious message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-24 sm:min-h-32 bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20 text-sm sm:text-base"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 sm:py-3 text-base sm:text-lg font-medium transition-all duration-200"
                >
                  {isAnalyzing ? (
                    <motion.div
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5" />
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
              className="mt-4 sm:mt-6"
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
