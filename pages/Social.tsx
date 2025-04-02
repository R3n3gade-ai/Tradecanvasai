"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ChevronLeft, Heart, MessageCircle, BookmarkIcon, Share2, BarChart2, TrendingUp, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DashboardLayout } from "../components/DashboardLayout";

// Mock data for posts
interface Post {
  id: string;
  username: string;
  userImage: string;
  userInitials: string;
  caption: string;
  chartImage: string;
  timestamp: string;
  likes: number;
  comments: number;
  chartType: "line" | "bar" | "area";
  ticker: string;
  tickerChange: string;
  isPositive: boolean;
  isSaved: boolean;
}

// Mock data generation
const generateMockPosts = (count: number, category: string): Post[] => {
  const posts: Post[] = [];
  
  const chartTypes: ("line" | "bar" | "area")[] = ["line", "bar", "area"];
  const tickers = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOG", "META", "SPY"];
  
  // Collection of actual stock chart images for different patterns and timeframes
  const lineChartImages = [
    "https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/images%20(1).jpg",
    "https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/download%20(4).jpg",
  ];
  
  const candleChartImages = [
    "https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/download%20(3).jpg",
    "https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/images.png",
  ];
  
  const barChartImages = [
    "https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/images%20(2).jpg",
    "https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/images%20(1).jpg",
  ];

  // Generate chart URL based on ticker and chart type
  const getChartImage = (ticker: string, chartType: string, index: number) => {
    // Get appropriate chart collection based on type
    let chartCollection;
    if (chartType === "line") {
      chartCollection = lineChartImages;
    } else if (chartType === "bar") {
      chartCollection = barChartImages;
    } else {
      chartCollection = candleChartImages;
    }
    
    // Get image from collection with index-based selection
    return chartCollection[index % chartCollection.length];
  };
  
  for (let i = 1; i <= count; i++) {
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const isPositive = Math.random() > 0.4;
    const changeValue = (Math.random() * 5).toFixed(2);
    const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
    
    // Get chart image based on ticker and type
    const chartImage = getChartImage(ticker, chartType, i);
    
    posts.push({
      id: `${category}-${i}`,
      username: ["alextrader", "investorjane", "stockguru", "marketwhiz", "wallstbets"][Math.floor(Math.random() * 5)],
      userImage: `https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/trader-avatar-${Math.floor(Math.random() * 5) + 1}.png`,
      userInitials: ["AT", "IJ", "SG", "MW", "WB"][Math.floor(Math.random() * 5)],
      caption: [
        `${ticker} is looking bullish on the ${chartType} chart! Key resistance at $${(Math.random() * 100 + 100).toFixed(2)}.`,
        `My analysis of ${ticker} shows a clear ${isPositive ? "uptrend" : "downtrend"} pattern forming.`,
        `Just spotted this ${isPositive ? "bullish" : "bearish"} divergence on ${ticker}! Thoughts?`,
        `${ticker} breaking out of a ${Math.floor(Math.random() * 10 + 5)}-day consolidation pattern.`,
        `Could ${ticker} be setting up for a ${isPositive ? "rally" : "pullback"}? Interesting volume profile.`
      ][Math.floor(Math.random() * 5)],
      chartImage,
      timestamp: `${Math.floor(Math.random() * 12 + 1)}h ago`,
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      chartType,
      ticker,
      tickerChange: `${isPositive ? "+" : "-"}${changeValue}%`,
      isPositive,
      isSaved: Math.random() > 0.7
    });
  }
  
  return posts;
};

// Generate mock data
const recentPosts = generateMockPosts(15, "recent");
const featuredPosts = generateMockPosts(12, "featured");
const followingPosts = generateMockPosts(10, "following");

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(post.isSaved);
  const [likeCount, setLikeCount] = useState(post.likes);
  
  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };
  
  const handleSave = () => {
    setSaved(!saved);
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };
  
  return (
    <Card className="w-[340px] bg-card border-white/10 hover:border-primary/30 transition-all overflow-hidden flex-shrink-0">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`px-2 py-0.5 font-mono text-xs ${post.isPositive ? "bg-green-950/60 text-green-400 border-green-800/50" : "bg-red-950/60 text-red-400 border-red-800/50"}`}
            >
              {post.ticker} {post.tickerChange}
            </Badge>
            {post.chartType === "line" && <LineChart className="h-3 w-3 text-muted-foreground" />}
            {post.chartType === "bar" && <BarChart2 className="h-3 w-3 text-muted-foreground" />}
            {post.chartType === "area" && <TrendingUp className="h-3 w-3 text-muted-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground">{post.timestamp}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 overflow-hidden">
        <div className="rounded-md overflow-hidden mb-2 border border-white/10">
          <img
            src={post.chartImage}
            alt={`${post.ticker} chart`}
            className="w-full h-[180px] object-cover bg-black/40"
          />
        </div>
        <p className="text-sm line-clamp-2">{post.caption}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex flex-col">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs ${liked ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
              <span>{formatNumber(likeCount)}</span>
            </button>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>{formatNumber(post.comments)}</span>
            </button>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`${saved ? "text-yellow-400" : "text-muted-foreground"} hover:text-yellow-400 transition-colors`}
          >
            <BookmarkIcon className={`h-4 w-4 ${saved ? "fill-yellow-400" : ""}`} />
          </button>
        </div>
        <div className="flex items-center mt-2">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={post.userImage} />
            <AvatarFallback>{post.userInitials}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">@{post.username}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

const PostRow: React.FC<{ title: string; posts: Post[] }> = ({ title, posts }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
          View All
        </Button>
      </div>
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default function Social() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Social Feed">
      <div className="p-6">
        <div className="flex items-center mb-8 space-x-4">
          <div className="bg-primary/20 p-3 rounded-lg">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Social Feed</h1>
        </div>

        <PostRow title="Recent Posts" posts={recentPosts} />
        <PostRow title="Featured Posts" posts={featuredPosts} />
        <PostRow title="From People You Follow" posts={followingPosts} />
      </div>
    </DashboardLayout>
  );
}