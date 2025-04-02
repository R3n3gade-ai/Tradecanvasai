"use client";

import React from "react";
import { Calendar, Dot, ExternalLink } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface Props {
  news: NewsItem[];
  title?: string;
}

export function MarketNewsCard({ news, title = "Market News" }: Props) {
  return (
    <div className="bg-card rounded-lg border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold">{title}</h3>
      </div>
      
      <div className="divide-y divide-white/10">
        {news.map(item => (
          <a 
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 hover:bg-muted/10 transition-colors group"
          >
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-1" />
            </div>
            
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <span>{item.source}</span>
              <Dot className="h-4 w-4" />
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{item.date}</span>
              </div>
              
              {item.sentiment && (
                <>
                  <Dot className="h-4 w-4" />
                  <span className={
                    item.sentiment === 'positive' ? 'text-success' : 
                    item.sentiment === 'negative' ? 'text-destructive' : 
                    'text-muted-foreground'
                  }>
                    {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                  </span>
                </>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
