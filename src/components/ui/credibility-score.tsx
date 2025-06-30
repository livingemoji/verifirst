import React from 'react';
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface CredibilityScoreProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export function CredibilityScore({ value, onChange, readonly = false }: CredibilityScoreProps) {
  const getColor = (score: number) => {
    if (score === 50) return 'bg-blue-500'
    if (score > 50) return 'bg-red-500'
    return 'bg-green-500'
  }

  const getMessage = (score: number) => {
    if (score === 50) return 'Neutral'
    if (score > 50) return `${score}% Likely Scam`
    return `${score}% Likely Safe`
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Credibility Score</h4>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          value === 50 ? "bg-blue-100 text-blue-700" :
          value > 50 ? "bg-red-100 text-red-700" :
          "bg-green-100 text-green-700"
        )}>
          {getMessage(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={readonly ? undefined : (vals) => onChange?.(vals[0])}
        className={cn(
          "w-full",
          getColor(value),
          readonly && "pointer-events-none opacity-70"
        )}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Safe</span>
        <span>Neutral</span>
        <span>Scam</span>
      </div>
    </div>
  )
} 