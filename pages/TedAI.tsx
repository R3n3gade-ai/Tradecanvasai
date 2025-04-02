"use client";

// Force refresh - fixed sidebarOpen issue

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { 
  Zap, ChevronLeft, Send, Mic, ChevronDown, Clock, Star, 
  Link, BarChart2, LineChart, Settings, Trash2, X, BookOpen,
  Maximize2, PanelLeft, Download, History, HelpCircle, User,
  Brain, Image as ImageIcon, UploadCloud, Bot, Plus
} from "lucide-react";
import ChartUploader from "components/ChartUploader";
import { AddToBrain } from "components/AddToBrain";
import { useBrainStore } from "utils/brainStore";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TedAISampleQueries } from "components/TedAISampleQueries";

import { Message, Attachment, Conversation } from "utils/tedAITypes";
import { useTedAIStore } from "utils/tedAIStore";

// Sample conversation history - only used as fallback if store loading fails
const sampleMessages: Message[] = [
  {
    id: '1',
    type: 'user',
    content: 'Can you analyze the current market trends for technology stocks?',
    timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
  },
  {
    id: '2',
    type: 'ai',
    content: 'Based on the latest market data, technology stocks are showing mixed signals. The Nasdaq Composite is up 0.8% today, but there\'s significant sector rotation happening. Here\'s a breakdown:\n\n- Semiconductor stocks are outperforming, with NVDA up 3.2% and AMD up 2.7%\n- Cloud service providers are seeing pressure with modest declines\n- Cybersecurity firms are rallying on increased enterprise spending\n\nWould you like me to analyze any specific technology stock or subsector in more detail?',
    timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    attachments: [
      {
        type: 'chart',
        preview: 'https://picsum.photos/id/237/300/150',
        title: 'Technology Sector Performance (7 Days)',
      },
    ],
  },
  {
    id: '3',
    type: 'user',
    content: 'Tell me more about NVDA. Do you think it\'s a good buy right now?',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '4',
    type: 'ai',
    content: 'NVIDIA (NVDA) is showing strong momentum with several positive catalysts:\n\n• Technical Analysis: Trading above all major moving averages with a relative strength index of 68 (approaching overbought territory at 70)\n\n• Fundamentals: Forward P/E of 36.2, which is high but supported by projected earnings growth of 53% next year\n\n• Catalyst: AI chip demand continues to outpace supply, with their H100 and upcoming H200 chips seeing record orders\n\n• Institutional Activity: 15% increase in institutional holdings last quarter\n\nWhile NVDA has strong growth prospects, there are risks to consider:\n\n• Valuation is stretched by historical standards\n• Potential regulatory concerns around AI chip exports\n• High expectations already priced in\n\nBased on your trading history, you typically prefer growth at reasonable price. Given NVDA\'s current momentum but high valuation, you might consider a modified DCA (dollar-cost averaging) approach rather than a full position.\n\nWould you like to see technical levels for potential entry points?',
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    attachments: [
      {
        type: 'chart',
        preview: 'https://picsum.photos/id/22/300/150',
        title: 'NVDA 3-Month Price Chart',
      },
      {
        type: 'link',
        title: 'Latest NVDA Analyst Reports',
        url: '#',
      },
    ],
  },
];

// Removed suggested commands section

// Removed the capability tags list
// const aiCapabilities = [...] array definition removed

export default function TedAI() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showChartUploader, setShowChartUploader] = useState(false);
  
  // Get TED AI store state
  const { 
    currentConversationId, 
    conversations, 
    conversationList,
    isLoading, 
    isStreaming,
    streamingMessage,
    error,
    showSidebar,
    userSettings,
    sendMessage,
    streamMessage,
    startNewConversation,
    fetchConversations,
    fetchConversation,
    toggleSidebar,
    setUserSettings
  } = useTedAIStore();
  
  // Get brain store for checking status
  const { recentItems: recentBrainItems } = useBrainStore();

  // Get current conversation messages
  const currentConversation = currentConversationId 
    ? conversations[currentConversationId] 
    : null;
  
  const messages = currentConversation?.messages || [];
  
  // Init: Fetch conversations and start new one if needed
  useEffect(() => {
    fetchConversations().then(() => {
      // If no current conversation, start a new one
      if (!currentConversationId) {
        startNewConversation();
      }
    });
  }, []);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Add a conversation to the brain
  const handleAddConversationToBrain = (conversationId: string) => {
    const conversation = conversations[conversationId];
    if (!conversation) {
      toast.error("Conversation not found");
      return;
    }
    
    // Get all the messages from the conversation
    const messages = conversation.messages;
    
    // Extract the text from all messages
    let messageTexts = messages.map(message => {
      return `${message.type === 'user' ? 'User' : 'TED AI'}: ${message.content}`;
    }).join('\n\n');
    
    const title = conversation.title || 'Conversation';
    const content = `# ${title}\n\n${messageTexts}`;
    
    // Add to brain using the brain store
    try {
      useBrainStore.getState().addToTedBrain(
        content, 
        'ted-ai-conversation',
        { 
          conversationId,
          title,
          timestamp: new Date().toISOString(),
          messageCount: messages.length
        }
      ).then(() => {
        toast.success("Conversation added to brain!");
      });
    } catch (error) {
      console.error("Error adding conversation to brain:", error);
      toast.error("Failed to add conversation to brain");
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;
    
    // Check for chart analysis commands
    const chartAnalysisKeywords = [
      "analyze chart", "chart analysis", "analyze image", 
      "analyze trading chart", "read this chart", "what do you see in this chart", 
      "interpret chart", "technical analysis"
    ];
    
    const isChartAnalysisRequest = chartAnalysisKeywords.some(keyword => 
      inputValue.toLowerCase().includes(keyword)
    );
    
    if (isChartAnalysisRequest) {
      // Store the query for when the chart is uploaded
      setShowChartUploader(true);
      // Don't clear input yet so user still sees their request
      return;
    }
    
    try {
      // Check for specific stock keywords for direct symbol analysis
      const stockSymbolRegex = /\b[A-Z]{1,5}\b/g;
      const matches = inputValue.match(stockSymbolRegex);
      
      if (matches && (inputValue.toLowerCase().includes("analyze") || 
          inputValue.toLowerCase().includes("price") || 
          inputValue.toLowerCase().includes("stock") || 
          inputValue.toLowerCase().includes("data"))) {
        // If requesting stock analysis, make sure market data is included
        if (!userSettings.includeMarketData) {
          setUserSettings({ includeMarketData: true });
        }
      }
      
      // Clear input immediately for better UX
      const messageText = inputValue;
      setInputValue("");
      
      // Use streaming for better UX
      await streamMessage(messageText);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // Handle textarea resize and submit with Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple, robust implementation that avoids any store manipulation issues
  const handleChartAnalysisComplete = (analysis) => {
    console.log('Chart analysis handler running with new implementation');
    
    // Close the uploader
    setShowChartUploader(false);
    
    try {
      // Create a user message based on input or default
      const userMessage = inputValue.trim() !== "" ? 
        inputValue : 
        `Analyze this chart${analysis.chart_symbol ? ` of ${analysis.chart_symbol}` : ''}`;
      
      // Clear the input field
      setInputValue("");
      
      // Format the analysis content with additional insights
      let enhancedAnalysisContent = analysis.analysis || "Analysis not available";
      
      // Add structured insights if available
      if (analysis.identified_patterns?.length || analysis.support_levels?.length || analysis.resistance_levels?.length) {
        enhancedAnalysisContent += "\n\nKey Insights:";
        
        if (analysis.identified_patterns?.length) {
          enhancedAnalysisContent += "\n• Patterns: " + analysis.identified_patterns.join(", ");
        }
        
        if (analysis.support_levels?.length) {
          enhancedAnalysisContent += "\n• Support Levels: " + analysis.support_levels.map(l => typeof l === 'number' ? l.toFixed(2) : l).join(", ");
        }
        
        if (analysis.resistance_levels?.length) {
          enhancedAnalysisContent += "\n• Resistance Levels: " + analysis.resistance_levels.map(l => typeof l === 'number' ? l.toFixed(2) : l).join(", ");
        }
        
        if (analysis.possible_scenarios?.length) {
          enhancedAnalysisContent += "\n\nPossible Scenarios:";
          analysis.possible_scenarios.forEach(scenario => {
            enhancedAnalysisContent += "\n• " + scenario;
          });
        }
      }
      
      // Get the current conversation ID or create one if needed
      let conversationId = currentConversationId;
      if (!conversationId) {
        // No active conversation, need to create one first
        const newId = `new-${Date.now()}`;
        conversationId = newId;
        
        // Initialize the new conversation
        const newConversation = {
          id: newId,
          title: 'Chart Analysis',
          messages: [
            {
              id: `welcome-${Date.now()}`,
              type: 'ai',
              content: 'Hello! I\'m TED, your Trading and Evaluation Director. I\'ll analyze your chart.',
              timestamp: new Date().toISOString(),
            }
          ],
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        };
        
        // Create the new conversation
        useTedAIStore.setState(state => ({
          conversations: {
            ...state.conversations,
            [newId]: newConversation
          },
          currentConversationId: newId,
          // Also add to conversation list
          conversationList: [
            { 
              id: newId, 
              title: 'Chart Analysis', 
              timestamp: new Date().toISOString() 
            },
            ...state.conversationList
          ]
        }));
      }
      
      // Create user message object
      const userMessageObj = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      
      // Create AI response object with the analysis
      const aiMessageObj = {
        id: `ai-${Date.now() + 1}`,
        type: 'ai',
        content: enhancedAnalysisContent,
        timestamp: new Date().toISOString(),
        attachments: [
          {
            type: 'chart',
            title: `Chart Analysis${analysis.chart_symbol ? ` - ${analysis.chart_symbol}` : ''}`,
            preview: 'https://picsum.photos/id/237/300/150',
          }
        ]
      };
      
      // Add the messages to the conversation
      useTedAIStore.setState(state => {
        // Get the current conversation
        const conversation = state.conversations[conversationId];
        if (!conversation) return state; // Safety check
        
        // Add the messages to the conversation
        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: [...conversation.messages, userMessageObj, aiMessageObj],
              last_updated: new Date().toISOString()
            }
          }
        };
      });
      
      // Scroll to bottom to show new messages
      setTimeout(scrollToBottom, 100);
      
      toast.success("Chart analysis complete!");
    } catch (error) {
      console.error("Error processing chart analysis:", error);
      toast.error("Failed to process chart analysis");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Create a new chat
  const handleNewChat = () => {
    startNewConversation();
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Notifications */}
      <Toaster position="top-center" richColors />
      {/* Chat history sidebar */}
      {showSidebar && (
        <aside className="w-80 border-r border-white/10 flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <button 
              onClick={handleNewChat}
              className="w-full py-2 px-4 bg-primary text-background rounded-md hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 flex justify-between items-center">
              <span>Recent Conversations</span>
              <button className="text-primary hover:text-primary/80" title="Add conversation">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {conversationList.map(chat => (
              <div 
                key={chat.id}
                className={`w-full text-left rounded-md hover:bg-card/60 mb-0.5 flex items-start ${currentConversationId === chat.id ? 'bg-card' : ''}`}
              >
                <button 
                  onClick={() => fetchConversation(chat.id)}
                  className="flex-1 p-2 flex items-start gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium truncate text-sm">{chat.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </button>
                <button 
                  className="p-1.5 text-muted-foreground hover:text-primary" 
                  title="Add to brain"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddConversationToBrain(chat.id);
                  }}
                >
                  <Brain className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 mt-3 flex justify-between items-center">
              <span>Saved Conversations</span>
              <button className="text-primary hover:text-primary/80" title="Add saved conversation">
                <Star className="h-3.5 w-3.5" />
              </button>
            </div>
            <div 
              className="w-full text-left rounded-md hover:bg-card/60 mb-0.5 flex items-start"
            >
              <button className="flex-1 p-2 flex items-start gap-2">
                <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium truncate text-sm">Key Market Levels 2025</div>
                  <div className="text-xs text-muted-foreground">
                    Saved on Mar 3, 2025
                  </div>
                </div>
              </button>
              <button className="p-1.5 text-muted-foreground hover:text-primary" title="Remove from saved">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          {recentBrainItems.length > 0 && (
            <div className="p-3 border-t border-white/10 flex flex-col space-y-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{recentBrainItems.length}</span> item{recentBrainItems.length !== 1 ? 's' : ''} in your knowledge brain
              </div>
              <button 
                className="w-full flex gap-2 items-center justify-center text-xs bg-primary/10 hover:bg-primary/20 text-primary py-1.5 px-2 rounded"
                onClick={() => toast.info("Brain management will be available in a future update!")}
              >
                <Brain className="h-3.5 w-3.5" />
                <span>Manage Brain</span>
              </button>
            </div>
          )}
        </aside>
      )}
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chart Uploader */}
        {showChartUploader && (
          <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <ChartUploader 
              onAnalysisComplete={handleChartAnalysisComplete} 
              onCancel={() => setShowChartUploader(false)} 
            />
          </div>
        )}
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              title={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-md hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              title="Back to dashboard"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              TED AI Assistant
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 rounded-md hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              title="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button 
              className="p-2 rounded-md hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              title="History"
            >
              <History className="h-5 w-5" />
            </button>
            <button 
              className="p-2 rounded-md hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {/* Empty State */}
            {currentConversation && currentConversation.messages.length <= 1 && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 relative z-0">
                <Bot className="h-16 w-16 text-primary/50" />
                <h2 className="text-2xl font-bold">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask me about market analysis, technical patterns, options flow, dark pool activity, 
                  or upload a chart for analysis.
                </p>
                
                {/* Sample Queries */}
                <div className="w-full max-w-md mt-4">
                  <TedAISampleQueries />
                  
                  {/* Advanced Charts Button */}
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 border-white/10"
                      onClick={() => navigate('/advanced-charts')}
                    >
                      <BarChart2 className="h-4 w-4 text-primary" />
                      <span>Open Advanced Chart System</span>
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground text-center">Access pro-level technical analysis charts</p>
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`mb-6 ${message.type === 'user' ? 'flex flex-row-reverse' : 'flex'}`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 ${message.type === 'user' ? 'bg-primary/20 ml-3' : 'bg-primary mr-3'}`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5 text-primary" />
                  ) : (
                    <Zap className="h-5 w-5 text-background" />
                  )}
                </div>
                
                <div className={`flex-1 ${message.type === 'user' ? 'max-w-[80%]' : 'max-w-[90%]'}`}>
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-sm">
                      {message.type === 'user' ? 'You' : 'TED AI'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className={`${message.type === 'user' ? 'bg-primary/10 text-foreground' : 'bg-card text-foreground'} p-4 rounded-lg`}>
                    <div className="whitespace-pre-line">{message.content}</div>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="border border-white/10 rounded overflow-hidden">
                            {attachment.type === 'chart' && attachment.preview && (
                              <div className="flex flex-col">
                                <div className="bg-background/50 p-2 text-xs font-medium border-b border-white/10 flex justify-between items-center">
                                  <span>{attachment.title || 'Chart'}</span>
                                  <div className="flex gap-1">
                                    <AddToBrain 
                                      content={`Chart: ${attachment.title || 'Market Data'}`} 
                                      source="chart-data"
                                      metadata={{
                                        chartTitle: attachment.title,
                                        imageUrl: attachment.preview,
                                        messageId: message.id,
                                        timestamp: message.timestamp.toString()
                                      }}
                                      variant="icon"
                                    />
                                    <button className="p-1 hover:bg-white/10 rounded-sm" title="Maximize">
                                      <Maximize2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button className="p-1 hover:bg-white/10 rounded-sm" title="Download">
                                      <Download className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                  </div>
                                </div>
                                <img 
                                  src={attachment.preview} 
                                  alt={attachment.title || 'Chart'} 
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                            
                            {attachment.type === 'link' && (
                              <a 
                                href={attachment.url || '#'} 
                                className="flex items-center gap-2 p-3 hover:bg-white/5"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Link className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{attachment.title || 'Linked resource'}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.type === 'ai' && (
                    <div className="flex mt-1 gap-2">
                      <AddToBrain 
                        content={message.content} 
                        source="ted-ai-chat" 
                        metadata={{
                          messageId: message.id,
                          hasAttachments: !!message.attachments?.length,
                          timestamp: message.timestamp.toString()
                        }}
                        variant="compact"
                      />
                      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5" title="Copy message">
                        <Download className="h-3 w-3" />
                        Save
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5" title="Copy message">
                        <Star className="h-3 w-3" />
                        Favorite
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5" title="Report issue">
                        <Trash2 className="h-3 w-3" />
                        Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Show streaming message if available */}
            {isStreaming && streamingMessage && (
              <div className="mb-6 flex">
                <div className="rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 bg-primary mr-3">
                  <Zap className="h-5 w-5 text-background" />
                </div>
                
                <div className="flex-1 max-w-[90%]">
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-sm">TED AI</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatTime(new Date().toISOString())}
                    </span>
                  </div>
                  
                  <div className="bg-card text-foreground p-4 rounded-lg">
                    <div className="whitespace-pre-line">{streamingMessage}</div>
                    <div className="inline-block animate-pulse h-4 w-2 bg-primary/40 ml-0.5"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading indicator (when not streaming) */}
            {isLoading && !isStreaming && (
              <div className="flex mb-6">
                <div className="rounded-full h-8 w-8 flex items-center justify-center bg-primary mr-3 relative">
                  <Zap className="h-5 w-5 text-background" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-opacity-20 border-t-primary animate-spin"></div>
                </div>
                <div className="bg-card p-4 rounded-lg max-w-[90%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Suggested commands section removed */}
        
        {/* Input area */}
        <div className="p-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-2">
              <div className="relative flex-grow">
                <textarea
                  ref={inputRef}
                  className="w-full bg-card border border-white/10 rounded-md px-4 py-3 min-h-[44px] max-h-[120px] focus:outline-none focus:border-primary resize-none"
                  placeholder="Ask TED AI about market analysis, trading strategies, or portfolio optimization..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <div className="absolute top-3 right-3">
                  <button 
                    className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    title="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <button 
                className="flex items-center gap-1 px-3 py-3 rounded-md bg-card border border-white/10 hover:bg-card/80 text-primary transition-colors"
                title="Upload chart for analysis"
                onClick={() => setShowChartUploader(true)}
              >
                <UploadCloud className="h-5 w-5" />
              </button>
              
              <button 
                className={`flex items-center justify-center px-3 py-3 rounded-md transition-colors ${inputValue.trim() && !isLoading && !isStreaming ? 'bg-primary text-background' : 'bg-primary/30 text-muted-foreground cursor-not-allowed'}`}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isStreaming}
                title="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              TED AI may display inaccurate info, including about people and securities. Always do your own research.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}