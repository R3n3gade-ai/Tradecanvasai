"use client";

import React, { useState } from "react";
import { Trophy, ChevronLeft, Search, Clock, CalendarDays, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PercentageChange } from "../components/PercentageChange";

// Mock data for the leaderboard
const topTraders = [
  { 
    rank: 1, 
    name: "Fridged", 
    id: "0x11473aa...f14BDF", 
    verified: true, 
    totalPoints: 3485, 
    posts: 113, 
    coursesCompleted: 15, 
    brainItems: 89, 
    referrals: 8, 
    likes: 457,
    replies: 93,
    tournamentFinishes: 4
  },
  { 
    rank: 2, 
    name: "Mantle Farm", 
    id: "0xC9344C8...FE89E9", 
    verified: true, 
    totalPoints: 2180, 
    posts: 144, 
    coursesCompleted: 12, 
    brainItems: 62, 
    referrals: 3, 
    likes: 289,
    replies: 64,
    tournamentFinishes: 2
  },
  { 
    rank: 3, 
    name: "Ninja", 
    id: "0xD611D55...809B845", 
    verified: true, 
    totalPoints: 1459, 
    posts: 82, 
    coursesCompleted: 18, 
    brainItems: 103, 
    referrals: 4, 
    likes: 341,
    replies: 76,
    tournamentFinishes: 5
  },
  { 
    rank: 4, 
    name: "Ace", 
    id: "0x5157CCA...1F9aE4d", 
    verified: true, 
    totalPoints: 1260, 
    posts: 76, 
    coursesCompleted: 8, 
    brainItems: 54, 
    referrals: 7, 
    likes: 204,
    replies: 58,
    tournamentFinishes: 3
  },
  { 
    rank: 5, 
    name: "Bin4", 
    id: "0xE7108.3D...D84B914", 
    verified: false, 
    totalPoints: 1187, 
    posts: 65, 
    coursesCompleted: 10, 
    brainItems: 42, 
    referrals: 2, 
    likes: 176,
    replies: 43,
    tournamentFinishes: 1
  },
  { 
    rank: 6, 
    name: "OzNoFacez", 
    id: "0x86C311B...7162d1B", 
    verified: true, 
    totalPoints: 971, 
    posts: 51, 
    coursesCompleted: 7, 
    brainItems: 38, 
    referrals: 5, 
    likes: 142,
    replies: 31,
    tournamentFinishes: 0
  },
  { 
    rank: 7, 
    name: "AntElectron", 
    id: "0x2366F3e1...F289JEF", 
    verified: false, 
    totalPoints: 836, 
    posts: 43, 
    coursesCompleted: 5, 
    brainItems: 67, 
    referrals: 1, 
    likes: 98,
    replies: 25,
    tournamentFinishes: 2
  },
  { 
    rank: 8, 
    name: "Avatarr", 
    id: "0x3eBabaB...7AD834", 
    verified: true, 
    totalPoints: 774, 
    posts: 59, 
    coursesCompleted: 3, 
    brainItems: 42, 
    referrals: 3, 
    likes: 119,
    replies: 47,
    tournamentFinishes: 1
  },
  { 
    rank: 9, 
    name: "LP3", 
    id: "0x57D0e12...824C110", 
    verified: true, 
    totalPoints: 728, 
    posts: 36, 
    coursesCompleted: 9, 
    brainItems: 51, 
    referrals: 0, 
    likes: 87,
    replies: 29,
    tournamentFinishes: 0
  },
  { 
    rank: 10, 
    name: "immstock1", 
    id: "0x992ze21...64D3e37", 
    verified: true, 
    totalPoints: 683, 
    posts: 41, 
    coursesCompleted: 6, 
    brainItems: 34, 
    referrals: 2, 
    likes: 102,
    replies: 38,
    tournamentFinishes: 1
  },
];

// Mock data for tournaments
const upcomingTournaments = [
  {
    id: 1,
    name: "Summer Crypto Challenge 2025",
    startDate: "2025-06-01",
    endDate: "2025-06-30",
    entryFee: "50 USDT",
    prizePool: "$25,000",
    participants: 0,
    maxParticipants: 500,
    status: "registration",
    description: "30-day challenge focused on crypto trading with daily performance metrics."
  },
  {
    id: 2,
    name: "Options Masters Tournament",
    startDate: "2025-05-15",
    endDate: "2025-05-22",
    entryFee: "100 USDT",
    prizePool: "$50,000",
    participants: 124,
    maxParticipants: 250,
    status: "registration",
    description: "Intensive 1-week options trading challenge for experienced traders."
  },
  {
    id: 3,
    name: "Futures Flash Challenge",
    startDate: "2025-04-28",
    endDate: "2025-04-30",
    entryFee: "25 USDT",
    prizePool: "$10,000",
    participants: 356,
    maxParticipants: 1000,
    status: "registration",
    description: "72-hour futures trading sprint with hourly performance updates."
  },
];

const pastTournaments = [
  {
    id: 101,
    name: "Spring Equity Championship",
    startDate: "2025-03-01",
    endDate: "2025-03-31",
    participants: 437,
    prizePool: "$40,000",
    winner: "Ninja",
    runnerUps: ["Fridged", "Mantle Farm"],
    status: "completed",
    winningReturn: 28.7,
  },
  {
    id: 102,
    name: "Forex Marathon 2025",
    startDate: "2025-02-15",
    endDate: "2025-02-28",
    participants: 256,
    prizePool: "$30,000",
    winner: "LP3",
    runnerUps: ["OzNoFacez", "Avatarr"],
    status: "completed",
    winningReturn: 19.3,
  },
  {
    id: 103,
    name: "Winter Crypto Invitational",
    startDate: "2025-01-10",
    endDate: "2025-01-17",
    participants: 128,
    prizePool: "$75,000",
    winner: "Fridged",
    runnerUps: ["Ace", "immstock1"],
    status: "completed",
    winningReturn: 34.2,
  },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Weekly");
  const [sortBy, setSortBy] = useState("rank"); // Default sort by rank
  const [sortDirection, setSortDirection] = useState("asc"); // asc or desc
  
  // Function to handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };
  
  // Helper to render sort indicator
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
  };
  
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-primary mb-8 hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trading</p>
              <h1 className="text-3xl font-bold">Leaderboard / Tournaments</h1>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="mb-6 bg-background border border-white/10">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary/10">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="data-[state=active]:bg-primary/10">
              Tournaments
            </TabsTrigger>
          </TabsList>
          
          {/* Leaderboard Tab Content */}
          <TabsContent value="leaderboard" className="mt-0">
            <div className="flex justify-between mb-6">
              <div className="flex gap-2">
                {["Weekly", "Monthly", "Overall"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeFilter(period)}
                    className={`px-4 py-1.5 rounded-md text-sm ${timeFilter === period ? 'bg-primary/20 text-primary' : 'bg-card text-muted-foreground hover:bg-card/70'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search traders" 
                  className="pl-9 w-[300px] bg-card border-white/10 focus-visible:ring-primary"
                />
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-background/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('rank')} className="flex items-center">
                          Rank
                          {renderSortIcon('rank')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('trader')} className="flex items-center">
                          Trader
                          {renderSortIcon('trader')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('totalPoints')} className="flex items-center">
                          Total Points
                          {renderSortIcon('totalPoints')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('posts')} className="flex items-center">
                          Posts
                          {renderSortIcon('posts')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('coursesCompleted')} className="flex items-center">
                          Courses
                          {renderSortIcon('coursesCompleted')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('brainItems')} className="flex items-center">
                          Brain Items
                          {renderSortIcon('brainItems')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('referrals')} className="flex items-center">
                          Referrals
                          {renderSortIcon('referrals')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('likes')} className="flex items-center">
                          Likes
                          {renderSortIcon('likes')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => handleSort('tournamentFinishes')} className="flex items-center">
                          Tournament Finishes
                          {renderSortIcon('tournamentFinishes')}
                        </button>
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topTraders.map((trader) => (
                      <tr key={trader.rank} className="hover:bg-background/40 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {trader.rank <= 3 ? (
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 mr-2">
                                <Trophy className={`h-4 w-4 ${trader.rank === 1 ? 'text-yellow-500' : trader.rank === 2 ? 'text-gray-400' : 'text-amber-700'}`} />
                              </div>
                            ) : (
                              <div className="w-7 text-center mr-2">{trader.rank < 10 ? `0${trader.rank}` : trader.rank}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              {trader.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium flex items-center">
                                {trader.name}
                                {trader.verified && (
                                  <span className="ml-1 text-primary text-xs">✓</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{trader.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-medium text-primary">
                          {trader.totalPoints.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {trader.posts}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {trader.coursesCompleted}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {trader.brainItems}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {trader.referrals}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {trader.likes}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {trader.tournamentFinishes}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button className="px-3 py-1 text-xs rounded-md bg-background hover:bg-background/80 text-primary border border-white/10">
                            Subscribe
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          {/* Tournaments Tab Content */}
          <TabsContent value="tournaments" className="mt-0">
            <div className="space-y-8">
              {/* Upcoming Tournaments Section */}
              <div>
                <div className="flex items-center mb-4 gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Upcoming Tournaments</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingTournaments.map((tournament) => (
                    <div 
                      key={tournament.id} 
                      className="bg-card rounded-lg border border-white/10 p-5 hover:border-primary/40 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">{tournament.name}</h3>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                          {tournament.status === 'registration' ? 'Registration Open' : tournament.status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-4">
                        {tournament.description}
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dates:</span>
                          <span>{new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <span>{tournament.entryFee}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Prize Pool:</span>
                          <span className="font-medium text-primary">{tournament.prizePool}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Participants:</span>
                          <span>{tournament.participants}/{tournament.maxParticipants}</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {Math.ceil((new Date(tournament.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until start
                        </div>
                        <button className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90">
                          Register
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Past Tournaments Section */}
              <div>
                <div className="flex items-center mb-4 gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Past Tournaments</h2>
                </div>
                
                <div className="bg-card rounded-lg border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-background/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tournament
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Prize Pool
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Winner
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Return
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pastTournaments.map((tournament) => (
                        <tr key={tournament.id} className="hover:bg-background/40 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium">{tournament.name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {tournament.participants}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            {tournament.prizePool}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-xs">
                                {tournament.winner.charAt(0)}
                              </div>
                              <span>{tournament.winner}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center text-green-500">
                              <ArrowUp className="h-3 w-3 mr-1" />
                              {tournament.winningReturn}%
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <button className="px-3 py-1 text-xs rounded-md bg-background hover:bg-background/80 text-primary border border-white/10">
                              View Results
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
