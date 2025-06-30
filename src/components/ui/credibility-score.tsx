import React from 'react';
import { cn } from '@/lib/utils';

interface CredibilityScoreProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const CredibilityScore: React.FC<CredibilityScoreProps> = ({
  score,
  size = 'medium',
  className,
}) => {
  const scoreNormalized = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45; // r = 45
  const offset = circumference - (scoreNormalized / 100) * circumference;

  let colorClass = 'text-green-500';
  if (scoreNormalized < 40) {
    colorClass = 'text-red-500';
  } else if (scoreNormalized < 70) {
    colorClass = 'text-yellow-500';
  }

  const sizeClasses = {
    small: { svg: 'w-16 h-16', text: 'text-lg' },
    medium: { svg: 'w-24 h-24', text: 'text-2xl' },
    large: { svg: 'w-32 h-32', text: 'text-4xl' },
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className={cn('relative inline-flex items-center justify-center', selectedSize.svg, className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={cn('transform -rotate-90 origin-center transition-all duration-500 ease-out', colorClass)}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          strokeLinecap="round"
        />
      </svg>
      <span className={cn('absolute font-bold', colorClass, selectedSize.text)}>
        {scoreNormalized}
      </span>
    </div>
  );
};

export default CredibilityScore;
