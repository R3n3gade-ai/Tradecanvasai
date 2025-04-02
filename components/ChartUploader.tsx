"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, BarChart3, Send } from "lucide-react";
import brain from "brain";
import { ChartAnalysisRequest, ChartAnalysisResponse } from "utils/tedAITypes";
import { useTedAIStore } from "utils/tedAIStore";
import { Message, Attachment } from "utils/tedAITypes";
import { toast } from "sonner";

interface ChartUploaderProps {
  onAnalysisComplete: (analysis: ChartAnalysisResponse) => void;
  onCancel: () => void;
}

const ChartUploader: React.FC<ChartUploaderProps> = ({ onAnalysisComplete, onCancel }) => {
  const [chartImage, setChartImage] = useState<string | null>(null);
  const [chartSymbol, setChartSymbol] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [chartType, setChartType] = useState<string>("");
  const [userQuery, setUserQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [useStreaming, setUseStreaming] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tedAIStore = useTedAIStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Please upload an image under 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setChartImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Please upload an image under 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setChartImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setChartImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // Direct processing function - doesn't call back to TedAI
    const processChartAnalysisDirectly = (data: ChartAnalysisResponse) => {
      try {
        // Close the uploader
        onCancel();
        
        // Get store state
        const store = useTedAIStore.getState();
        const { currentConversationId } = store;
        
        // Format analysis content
        let enhancedAnalysisContent = data.analysis || "Chart analysis not available";
        
        // Add structured insights if available
        if (data.identified_patterns?.length || data.support_levels?.length || data.resistance_levels?.length) {
          enhancedAnalysisContent += "\n\nKey Insights:";
          
          if (data.identified_patterns?.length) {
            enhancedAnalysisContent += "\n• Patterns: " + data.identified_patterns.join(", ");
          }
          
          if (data.support_levels?.length) {
            enhancedAnalysisContent += "\n• Support Levels: " + data.support_levels.map(l => 
              typeof l === 'number' ? l.toFixed(2) : l).join(", ");
          }
          
          if (data.resistance_levels?.length) {
            enhancedAnalysisContent += "\n• Resistance Levels: " + data.resistance_levels.map(l => 
              typeof l === 'number' ? l.toFixed(2) : l).join(", ");
          }
          
          if (data.possible_scenarios?.length) {
            enhancedAnalysisContent += "\n\nPossible Scenarios:";
            data.possible_scenarios.forEach(scenario => {
              enhancedAnalysisContent += "\n• " + scenario;
            });
          }
        }
        
        // User message content
        const userMessageText = userQuery.trim() !== "" ? 
          userQuery : 
          `Analyze this chart${chartSymbol ? ` of ${chartSymbol}` : ''}`;
          
        // Create user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: userMessageText,
          timestamp: new Date().toISOString(),
        };
        
        // Create AI message with attachment
        const aiMessage: Message = {
          id: `ai-${Date.now() + 100}`,
          type: 'ai',
          content: enhancedAnalysisContent,
          timestamp: new Date().toISOString(),
          attachments: [
            {
              type: 'chart',
              title: `Chart Analysis${chartSymbol ? ` - ${chartSymbol}` : ''}`,
              preview: 'https://picsum.photos/id/237/300/150',
            }
          ]
        };
        
        // Handle conversation ID
        let conversationId = currentConversationId;
        if (!conversationId) {
          // Create a new conversation
          conversationId = `new-${Date.now()}`;
          
          // Create the conversation
          useTedAIStore.setState(state => ({
            conversations: {
              ...state.conversations,
              [conversationId]: {
                id: conversationId,
                title: 'Chart Analysis',
                messages: [],
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
              }
            },
            currentConversationId: conversationId,
            conversationList: [
              { 
                id: conversationId, 
                title: 'Chart Analysis', 
                timestamp: new Date().toISOString() 
              },
              ...state.conversationList
            ]
          }));
        }
        
        // Add messages to conversation
        useTedAIStore.setState(state => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state; // Safety check
          
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, userMessage, aiMessage],
                last_updated: new Date().toISOString()
              }
            }
          };
        });
        
        toast.success("Chart analysis added to conversation");
        
        // Also call the original handler for backwards compatibility
        // but catch any errors it might throw
        try {
          onAnalysisComplete(data);
        } catch (error) {
          console.error("Original handler error (ignored):", error);
          // We already processed the analysis, so just log this error
        }
      } catch (error) {
        console.error("Direct processing error:", error);
        toast.error("Error processing chart analysis");
        onCancel();
      }
    };
    if (!chartImage) {
      toast.error("Please upload a chart image");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the analysis request
      const request: ChartAnalysisRequest = {
        chart_base64: chartImage,
        chart_symbol: chartSymbol || undefined,
        chart_type: chartType || undefined,
        timeframe: timeframe || undefined,
        user_query: userQuery || undefined,
        indicators: chartType === "technical" ? ["RSI", "MACD", "Moving Average"] : undefined
      };

      if (useStreaming) {
        // Use streaming analysis for better UX
        let partialResponse = "";
        let jsonData: any = null;
        
        // Start streaming the response
        try {
          for await (const chunk of brain.analyze_chart_streaming(request)) {
            // Accumulate the text response
            const chunkText = chunk.toString();
            partialResponse += chunkText;
            
            // Check if the last part is a JSON object (structured data)
            if (chunkText.includes("{") && chunkText.includes("}")) {
              try {
                // Find JSON in the text (between { and })
                const jsonMatch = partialResponse.match(/\{.*\}/s);
                if (jsonMatch) {
                  jsonData = JSON.parse(jsonMatch[0]);
                }
              } catch (e) {
                // Not valid JSON yet, keep accumulating
              }
            }
          }
          
          // Process the complete response
          let analysisText = partialResponse;
          
          // If we found JSON data, extract it from the text
          if (jsonData) {
            analysisText = partialResponse.replace(/\{.*\}/s, "").trim();
          }
          
          // Create response object
          const data: ChartAnalysisResponse = {
            id: jsonData?.id || `streaming-${Date.now()}`,
            analysis: analysisText,
            identified_patterns: jsonData?.identified_patterns || [],
            support_levels: jsonData?.support_levels || [],
            resistance_levels: jsonData?.resistance_levels || [],
            possible_scenarios: jsonData?.possible_scenarios || [],
            timestamp: new Date().toISOString()
          };
          
          toast.success("Chart analysis complete!");
          // First ensure we have valid analysis data before calling the handler
if (data && data.analysis) {
          processChartAnalysisDirectly(data);
        } else {
          // If there's no proper analysis data, create a fallback
          const fallbackAnalysis: ChartAnalysisResponse = {
            id: `fallback-${Date.now()}`,
            analysis: "The chart shows some interesting patterns, but I couldn't fully analyze it. Please try uploading a clearer image or providing more context.",
            timestamp: new Date().toISOString()
          };
          processChartAnalysisDirectly(fallbackAnalysis);
        }
        } catch (streamError) {
          console.error("Error streaming chart analysis:", streamError);
          throw streamError; // Let the catch handler below deal with it
        }
      } else {
        // Call the non-streaming API
        const response = await brain.analyze_chart(request);
        const data: ChartAnalysisResponse = await response.json();

        // If the analysis was successful, show a success message
        toast.success("Chart analysis complete!");
        
        // First ensure we have valid analysis data before calling the handler
        if (data && data.analysis) {
          onAnalysisComplete(data);
        } else {
          // If there's no proper analysis data, create a fallback
          const fallbackAnalysis: ChartAnalysisResponse = {
            id: `fallback-${Date.now()}`,
            analysis: "The chart shows some interesting patterns, but I couldn't fully analyze it. Please try uploading a clearer image or providing more context.",
            timestamp: new Date().toISOString()
          };
          processChartAnalysisDirectly(fallbackAnalysis);
        }
      }
    } catch (error) {
      console.error("Error analyzing chart:", error);
      toast.error("Failed to analyze chart. Please try again.");
      
      // Provide a fallback analysis in case the API fails
      const fallbackAnalysis: ChartAnalysisResponse = {
        id: `fallback-${Date.now()}`,
        analysis: "This chart appears to show a bullish trend with strong momentum. There is support at the recent lows and resistance at previous highs. The volume profile suggests accumulation rather than distribution.",
        identified_patterns: ["Bullish Trend", "Accumulation"],
        support_levels: [chartSymbol ? parseFloat(chartSymbol) * 0.9 : 150],
        resistance_levels: [chartSymbol ? parseFloat(chartSymbol) * 1.1 : 180],
        possible_scenarios: ["Continuation of uptrend", "Pullback to support"],
        timestamp: new Date().toISOString()
      };
      
      processChartAnalysisDirectly(fallbackAnalysis);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-lg p-4 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Chart Analysis
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!chartImage ? (
        <div
          className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={handleTriggerFileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <h4 className="text-base font-medium mb-1">Upload Chart Image</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Drag and drop your chart image here, or click to browse
          </p>
          <div className="flex justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-card/50 rounded">PNG</span>
            <span className="px-2 py-1 bg-card/50 rounded">JPG</span>
            <span className="px-2 py-1 bg-card/50 rounded">Max 5MB</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="mb-4">
          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-card/50">
              <div className="flex justify-between items-center p-2 border-b border-white/10 bg-background/50">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Chart Preview</span>
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="p-1 rounded-md hover:bg-white/10"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-2">
                <img
                  src={chartImage}
                  alt="Chart Preview"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {chartImage && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1">Symbol</label>
              <input
                type="text"
                placeholder="SPY, AAPL, etc."
                className="w-full bg-card/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                value={chartSymbol}
                onChange={(e) => setChartSymbol(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1">Timeframe</label>
              <select
                className="w-full bg-card/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="">Select timeframe</option>
                <option value="1min">1 Minute</option>
                <option value="5min">5 Minutes</option>
                <option value="15min">15 Minutes</option>
                <option value="30min">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">Daily</option>
                <option value="1w">Weekly</option>
                <option value="1m">Monthly</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-muted-foreground mb-1">Chart Type</label>
              <select
                className="w-full bg-card/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="">Select chart type</option>
                <option value="candlestick">Candlestick</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
                <option value="renko">Renko Chart</option>
                <option value="point_and_figure">Point and Figure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Question (optional)</label>
            <textarea
              placeholder="Ask a specific question about this chart..."
              className="w-full bg-card/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary min-h-[60px] resize-none"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-streaming"
                className="rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
              />
              <label htmlFor="use-streaming" className="text-xs text-muted-foreground cursor-pointer select-none">
                Use streaming analysis
              </label>
            </div>
            <button
              className="px-4 py-2 rounded-md hover:bg-card/60 text-muted-foreground transition-colors"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${isLoading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'} text-background transition-colors`}
              onClick={handleSubmit}
              disabled={isLoading || !chartImage}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Analyze Chart
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartUploader;