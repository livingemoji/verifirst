import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ThumbsUp, ThumbsDown, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ResultCard = ({ result }) => {
  const getStatusIcon = () => {
    if (result.isSafe) return <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />;
    if (result.confidence < 80) return <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />;
    return <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />;
  };

  const getStatusColor = () => {
    if (result.isSafe) return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    if (result.confidence < 80) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    return 'from-red-500/20 to-rose-500/20 border-red-500/30';
  };

  const getStatusText = () => {
    if (result.isSafe) return 'Appears Safe';
    if (result.confidence < 80) return 'Potentially Suspicious';
    return 'Likely Scam';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className={`bg-gradient-to-r ${getStatusColor()} backdrop-blur-xl border`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">{getStatusText()}</h3>
                <p className="text-sm sm:text-base text-slate-300">Confidence: {result.confidence}%</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs sm:text-sm self-start">
              {result.category}
            </Badge>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {result.threats.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Detected Threats:</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {result.threats.map((threat, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {threat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Analysis:</p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{result.analysis}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-slate-700">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-green-400 text-xs sm:text-sm">
                  <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Helpful
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400 text-xs sm:text-sm">
                  <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Not Helpful
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-purple-400 text-xs sm:text-sm">
                <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResultCard;
