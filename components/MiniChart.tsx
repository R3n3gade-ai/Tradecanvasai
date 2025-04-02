"use client";

import React, { useMemo, useEffect, useState } from "react";

interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  data?: number[];
  symbol?: string;
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  fillOpacity?: number;
  trend?: 'up' | 'down' | 'neutral';
  days?: number;
}

export function MiniChart({
  data,
  symbol,
  width = 100,
  height = 40,
  lineWidth = 1.5,
  fillOpacity = 0.2,
  trend = 'neutral',
  days = 30
}: Props) {
  const [chartData, setChartData] = useState<number[]>(data || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Only use the data passed directly to the component
  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data);
      setError(null);
    } else {
      // Show an empty state
      setError("No data available");
      setChartData([]);
    }
  }, [data]);
  
  // Determine color based on trend
  const color = useMemo(() => {
    if (trend === 'up') return 'hsl(var(--success))';
    if (trend === 'down') return 'hsl(var(--destructive))';
    return 'hsl(var(--primary))';
  }, [trend]);

  // Prepare the path and polygon points
  const pathData = useMemo(() => {
    if (!chartData || chartData.length === 0) return { path: '', polygon: '' };

    // Find min and max to scale properly
    const minValue = Math.min(...chartData);
    const maxValue = Math.max(...chartData);
    const range = maxValue - minValue || 1; // Avoid division by zero

    // Calculate points
    const points = chartData.map((value, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return { x, y };
    });

    // Create SVG path
    const path = points.map((point, i) => {
      return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    }).join(' ');

    // Create polygon for fill (add bottom corners)
    const polygon = [
      ...points.map(point => `${point.x},${point.y}`),
      `${width},${height}`,
      `0,${height}`
    ].join(' ');

    return { path, polygon };
  }, [chartData, width, height]);

  if (isLoading) {
    return <div className="w-full h-full bg-muted/20 rounded animate-pulse"></div>;
  }
  
  if (!chartData || chartData.length === 0) {
    // Create a simple visualization to show no data is available
    // Draw a flat line to indicate no trend data is available
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/10 rounded">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible opacity-40"
        >
          <line
            x1="0"
            y1={height/2}
            x2={width}
            y2={height/2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>
        <span className="text-xs text-muted-foreground absolute">No data</span>
      </div>
    );
  }
  
  if (error) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-destructive">{error}</div>;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      {/* Fill area under the line */}
      <polygon
        points={pathData.polygon}
        fill={color}
        fillOpacity={fillOpacity}
      />
      
      {/* Line */}
      <path
        d={pathData.path}
        stroke={color}
        strokeWidth={lineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}