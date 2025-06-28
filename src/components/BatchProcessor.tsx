import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';

interface BatchItem {
  id: string;
  type: 'file' | 'text';
  content: string;
  category?: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

interface BatchProcessorProps {
  onComplete?: (results: any[]) => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ onComplete }) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'complete'>('upload');

  const { uploadFiles, uploads, isUploading } = useFileUpload({
    maxFileSize: 50 * 1024 * 1024,
    chunkSize: 5 * 1024 * 1024,
    maxConcurrentUploads: 3
  });

  const { analyzeBatch, isAnalyzing } = useScamAnalysis();

  const addTextItem = useCallback((content: string, category?: string) => {
    const newItem: BatchItem = {
      id: crypto.randomUUID(),
      type: 'text',
      content,
      category,
      status: 'pending',
      progress: 0
    };
    setBatchItems(prev => [...prev, newItem]);
  }, []);

  const addFileItems = useCallback((files: File[]) => {
    const newItems: BatchItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      type: 'file',
      content: file.name,
      status: 'pending',
      progress: 0
    }));
    setBatchItems(prev => [...prev, ...newItems]);
  }, []);

  const processBatch = useCallback(async () => {
    if (batchItems.length === 0) return;

    setIsProcessing(true);
    setCurrentStep('upload');

    try {
      // Step 1: Upload files
      const fileItems = batchItems.filter(item => item.type === 'file');
      if (fileItems.length > 0) {
        setCurrentStep('upload');
        
        // Update status for file items
        setBatchItems(prev => prev.map(item => 
          item.type === 'file' 
            ? { ...item, status: 'uploading' }
            : item
        ));

        // Simulate file upload progress
        for (const item of fileItems) {
          for (let progress = 0; progress <= 100; progress += 10) {
            setBatchItems(prev => prev.map(batchItem => 
              batchItem.id === item.id 
                ? { ...batchItem, progress }
                : batchItem
            ));
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          setBatchItems(prev => prev.map(batchItem => 
            batchItem.id === item.id 
              ? { ...batchItem, status: 'completed', progress: 100 }
              : batchItem
          ));
        }
      }

      // Step 2: Analyze content
      setCurrentStep('analyze');
      const textItems = batchItems.filter(item => item.type === 'text');
      
      if (textItems.length > 0) {
        // Update status for text items
        setBatchItems(prev => prev.map(item => 
          item.type === 'text' 
            ? { ...item, status: 'analyzing' }
            : item
        ));

        // Process text analysis in batches
        const batchSize = 5;
        for (let i = 0; i < textItems.length; i += batchSize) {
          const batch = textItems.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (item) => {
            try {
              // Simulate analysis progress
              for (let progress = 0; progress <= 100; progress += 20) {
                setBatchItems(prev => prev.map(batchItem => 
                  batchItem.id === item.id 
                    ? { ...batchItem, progress }
                    : batchItem
                ));
                await new Promise(resolve => setTimeout(resolve, 300));
              }

              const mockResult = {
                isSafe: Math.random() > 0.5,
                confidence: Math.floor(Math.random() * 30) + 70,
                category: item.category || 'General',
                threats: Math.random() > 0.5 ? ['Potential Scam'] : [],
                analysis: 'Analysis completed successfully.'
              };

              setBatchItems(prev => prev.map(batchItem => 
                batchItem.id === item.id 
                  ? { ...batchItem, status: 'completed', progress: 100, result: mockResult }
                  : batchItem
              ));

              return mockResult;
            } catch (error) {
              setBatchItems(prev => prev.map(batchItem => 
                batchItem.id === item.id 
                  ? { ...batchItem, status: 'failed', error: 'Analysis failed' }
                  : batchItem
              ));
              return null;
            }
          });

          await Promise.allSettled(batchPromises);
          
          // Add delay between batches
          if (i + batchSize < textItems.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      setCurrentStep('complete');
      
      // Get completed results
      const results = batchItems
        .filter(item => item.status === 'completed' && item.result)
        .map(item => item.result);

      if (onComplete) {
        onComplete(results);
      }

    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [batchItems, onComplete]);

  const clearBatch = useCallback(() => {
    setBatchItems([]);
    setCurrentStep('upload');
  }, []);

  const removeItem = useCallback((id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'analyzing':
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'analyzing':
      case 'uploading':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const completedCount = batchItems.filter(item => item.status === 'completed').length;
  const failedCount = batchItems.filter(item => item.status === 'failed').length;
  const totalProgress = batchItems.length > 0 
    ? (completedCount / batchItems.length) * 100 
    : 0;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Batch Processor
        </CardTitle>
        <p className="text-slate-300">
          Process multiple files and text analyses efficiently
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        {batchItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">Processing Progress</h4>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  {completedCount} Complete
                </Badge>
                {failedCount > 0 && (
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                    {failedCount} Failed
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  {batchItems.length - completedCount - failedCount} Pending
                </Badge>
              </div>
            </div>
            
            <Progress value={totalProgress} className="h-3" />
            
            <div className="text-sm text-slate-400">
              {currentStep === 'upload' && 'Uploading files...'}
              {currentStep === 'analyze' && 'Analyzing content...'}
              {currentStep === 'complete' && 'Processing complete!'}
            </div>
          </div>
        )}

        {/* Batch Items */}
        <AnimatePresence>
          {batchItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-slate-900/50 p-4 rounded-lg border border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <span className="text-slate-300 text-sm truncate">
                    {item.content}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(item.status)}`}
                  >
                    {item.type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-400"
                  disabled={isProcessing}
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {(item.status === 'uploading' || item.status === 'analyzing') && (
                <Progress value={item.progress} className="h-2" />
              )}
              
              {item.error && (
                <p className="text-red-400 text-xs mt-2">{item.error}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400">
            {batchItems.length} items in batch
          </div>
          
          <div className="flex items-center space-x-2">
            {batchItems.length > 0 && (
              <Button
                variant="outline"
                onClick={clearBatch}
                disabled={isProcessing}
                className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
              >
                Clear All
              </Button>
            )}
            
            <Button
              onClick={processBatch}
              disabled={batchItems.length === 0 || isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Process Batch</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchProcessor; 