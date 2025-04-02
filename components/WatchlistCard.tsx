"use client";

import React from "react";
import { ChevronDown, ChevronRight, Plus, X, Star } from "lucide-react";
import { Watchlist, WatchlistItem } from "../utils/types";
import { PercentageChange } from "./PercentageChange";
import { MiniChart } from "./MiniChart";
import { formatCurrency } from "../utils/formatters";

interface Props {
  watchlist: Watchlist;
  onToggleExpand: (id: string) => void;
  onRemoveStock?: (watchlistId: string, stockId: string) => void;
  onAddStock?: (watchlistId: string) => void;
}

export function WatchlistCard({ 
  watchlist, 
  onToggleExpand,
  onRemoveStock,
  onAddStock 
}: Props) {
  return (
    <div className="bg-card rounded-lg p-4 border border-white/10 transition-all duration-200 hover:border-white/20">
      <div 
        className="flex justify-between items-center mb-3 cursor-pointer"
        onClick={() => onToggleExpand(watchlist.id)}
      >
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">{watchlist.name} 
            {watchlist.stocks.length > 0 && 
              <span className="text-muted-foreground text-sm ml-1">({watchlist.stocks.length})</span>
            }
          </h3>
        </div>
        {watchlist.isExpanded 
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> 
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      {watchlist.isExpanded && (
        <div className="space-y-3">
          {watchlist.stocks.map(stock => (
            <WatchlistStockItem 
              key={stock.id} 
              stock={stock} 
              watchlistId={watchlist.id}
              onRemove={onRemoveStock}
            />
          ))}
          
          {onAddStock && (
            <button 
              onClick={() => onAddStock(watchlist.id)}
              className="w-full mt-2 py-2 rounded-md border border-dashed border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center"
            >
              <Plus className="h-3 w-3 mr-1" />
              <span className="text-xs">Add stock</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface StockItemProps {
  stock: WatchlistItem;
  watchlistId: string;
  onRemove?: (watchlistId: string, stockId: string) => void;
}

function WatchlistStockItem({ stock, watchlistId, onRemove }: StockItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/10 group transition-colors">
      <div className="flex-1 flex items-center justify-between mr-3">
        <div>
          <div className="font-medium">{stock.symbol}</div>
          <div className="text-xs text-muted-foreground">{stock.name}</div>
        </div>
        <div className="text-right">
          <div className="font-medium">{formatCurrency(stock.price)}</div>
          <PercentageChange 
            value={stock.changePercent} 
            showIcon={false}
            className="text-xs justify-end"
          />
        </div>
      </div>
      
      <div className="w-16 h-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
        <MiniChart 
          data={stock.chartData} 
          width={64} 
          height={40} 
          trend={stock.changePercent > 0 ? 'up' : 'down'}
          fillOpacity={0.1}
        />
      </div>
      
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(watchlistId, stock.id);
          }}
          className="ml-1 p-1 rounded-full hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      )}
    </div>
  );
}
