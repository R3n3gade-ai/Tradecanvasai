"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useDashboardStore } from "../utils/store";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export const ChatPanel: React.FC = () => {
  const { chatPanelState, setChatPanelState } = useDashboardStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "user1",
      userName: "Alex Lane",
      message: "Just bought some AAPL shares. What do you think about their earnings report?",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "2",
      userId: "user2",
      userName: "Sarah Johnson",
      message: "I think it looks promising. Their new product line should boost revenue.",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: "3",
      userId: "user3",
      userName: "Mike Wilson",
      message: "Anyone watching the SPY today? Huge movement in the last hour.",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "4",
      userId: "user1",
      userName: "Alex Lane", 
      message: "Yes, I think it's related to the Fed announcement.",
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && chatPanelState !== "hidden") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatPanelState]);
  
  const handleSendMessage = () => {
    if (message.trim() === "") return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: "currentUser", // In a real app, this would be the current user's ID
      userName: "You", // In a real app, this would be the current user's name
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, newMessage]);
    setMessage(" ");
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (chatPanelState === "hidden") {
    return (
      <button 
        onClick={() => setChatPanelState("expanded")} 
        className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-l-md"
        title="Open chat"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    );
  }
  
  return (
    <div 
      className={`h-full border-l border-white/10 bg-gray-900/50 backdrop-blur-sm flex flex-col transition-all duration-300 ${
        chatPanelState === "expanded" ? "w-80" : "w-14"
      }`}
    >
      {chatPanelState === "expanded" ? (
        <>
          {/* Header */}
          <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
            <h3 className="font-medium">Community Chat</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setChatPanelState("collapsed")} 
                className="p-1 hover:bg-gray-800 rounded-md transition-colors"
                title="Collapse chat"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setChatPanelState("hidden")} 
                className="p-1 hover:bg-gray-800 rounded-md transition-colors"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{msg.userName}</span>
                  <span className="text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                </div>
                <div className="bg-gray-800 rounded-md p-2 text-sm break-words">
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={message.trim() === ""}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 rounded-md transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center">
          <button 
            onClick={() => setChatPanelState("expanded")} 
            className="p-3 hover:bg-gray-800 w-full flex justify-center transition-colors"
            title="Expand chat"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 flex flex-col justify-center items-center">
            <span className="transform -rotate-90 text-xs font-medium text-gray-400 whitespace-nowrap">
              COMMUNITY CHAT
            </span>
          </div>
          <button 
            onClick={() => setChatPanelState("hidden")} 
            className="p-3 hover:bg-gray-800 w-full flex justify-center transition-colors"
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
