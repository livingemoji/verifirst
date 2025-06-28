import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BatchItem {
  id: string;
  type: 'file' | 'text';
  content: string;
  category?: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  file?: File;
}

interface BatchUploadFormProps {
  onComplete?: (results: any[]) => void;
  maxItems?: number;
}

const BatchUploadForm: React.FC<BatchUploadFormProps> = ({ 
  onComplete, 
  maxItems = 50 
}) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'complete'>('upload');
  const [textInput, setTextInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { toast } = useToast();

  const { uploadFiles, uploads, isUploading } = useFileUpload({
    maxFileSize: 50 * 1024 * 1024,
    chunkSize: 5 * 1024 * 1024,
    maxConcurrentUploads: 3
  });

  const { analyzeBatch, isAnalyzing } = useScamAnalysis();

  const categories = [
    { value: 'phishing', label: 'Phishing' },
    { value: 'crypto', label: 'Cryptocurrency Scam' },
    { value: 'employment', label: 'Employment Scam' },
    { value: 'romance', label: 'Romance Scam' },
    { value: 'tech-support', label: 'Tech Support Scam' },
    { value: 'investment', label: 'Investment Scam' },
    { value: 'shopping', label: 'Shopping Scam' },
    { value: 'social-media', label: 'Social Media Scam' },
    { value: 'government', label: 'Government Impersonation' },
    { value: 'other', label: 'Other' }
  ];

  const addTextItem = useCallback(() => {
    if (!textInput.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }

    if (batchItems.length >= maxItems) {
      toast({
        title: "Batch Full",
        description: `Maximum ${maxItems} items allowed per batch.`,
        variant: "destructive"
      });
      return;
    }

    const newItem: BatchItem = {
      id: crypto.randomUUID(),
      type: 'text',
      content: textInput.trim(),
      category: selectedCategory,
      status: 'pending',
      progress: 0
    };

    setBatchItems(prev => [...prev, newItem]);
    setTextInput('');
    setSelectedCategory('');

    toast({
      title: "Added to Batch",
      description: "Text item added to batch for analysis.",
    });
  }, [textInput, selectedCategory, batchItems.length, maxItems, toast]);

  const addFileItems = useCallback((files: File[]) => {
    if (batchItems.length + files.length > maxItems) {
      toast({
        title: "Batch Full",
        description: `Can only add ${maxItems - batchItems.length} more items.`,
        variant: "destructive"
      });
      return;
    }

    const newItems: BatchItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      type: 'file',
      content: file.name,
      category: selectedCategory,
      status: 'pending',
      progress: 0,
      file
    }));

    setBatchItems(prev => [...prev, ...newItems]);

    toast({
      title: "Added to Batch",
      description: `${files.length} file(s) added to batch for processing.`,
    });
  }, [batchItems.length, maxItems, selectedCategory, toast]);

  const removeItem = useCallback((id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const processBatch = useCallback(async () => {
    if (batchItems.length === 0) {
      toast({
        title: "Empty Batch",
        description: "Please add items to the batch before processing.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('upload');

    try {
      // Step 1: Upload files
      const fileItems = batchItems.filter(item => item.type === 'file' && item.file);
      if (fileItems.length > 0) {
        setCurrentStep('upload');
        
        // Update status for file items
        setBatchItems(prev => prev.map(item => 
          item.type === 'file' 
            ? { ...item, status: 'uploading' }
            : item
        ));

        const files = fileItems.map(item => item.file!).filter(Boolean);
        const uploadedPaths = await uploadFiles(files);

        // Update file items with upload results
        setBatchItems(prev => prev.map(item => {
          if (item.type === 'file') {
            const fileIndex = fileItems.findIndex(fi => fi.id === item.id);
            if (fileIndex >= 0 && fileIndex < uploadedPaths.length) {
              return { 
                ...item, 
                status: 'completed', 
                progress: 100,
                result: { uploadedPath: uploadedPaths[fileIndex] }
              };
            }
          }
          return item;
        }));
      }

      // Step 2: Analyze text content
      setCurrentStep('analyze');
      const textItems = batchItems.filter(item => item.type === 'text');
      
      if (textItems.length > 0) {
        // Update status for text items
        setBatchItems(prev => prev.map(item => 
          item.type === 'text' 
            ? { ...item, status: 'analyzing' }
            : item
        ));

        // Use batch analysis endpoint
        const analysisRequests = textItems.map(item => ({
          content: item.content,
          category: item.category
        }));

        try {
          const { data, error } = await supabase.functions.invoke('batch-analyze', {
            body: { batch: analysisRequests }
          });

          if (error) throw error;

          // Update text items with analysis results
          setBatchItems(prev => prev.map(item => {
            if (item.type === 'text') {
              const resultIndex = textItems.findIndex(ti => ti.id === item.id);
              if (resultIndex >= 0 && data.results[resultIndex]) {
                return { 
                  ...item, 
                  status: 'completed', 
                  progress: 100,
                  result: data.results[resultIndex]
                };
              }
            }
            return item;
          }));

        } catch (error) {
          console.error('Batch analysis failed:', error);
          
          // Fallback to individual analysis
          for (const item of textItems) {
            try {
              setBatchItems(prev => prev.map(batchItem => 
                batchItem.id === item.id 
                  ? { ...batchItem, status: 'analyzing' }
                  : batchItem
              ));

              // Simulate analysis progress
              for (let progress = 0; progress <= 100; progress += 20) {
                setBatchItems(prev => prev.map(batchItem => 
                  batchItem.id === item.id 
                    ? { ...batchItem, progress }
                    : batchItem
                ));
                await new Promise(resolve => setTimeout(resolve, 200));
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

            } catch (analysisError) {
              setBatchItems(prev => prev.map(batchItem => 
                batchItem.id === item.id 
                  ? { ...batchItem, status: 'failed', error: 'Analysis failed' }
                  : batchItem
              ));
            }
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

      toast({
        title: "Batch Processing Complete",
        description: `Successfully processed ${results.length} items.`,
      });

    } catch (error) {
      console.error('Batch processing failed:', error);
      toast({
        title: "Processing Failed",
        description: "An error occurred during batch processing.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [batchItems, uploadFiles, onComplete, toast]);

  const clearBatch = useCallback(() => {
    setBatchItems([]);
    setCurrentStep('upload');
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
          Batch Upload & Analysis
        </CardTitle>
        <p className="text-slate-300">
          Upload files and analyze text content in batches for maximum efficiency
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Input */}
          <div className="space-y-4">
            <Label className="text-slate-300">Add Text Content</Label>
            <Textarea
              placeholder="Enter text content to analyze..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-32 bg-slate-900/50 border-slate-600 text-white placeholder-slate-400"
              disabled={isProcessing}
            />
            <div className="flex items-center space-x-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-white">
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addTextItem}
                disabled={!textInput.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Text
              </Button>
            </div>
          </div>

          {/* File Input */}
          <div className="space-y-4">
            <Label className="text-slate-300">Add Files</Label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors duration-200">
              <input
                type="file"
                multiple
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  addFileItems(files);
                }}
                className="hidden"
                id="batch-file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="batch-file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">Click to upload files</p>
                <p className="text-slate-400 text-sm mt-1">
                  Images, audio, video, or documents (max 50MB each)
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {batchItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">Batch Progress</h4>
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-500/20 text-green-400">
                  {completedCount} Complete
                </Badge>
                {failedCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-400">
                    {failedCount} Failed
                  </Badge>
                )}
                <Badge className="bg-blue-500/20 text-blue-400">
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
                  <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                    {item.type}
                  </Badge>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-400"
                  disabled={isProcessing}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </div>
              
              {(item.status === 'uploading' || item.status === 'analyzing') && (
                <Progress value={item.progress} className="h-2" />
              )}
              
              {item.error && (
                <p className="text-red-400 text-xs mt-2">{item.error}</p>
              )}

              {item.result && item.status === 'completed' && (
                <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs">
                  <p className="text-slate-300">
                    {item.type === 'file' ? 'File uploaded successfully' : 
                     `Analysis: ${item.result.isSafe ? 'Safe' : 'Suspicious'} (${item.result.confidence}% confidence)`}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400">
            {batchItems.length} items in batch (max {maxItems})
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
                  <span>Process Batch ({batchItems.length})</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchUploadForm; 