"use client";

import React from "react";
import { X, Info, TrendingUp, TrendingDown, BarChart2, Clock, DollarSign, Activity } from "lucide-react";
import { Stock } from "../utils/types";
import { formatCurrency, formatMarketCap } from "../utils/formatters";
import { PercentageChange } from "./PercentageChange";
import ChartContainer from "./ChartContainer";

interface Props {
  stock: Stock | null;
  onClose: () => void;
}

export function StockDetailModal({ stock, onClose }: Props) {
  if (!stock) return null;

  const isPositive = stock.changePercent > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold">
              {stock.symbol.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{stock.name}</h3>
              <div className="text-xs text-muted-foreground">{stock.symbol}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Price and change */}
          <div className="flex flex-wrap md:flex-nowrap justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <div className="text-3xl font-semibold mb-1">{formatCurrency(stock.price)}</div>
              <div className="flex items-center space-x-2">
                <PercentageChange value={stock.changePercent} iconSize={5} />
                <span className="text-muted-foreground">Today</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Market Cap
                </div>
                <div className="font-medium">{formatMarketCap(stock.marketCap || 0)}</div>
              </div>
              
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  Volume
                </div>
                <div className="font-medium">{stock.volume ? `${(stock.volume / 1e6).toFixed(1)}M` : '-'}</div>
              </div>
              
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Last update
                </div>
                <div className="font-medium">Just now</div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-card rounded-sm border border-white/10 overflow-hidden w-full mb-8">
            <ChartContainer
              symbol={stock.symbol}
              initialTimeframe="1day"
              initialChartType="candlestick"
              showToolbar={true}
              height={400}
              darkMode={true}
            />
          </div>
          
          {/* Stock info */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              About {stock.name}
            </h4>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus hendrerit venenatis. 
              Pellentesque sit amet hendrerit risus, sed porttitor quam. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Nullam pulvinar risus non risus hendrerit venenatis.
            </p>
          </div>
          
          {/* Key metrics */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Key Metrics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">52W High</div>
                <div className="font-medium">{formatCurrency(stock.price * 1.3)}</div>
              </div>
              
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">52W Low</div>
                <div className="font-medium">{formatCurrency(stock.price * 0.7)}</div>
              </div>
              
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">P/E Ratio</div>
                <div className="font-medium">{(Math.random() * 30 + 10).toFixed(2)}</div>
              </div>
              
              <div className="bg-muted/5 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Dividend Yield</div>
                <div className="font-medium">{(Math.random() * 3).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-white/10 p-4 flex justify-between">
          <button 
            className="px-4 py-2 rounded-md hover:bg-muted/20 transition-colors flex items-center space-x-2"
            onClick={onClose}
          >
            <span>Close</span>
          </button>
          
          <button className={`px-4 py-2 rounded-md bg-primary hover:bg-primary/90 transition-colors flex items-center space-x-2 text-primary-foreground`}>
            {isPositive ? (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Buy Now</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 mr-2" />
                <span>Sell Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
