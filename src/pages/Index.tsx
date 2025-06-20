
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AnalysisForm from '@/components/AnalysisForm';
import ScamSubmissionForm from '@/components/ScamSubmissionForm';
import TrendingScams from '@/components/TrendingScams';
import ScamHeatmap from '@/components/ScamHeatmap';
import Footer from '@/components/Footer';

const Index = () => {
  const [analysisResult, setAnalysisResult] = useState(null);

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
            <section className="max-w-4xl mx-auto">
              <Tabs defaultValue="analyze" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
                  <TabsTrigger 
                    value="analyze" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
                  >
                    Analyze Content
                  </TabsTrigger>
                  <TabsTrigger 
                    value="submit" 
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-300"
                  >
                    Report New Scam
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="analyze" className="mt-6">
                  <AnalysisForm onResult={setAnalysisResult} />
                </TabsContent>
                
                <TabsContent value="submit" className="mt-6">
                  <ScamSubmissionForm />
                </TabsContent>
              </Tabs>
            </section>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <TrendingScams />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <ScamHeatmap />
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
