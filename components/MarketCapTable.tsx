"use client";

import React from "react";
import { Stock } from "../utils/types";
import { MiniChart } from "./MiniChart";
import { PercentageChange } from "./PercentageChange";
import { formatCurrency, formatMarketCap } from "../utils/formatters";

interface Props {
  stocks: Stock[];
  className?: string;
  onStockClick?: (stock: Stock) => void;
}

export function MarketCapTable({ stocks, className = "", onStockClick }: Props) {
  if (!stocks || stocks.length === 0) {
    return (
      <div className={`bg-card rounded-lg p-4 border border-white/10 ${className}`}>
        <div className="animate-pulse flex flex-col space-y-3">
          <div className="h-6 bg-muted/20 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-muted/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-white/10 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/10 border-b border-white/10">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
              <th className="py-4 px-6 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
              <th className="py-4 px-6 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Change</th>
              <th className="py-4 px-6 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Cap</th>
              <th className="py-4 px-6 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
              <th className="py-4 px-6 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stocks.map(stock => (
              <tr 
                key={stock.id} 
                className="hover:bg-muted/5 transition-colors cursor-pointer" 
                onClick={() => onStockClick && onStockClick(stock)}
              >
                <td className="py-3 px-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{stock.symbol.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-6 whitespace-nowrap text-right font-mono font-medium">
                  {formatCurrency(stock.price)}
                </td>
                <td className="py-3 px-6 whitespace-nowrap text-right">
                  <PercentageChange value={stock.changePercent} className="justify-end" />
                </td>
                <td className="py-3 px-6 whitespace-nowrap text-right font-mono">
                  {formatMarketCap(stock.marketCap || 0)}
                </td>
                <td className="py-3 px-6 whitespace-nowrap text-right font-mono text-muted-foreground">
                  {stock.volume ? `${(stock.volume / 1e6).toFixed(1)}M` : '-'}
                </td>
                <td className="py-3 px-6 whitespace-nowrap flex justify-center">
                  <div className="w-24 h-10">
                    <MiniChart 
                      data={stock.chartData} 
                      width={96} 
                      height={40} 
                      trend={stock.changePercent > 0 ? 'up' : 'down'} 
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
