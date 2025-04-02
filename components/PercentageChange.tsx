"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  value: number;
  showIcon?: boolean;
  iconSize?: number;
  className?: string;
}

export function PercentageChange({ value, showIcon = true, iconSize = 4, className = "" }: Props) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isZero = value === 0;
  
  let textColorClass = "text-muted-foreground";
  if (isPositive) textColorClass = "text-success";
  if (isNegative) textColorClass = "text-destructive";
  
  return (
    <span className={`flex items-center ${textColorClass} ${className}`}>
      {showIcon && !isZero && (
        isPositive 
          ? <TrendingUp className={`mr-1 h-${iconSize} w-${iconSize}`} /> 
          : <TrendingDown className={`mr-1 h-${iconSize} w-${iconSize}`} />
      )}
      {isPositive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}
