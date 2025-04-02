"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, BarChart2, TrendingUp, PieChart, 
  Zap, ChevronRight, Brain, AlignLeft, Bot, 
  LineChart, BarChart, Activity, Code, Sigma, Settings
} from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#030822] text-foreground min-h-screen relative overflow-hidden">
      {/* Cyberpunk grid background effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#030822] opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-orange-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNDI4M2UiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRIMHY2aDM2di02em0wLTEwSDB2NEgzNnYtNHptMC0xMEgwdjRIMzZ2LTR6TTY2IDM0SDQydjZoMjR2LTZ6bTAtMTBINDJ2NGgyNHYtNHptMC0xMEg0MnY0aDI0di00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
      </div>
      
      {/* Digital circuit lines */}
      <div className="absolute top-0 bottom-0 left-1/4 w-px bg-gradient-to-b from-orange-500/0 via-orange-500/40 to-orange-500/0 z-0"></div>
      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-gradient-to-b from-red-700/0 via-red-700/30 to-red-700/0 z-0"></div>
      <div className="absolute left-0 right-0 top-1/3 h-px bg-gradient-to-r from-orange-600/0 via-orange-600/30 to-orange-600/0 z-0"></div>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-2 pb-0 z-10 bg-[#030822]">
        <div className="container mx-auto px-4 relative">
          <nav className="flex justify-between items-center mb-0 mt-2">
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-orange-400 transition-colors">Features</a>
              <a href="#tools" className="text-muted-foreground hover:text-orange-400 transition-colors">Tools</a>
              <a href="#brain" className="text-muted-foreground hover:text-orange-400 transition-colors">AI Brain</a>
              <a onClick={() => navigate("/blog")} className="text-muted-foreground hover:text-orange-400 transition-colors cursor-pointer">Blog</a>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <div className="w-96 h-48 relative flex items-center justify-center">
                <img 
                  src="https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/DESIGN THREAD (39).png" 
                  alt="TradeCanvas Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
            <div className="flex space-x-4 items-center">
              <a onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-orange-400 transition-colors cursor-pointer">JOIN FREE</a>
              <button 
                onClick={() => navigate("/dashboard")} 
                className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-medium px-6 py-2 rounded-md transition-all flex items-center relative group overflow-hidden"
              >
                <span className="relative z-10 flex items-center">LOG IN <ArrowRight className="ml-2 h-4 w-4" /></span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
              </button>
            </div>
          </nav>
          
          {/* Full-width hero image */}
          <div className="relative overflow-hidden rounded-xl -mt-12 mb-16 border border-orange-500/30 shadow-xl shadow-orange-500/10">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 z-10"></div>
            <img 
              src="/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/Screenshot 2025-03-07 185934.jpg" 
              alt="Cyberpunk Trading Desk" 
              className="w-full object-cover" 
            />
            
            {/* Content overlay */}
            {/* Left side content */}
            <div className="absolute bottom-4 left-0 p-8 z-20">
              <div className="flex items-center h-full">
                <div className="inline-block px-6 py-3 bg-orange-500/20 border border-orange-500/40 rounded-full text-base md:text-lg font-medium text-orange-400">
                  The Ultimate Trading Companion
                </div>
              </div>
            </div>
            
            {/* Right side content */}
            <div className="absolute bottom-0 right-0 p-6 z-20">
              <div className="max-w-xl ml-auto text-right">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
                  Advanced <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Trading Intelligence</span>
                </h1>
                <p className="text-white/80 text-base md:text-lg max-w-md ml-auto mb-4 whitespace-nowrap">
                  Unleash the power of personalized AI that evolves with you.
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                  <h3 className="text-lg font-medium mb-1">Market Coverage</h3>
                  <div className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">98%</div>
                  <p className="text-muted-foreground">Global exchanges tracked and analyzed</p>
                </div>
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                  <h3 className="text-lg font-medium mb-1">Data Accuracy</h3>
                  <div className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">99.9%</div>
                  <p className="text-muted-foreground">Historical data consistency verified</p>
                </div>
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                  <h3 className="text-lg font-medium mb-1">Customer Rating</h3>
                  <div className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">4.9/5</div>
                  <p className="text-muted-foreground">Based on professional trader feedback</p>
                </div>
              </div>
        </div>
      </header>
      
      {/* Features Section */}
      <section id="features" className="py-20 relative z-10 bg-[#030822]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030822] via-card/30 to-[#030822] -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-sm font-medium text-red-500 mb-4">
              Enhanced Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Next-Gen Trading <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Features</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Break through market noise with advanced tools designed for professional traders and algorithmic precision.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 group">
              <div className="relative">
                <div className="bg-orange-500/20 p-3 rounded-full w-fit mb-4 group-hover:bg-orange-500/30 transition-colors">
                  <BarChart2 className="h-6 w-6 text-orange-400" />
                </div>
                <div className="absolute -inset-4 bg-orange-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">TED AI Assistant</h3>
              <p className="text-muted-foreground">
                Your personal trading companion powered by AI that learns from your strategy and provides market insights tailored to your trading style.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-red-600/50 transition-all hover:shadow-lg hover:shadow-red-600/10 group">
              <div className="relative">
                <div className="bg-red-600/20 p-3 rounded-full w-fit mb-4 group-hover:bg-red-600/30 transition-colors">
                  <Brain className="h-6 w-6 text-red-500" />
                </div>
                <div className="absolute -inset-4 bg-red-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors">Personal Knowledge Brain</h3>
              <p className="text-muted-foreground">
                Custom RAG system that remembers your critical insights, analysis, and strategies, creating a truly personalized trading intelligence.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-red-800/50 transition-all hover:shadow-lg hover:shadow-red-800/10 group">
              <div className="relative">
                <div className="bg-red-800/20 p-3 rounded-full w-fit mb-4 group-hover:bg-red-800/30 transition-colors">
                  <Activity className="h-6 w-6 text-red-400" />
                </div>
                <div className="absolute -inset-4 bg-red-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">Options Analytics</h3>
              <p className="text-muted-foreground">
                Professional-grade options chain visualization with Greeks data, volatility analysis, and option strategy modeling tools.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Brain Section */}
      <section id="brain" className="py-20 relative z-10 bg-[#030822]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030822] via-[#030822] to-[#030822] -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 relative order-2 md:order-1">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-1000"></div>
                <div className="relative bg-card rounded-xl overflow-hidden shadow-2xl border border-white/10">
                  <img 
                    src="/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/piclumen-1741397201580.png" 
                    alt="AI Trading Assistant" 
                    className="w-full h-auto" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                </div>
              </div>
              
              {/* Floating data points */}
              <div className="absolute -bottom-4 -right-4 bg-card/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-red-600/30 hidden md:block">
                <div className="text-xs font-medium">Knowledge Entries: <span className="text-red-500">256</span></div>
              </div>
            </div>
            
            <div className="md:w-1/2 space-y-6 order-1 md:order-2">
              <div className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-sm font-medium text-red-500 mb-4">
                Personalized Intelligence
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Trading Brain</span> Evolves With You
              </h2>
              <p className="text-muted-foreground text-lg">
                Our innovative RAG (Retrieval Augmented Generation) system creates a personal knowledge repository that grows, adapts and evolves with you as a trader to be the ultimate trading companion.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <div className="bg-red-600/20 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <AlignLeft className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Save Critical Insights</h3>
                    <p className="text-muted-foreground">Store key market analysis, patterns, and trading notes directly from TED AI.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">AI-Enhanced Recall</h3>
                    <p className="text-muted-foreground">TED AI references your knowledge brain to provide hyper-personalized recommendations.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-red-800/20 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <Code className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Algorithmic Integration</h3>
                    <p className="text-muted-foreground">Your knowledge connects with market data for smarter, context-aware analysis.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-orange-800/20 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Live AI Chart Analysis</h3>
                    <p className="text-muted-foreground">Real-time AI stream watches charts with you, providing instant analysis and trading behavior feedback.</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate("/ted-ai")} 
                className="mt-4 inline-flex items-center bg-red-600/10 hover:bg-red-600/20 text-red-500 px-4 py-2 rounded-md transition-colors"
              >
                <Brain className="mr-2 h-4 w-4" />
                Explore the AI Brain
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tools Grid Section */}
      <section id="tools" className="py-20 relative z-10 bg-[#030822]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030822] via-card/30 to-[#030822] -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm font-medium text-orange-400 mb-4">
              Precision Instruments
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Trading Tools</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Execute with surgical precision using our suite of advanced analytics and decision support tools.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <BarChart2 />, name: "Technical Analysis", path: "/dashboard" },
              { icon: <LineChart />, name: "Advanced Chart Toolbar", path: "/amcharts", highlight: true, special: true, accent: true },
              { icon: <Brain />, name: "TED AI", path: "/ted-ai" },
              { icon: <PieChart />, name: "Portfolio Manager", path: "/dashboard" },
              { icon: <Brain />, name: "Knowledge Brain", path: "/ted-ai" },
              { icon: <Sigma />, name: "Risk Calculator", path: "/dashboard" },
              { icon: <Settings />, name: "Strategy Builder", path: "/dashboard" },
            ].map((tool, index) => (
              <div 
                key={index} 
                className={`bg-card/60 backdrop-blur-sm p-6 rounded-xl border ${tool.highlight ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-white/10'} ${tool.special ? 'transform scale-110 z-10' : ''} ${tool.accent ? 'border-red-500 shadow-lg shadow-red-500/20' : ''} hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all text-center cursor-pointer group`} 
                onClick={() => navigate(tool.path)}
              >
                <div className="relative">
                  <div className={`${tool.highlight && !tool.accent ? 'bg-orange-500/20' : tool.accent ? 'bg-red-500/20' : 'bg-card/80'} p-4 rounded-full w-fit mx-auto mb-4 ${tool.accent ? 'group-hover:bg-red-500/20' : 'group-hover:bg-orange-500/20'} transition-colors`}>
                    {React.cloneElement(tool.icon, { className: `h-6 w-6 ${tool.special ? 'text-red-400' : 'text-orange-400'}` })}
                  </div>
                  <div className="absolute -inset-4 bg-orange-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                </div>
                <h3 className={`text-lg font-medium group-hover:${tool.accent ? 'text-red-400' : 'text-orange-400'} transition-colors`}>{tool.name}</h3>
                {tool.highlight && <p className={`text-xs ${tool.accent ? 'text-red-400' : 'text-orange-400'} mt-1`}>{tool.special ? 'Pro Trading Toolbar' : 'New Feature'}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-600/10 to-red-800/10 -z-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNDI4M2UiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRIMHY2aDM2di02em0wLTEwSDB2NEgzNnYtNHptMC0xMEgwdjRIMzZ2LTR6TTY2IDM0SDQydjZoMjR2LTZ6bTAtMTBINDJ2NGgyNHYtNHptMC0xMEg0MnY0aDI0di00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-5 -z-10"></div>
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block px-3 py-1 bg-red-800/10 border border-red-800/30 rounded-full text-sm font-medium text-red-400 mb-4">
            Upgrade Your Trading
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Dominate</span> the Markets?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Join the elite traders who leverage AI-enhanced intelligence and advanced analysis to maintain their edge in any market condition.
          </p>
          <div className="max-w-md mx-auto backdrop-blur-sm bg-card/40 p-8 rounded-xl border border-white/10 mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-500/50"></div>
              <div className="font-bold text-sm uppercase tracking-wider text-orange-400">Trade Canvas</div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-500/50"></div>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3 text-left">
                <div className="h-5 w-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-orange-400" />
                </div>
                <div className="text-sm">Advanced AI Trading Assistant</div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-cyan-400" />
                </div>
                <div className="text-sm">Custom Knowledge Brain Technology</div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-cyan-400" />
                </div>
                <div className="text-sm">Professional Options Analysis</div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-cyan-400" />
                </div>
                <div className="text-sm">Real-Time Market Analytics</div>
              </div>
            </div>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-medium py-3 rounded-md transition-all flex items-center justify-center group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">Enter The Canvas <ChevronRight className="ml-2 h-5 w-5" /></span>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
            </button>
          </div>
          <p className="text-muted-foreground text-sm">No credit card required • Premium features available</p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-[#030822] py-12 relative z-10 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-80 h-40 relative flex items-center justify-center">
                <img 
                  src="https://static.databutton.com/public/dbfccf03-e7fd-4b3c-a8ba-fc0fe754247d/DESIGN THREAD (39).png" 
                  alt="TradeCanvas Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-orange-400 transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-orange-400 transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-orange-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8">
            <p className="text-muted-foreground text-center">© 2025 Trade Canvas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}