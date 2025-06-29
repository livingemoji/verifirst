import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AnalysisForm from '@/components/AnalysisForm';
import ScamSubmissionForm from '@/components/ScamSubmissionForm';
import BatchUploadForm from '@/components/BatchUploadForm';
import DomainAnalysis from '@/components/DomainAnalysis';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import Footer from '@/components/Footer';

const Index = () => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  const handleBatchComplete = (results: any[]) => {
    console.log('Batch processing completed:', results);
    // You can handle the batch results here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
        </div>
        
        <Header />
        
        <main className="relative z-10">
          <HeroSection />
          
          <div className="container mx-auto px-4 py-12 space-y-16">
            {/* Performance Monitor Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                className="inline-flex items-center px-6 py-3 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors shadow-lg"
              >
                {showPerformanceMonitor ? 'Hide' : 'Show'} System Performance
              </button>
            </div>

            {/* Performance Monitor */}
            <AnimatePresence>
              {showPerformanceMonitor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PerformanceMonitor />
                </motion.div>
              )}
            </AnimatePresence>
            
            <section className="max-w-6xl mx-auto">
              <Tabs defaultValue="analyze" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-slate-800/50 border-slate-700 gap-2 p-2">
                  <TabsTrigger 
                    value="analyze" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300 rounded-lg"
                  >
                    Single Analysis
                  </TabsTrigger>
                  <TabsTrigger 
                    value="domain" 
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-300 rounded-lg"
                  >
                    Domain Analysis
                  </TabsTrigger>
                  <TabsTrigger 
                    value="batch" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 rounded-lg"
                  >
                    Batch Processing
                  </TabsTrigger>
                  <TabsTrigger 
                    value="submit" 
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-300 rounded-lg"
                  >
                    Report New Scam
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="analyze" className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <AnalysisForm onResult={setAnalysisResult} />
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="domain" className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <DomainAnalysis />
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="batch" className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <BatchUploadForm onComplete={handleBatchComplete} />
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="submit" className="mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <ScamSubmissionForm />
                  </motion.div>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
