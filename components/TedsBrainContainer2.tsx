"use client";

import React, { useState, useEffect, useRef } from "react";
import { Brain, Link, FileText, UploadCloud, Plus, Settings, Trash2, Search, X, Send, MessageSquare, ChevronDown, ChevronUp, RefreshCw, User, Clock, Image, Film, Folder } from "lucide-react";

import { ImportUrlModal } from "./ImportUrlModal";
import { useBrainStore } from "../utils/brainStore";
import { toast } from "sonner";
import brain from "brain";
import { AddToBrain } from "./AddToBrain";
import { DocumentUploader } from "./DocumentUploader";
import { BrainItem } from "types";
import { BrainResultItem } from "./BrainResultItem";
import { CategoryList } from "./CategoryList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  results?: any[]; // Search results to display with the message
}

interface Props {
  compact?: boolean;
  className?: string;
}

export const TedsBrainContainer2: React.FC<Props> = ({ compact = false, className = "" }) => {
  const { recentItems, queryTedBrain, getBrainStatus, showUrlImportModal, setUrlImportModalOpen } = useBrainStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [refreshCategoryList, setRefreshCategoryList] = useState(0);
  const [brainName, setBrainName] = useState(localStorage.getItem("customBrainName") || "Renegade's brain");
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [brainStatus, setBrainStatus] = useState<{
    total_items: number;
    sources: Record<string, number>;
    size_kb: number;
    last_added: string | null;
  } | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your personal trading companion. Ask me about your trading data, charts, or market insights that you\'ve added to your knowledge base.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getBrainStatus();
        setBrainStatus(status);
      } catch (error) {
        console.error('Error fetching brain status:', error);
      }
    };
    
    fetchStatus();
  }, [getBrainStatus, recentItems.length]);

  // Focus input when editing name
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Save brain name to localStorage when changed
  const saveBrainName = (name: string) => {
    setBrainName(name);
    localStorage.setItem("customBrainName", name);
    setIsEditingName(false);
  };
  
  // Handle sending a chat message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };
    
    // Clear input and add user message
    setInputValue("");
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate AI thinking
    setIsLoading(true);
    
    try {
      // Query the brain for relevant information
      const results = await queryTedBrain(userMessage.content);
      
      // Generate AI response
      let aiResponse = "";
      
      if (results.length > 0) {
        // Check if there are any media results
        const mediaResults = results.filter(item => 
          item.source === "image" || item.source === "video"
        );
        
        const textResults = results.filter(item => 
          item.source !== "image" && item.source !== "video"
        );
        
        if (mediaResults.length > 0) {
          aiResponse = `I found ${results.length} relevant items in your knowledge base, including ${mediaResults.length} media items.`;
        } else {
          aiResponse = `I found ${results.length} relevant items in your knowledge base:`;
          
          // Add first 2 text results to the response
          textResults.slice(0, 2).forEach((item, index) => {
            aiResponse += `\n\n${index + 1}. ${item.content.substring(0, 100)}...`;
          });
        }
      } else {
        aiResponse = "I couldn't find any relevant information in your knowledge base. Try adding more data or refining your question.";
      }
      
      // Add small delay to simulate thinking
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString(),
          results: results.slice(0, 3) // Include top 3 results with the message
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error querying brain:", error);
      setIsLoading(false);
      
      // Add error response
      const errorMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "Sorry, I encountered an error while searching your knowledge base. Please try again later.",
        timestamp: new Date().toISOString(),
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // Handle textarea input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sourceIcons: Record<string, React.ReactNode> = {
    "chart-data": <Brain className="h-3.5 w-3.5" />,
    "ted-ai-chat": <FileText className="h-3.5 w-3.5" />,
    "article": <FileText className="h-3.5 w-3.5" />,
    "user-input": <FileText className="h-3.5 w-3.5" />,
    "url": <Link className="h-3.5 w-3.5" />,
    "document": <FileText className="h-3.5 w-3.5" />,
  };
  
  if (compact) {
    return (
      <div className={`bg-card rounded-lg border border-white/10 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={brainName}
                onChange={(e) => setBrainName(e.target.value)}
                onBlur={() => saveBrainName(brainName)}
                onKeyDown={(e) => e.key === 'Enter' && saveBrainName(brainName)}
                className="font-medium bg-background/60 border border-white/10 rounded px-2 py-0.5 text-sm w-full max-w-[150px]"
              />
            ) : (
              <h3 className="font-medium cursor-pointer hover:text-primary" onClick={() => setIsEditingName(true)}>{brainName}</h3>
            )}
          </div>
          <button 
            className="p-1 rounded hover:bg-background/60"
            onClick={() => setIsCollapsed(prev => !prev)}
          >
            {isCollapsed ? "Show" : "Hide"}
          </button>
        </div>
        
        {!isCollapsed && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              Your personal trading companion · AI-powered market insights
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(brainStatus?.sources || {}).map(([source, count]) => (
                <div key={source} className="bg-background/40 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  {sourceIcons[source] || <FileText className="h-3.5 w-3.5" />}
                  <span>{source}</span>
                  <span className="text-primary font-medium">{count}</span>
                </div>
              ))}              
            </div>
            
            <div className="flex gap-2">
              <AddToBrain 
                content="" 
                source="user-input"
                variant="button"
                label="Add Knowledge"
                useTedBrain={true}
              />
              <button 
                className="text-xs flex-1 py-1.5 px-3 flex justify-center items-center gap-1.5 bg-background/40 hover:bg-background/60 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => toast.info("Brain settings will be available soon!")}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-white/10 ${className} flex flex-col md:flex-row h-[550px] overflow-hidden`}>
      {/* Left side - Knowledge Base */}
      <div className="p-3 border-b md:border-b-0 md:border-r border-white/10 md:w-1/2 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-1.5">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={brainName}
                  onChange={(e) => setBrainName(e.target.value)}
                  onBlur={() => saveBrainName(brainName)}
                  onKeyDown={(e) => e.key === 'Enter' && saveBrainName(brainName)}
                  className="font-semibold bg-background/60 border border-white/10 rounded px-2 py-1 text-lg w-full max-w-[250px]"
                />
              ) : (
                <h3 className="font-semibold cursor-pointer hover:text-primary text-lg mb-1" onClick={() => setIsEditingName(true)}>{brainName}</h3>
              )}
              <p className="text-xs text-muted-foreground">Your personal trading companion · AI-powered market insights</p>
            </div>
          </div>
          <button 
            className="p-1 rounded hover:bg-background/60 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => toast.info("Brain settings will be available soon!")}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {brainStatus && (
          <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
            <div className="bg-background/40 p-1.5 rounded">
              <div className="text-xs text-muted-foreground">Knowledge Items</div>
              <div className="font-medium text-sm">{brainStatus.total_items}</div>
            </div>
            <div className="bg-background/40 p-1.5 rounded">
              <div className="text-xs text-muted-foreground">Size</div>
              <div className="font-medium text-sm">{brainStatus.size_kb ? brainStatus.size_kb.toFixed(1) : '0'} KB</div>
            </div>
          </div>
        )}
        
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Knowledge Sources</h4>
            <span className="text-xs text-muted-foreground">
              {Object.keys(brainStatus?.sources || {}).length} types
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(brainStatus?.sources || {}).map(([source, count]) => (
              <div key={source} className="bg-background/40 text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1">
                {sourceIcons[source] || <FileText className="h-3 w-3" />}
                <span>{source}</span>
                <span className="bg-primary/20 text-primary text-xs rounded-full px-1">{count}</span>
              </div>
            ))}              
          </div>
        </div>
        
        {/* Only show recent additions when not searching */}
        <div className="flex-grow overflow-y-auto mb-2 pr-1" style={{ maxHeight: "250px" }}>
          {/* User Folders/Categories */}
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-medium">Folders</h4>
            <button 
              className="text-xs text-primary hover:underline"
              onClick={() => toast.info("View all folders coming soon!")}
            >
              View all
            </button>
          </div>
          <div className="space-y-2 mb-4">
            <CategoryList refreshTrigger={refreshCategoryList} />
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <button 
            className="flex justify-center items-center gap-1 py-1 px-2 border border-dashed border-white/10 rounded-md text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors h-8"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Folder className="h-3 w-3" />
            <span className="text-xs">Create Folder</span>
          </button>

          <AddToBrain 
            content="" 
            source="user-input" 
            variant="button" 
            label="Add Knowledge"
            useTedBrain={true}
            className="w-full h-8 text-xs col-span-2"
          />
          
          <DocumentUploader 
                    useTedBrain={true} 
                    onUploadComplete={(result) => {
                      // After upload, refresh the brain status
                      getBrainStatus();
                    }}
                    className="h-8" 
                  />
          
          <button 
            className="flex justify-center items-center gap-1 py-1 px-2 border border-dashed border-white/10 rounded-md text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors h-8"
            onClick={() => setUrlImportModalOpen(true)}
          >
            <Link className="h-3 w-3" />
            <span className="text-xs">Import URL</span>
          </button>
          
          {/* URL Import Modal */}
          <ImportUrlModal 
            open={showUrlImportModal} 
            onOpenChange={setUrlImportModalOpen} 
            useTedBrain={true}
          />
          
          {/* Create Folder Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create new folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="folder-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="folder-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="folder-description"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setNewFolderName("");
                      setNewFolderDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!newFolderName.trim()) return;
                      
                      try {
                        setIsCreatingFolder(true);
                        const response = await brain.create_category(
                          { user_id: "default" },
                          {
                            name: newFolderName.trim(),
                            description: newFolderDescription.trim() || null,
                            icon: null,
                            color: null
                          }
                        );
                        
                        await response.json();
                        toast.success("Folder created successfully");
                        setCreateDialogOpen(false);
                        setNewFolderName("");
                        setNewFolderDescription("");
                        // Trigger refresh of the category list
                        setRefreshCategoryList(prev => prev + 1);
                      } catch (error) {
                        console.error("Error creating folder:", error);
                        toast.error("Failed to create folder");
                      } finally {
                        setIsCreatingFolder(false);
                      }
                    }} 
                    disabled={!newFolderName.trim() || isCreatingFolder}
                  >
                    {isCreatingFolder ? (
                      <>
                        <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Right side - Chat Interface */}
      <div className="md:w-1/2 flex flex-col h-full overflow-hidden">
        {/* Chat header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Chat with Your Brain</h3>
              <p className="text-xs text-muted-foreground">Ask questions about your trading data</p>
            </div>
          </div>
          <button 
            className="p-1 rounded hover:bg-background/60 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setChatMessages([{
              id: '1',
              type: 'ai',
              content: 'Hello! I\'m your personal trading companion. Ask me about your trading data, charts, or market insights that you\'ve added to your knowledge base.',
              timestamp: new Date().toISOString(),
            }])}
            title="Reset chat"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Chat messages */}
        <div className="flex-grow overflow-y-auto p-3 pr-4">
          {chatMessages.map((message) => (
            <div key={message.id} className={`mb-3 ${message.type === 'user' ? 'flex flex-row-reverse' : 'flex'}`}>
              <div className={`rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 ${message.type === 'user' ? 'bg-primary/20 ml-2' : 'bg-primary mr-2'}`}>
                {message.type === 'user' ? (
                  <User className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Brain className="h-3.5 w-3.5 text-background" />
                )}
              </div>
              
              <div className={`flex-1 ${message.type === 'user' ? 'max-w-[80%]' : 'max-w-[90%]'}`}>
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium">
                    {message.type === 'user' ? 'You' : 'Brain'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className={`${message.type === 'user' ? 'bg-primary/10 text-foreground' : 'bg-background/40 text-foreground'} p-2 rounded-lg`}>
                  <div className="whitespace-pre-line text-xs">{message.content}</div>
                  
                  {/* Display results for AI messages if available */}
                  {message.type === 'ai' && message.results && message.results.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="text-xs font-medium mb-2">Relevant from your knowledge base:</div>
                      {message.results.map((result, index) => (
                        <div key={`result-${result.id}-${index}`} className="mb-2 last:mb-0">
                          {/* If the result is an image or video, use BrainResultItem */}
                          {(result.source === 'image' || result.source === 'video') ? (
                            <BrainResultItem result={result} index={index} />
                          ) : (
                            <div className="bg-background/60 p-2 rounded-md text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                {result.source === 'document' && <FileText className="h-3 w-3 text-primary" />}
                                {result.source === 'image' && <Image className="h-3 w-3 text-primary" />}
                                {result.source === 'video' && <Film className="h-3 w-3 text-primary" />}
                                <span className="font-medium">
                                  {result.metadata?.filename || result.metadata?.title || `Source ${index + 1}`}
                                </span>
                              </div>
                              <p className="text-xs line-clamp-2">{result.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex mb-3">
              <div className="rounded-full h-6 w-6 flex items-center justify-center bg-primary mr-2 relative">
                <Brain className="h-3.5 w-3.5 text-background" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-opacity-20 border-t-primary animate-spin"></div>
              </div>
              <div className="bg-background/40 p-2 rounded-lg max-w-[90%]">
                <div className="flex space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse delay-150"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat input */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-start gap-2">
            <div className="relative flex-grow">
              <textarea
                ref={inputRef}
                className="w-full bg-background/40 border border-white/10 rounded-md px-3 py-2 min-h-[36px] max-h-[120px] focus:outline-none focus:border-primary text-xs resize-none"
                placeholder="Ask about your trading data, charts, or market insights..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
            </div>
            
            <button 
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${inputValue.trim() && !isLoading ? 'bg-primary text-background' : 'bg-primary/30 text-muted-foreground cursor-not-allowed'}`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Chat queries your personal knowledge base for insights
          </p>
        </div>
      </div>
    </div>
  );
};