import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Conversation, ConversationListItem, Attachment } from './tedAITypes';
import brain from 'brain';

interface TedAIState {
  // Chat state
  currentConversationId: string | null;
  conversations: Record<string, Conversation>;
  conversationList: ConversationListItem[];
  isLoading: boolean;
  error: string | null;
  
  // Streaming state
  streamingMessage: string;
  pendingAttachments: Attachment[] | null;
  isStreaming: boolean;
  
  // UI state
  showSidebar: boolean;
  userSettings: {
    userId: string;
    includeCharts: boolean;
    includeMarketData: boolean;
  };
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<Conversation | null>;
  startNewConversation: () => void;
  sendMessage: (message: string) => Promise<void>;
  streamMessage: (message: string) => Promise<void>;
  toggleSidebar: () => void;
  setUserSettings: (settings: Partial<TedAIState['userSettings']>) => void;
}

export const useTedAIStore = create<TedAIState>(
  persist(
    (set, get) => ({
      // Initial state
      currentConversationId: null,
      conversations: {},
      conversationList: [],
      isLoading: false,
      error: null,
      streamingMessage: '',
      pendingAttachments: null,
      isStreaming: false,
      showSidebar: true,
      userSettings: {
        userId: 'default-user',
        includeCharts: true,
        includeMarketData: true,
      },
      
      // Actions
      fetchConversations: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await brain.get_conversations({ user_id: get().userSettings.userId });
          const data = await response.json();
          
          set({ 
            conversationList: data.conversations,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error fetching conversations:', error);
          set({ 
            error: 'Failed to load conversations', 
            isLoading: false 
          });
          
          // Use mock data if API fails (for development)
          set({
            conversationList: [
              { id: '1', title: 'Technology Sector Analysis', timestamp: new Date().toISOString() },
              { id: '2', title: 'Portfolio Risk Assessment', timestamp: new Date(Date.now() - 86400000).toISOString() },
              { id: '3', title: 'Earnings Season Strategy', timestamp: new Date(Date.now() - 172800000).toISOString() },
            ]
          });
        }
      },
      
      fetchConversation: async (conversationId: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await brain.get_conversation({ conversation_id: conversationId });
          const conversation = await response.json();
          
          // Update state with fetched conversation
          set(state => ({ 
            conversations: { 
              ...state.conversations, 
              [conversationId]: conversation 
            },
            currentConversationId: conversationId,
            isLoading: false 
          }));
          
          return conversation;
        } catch (error) {
          console.error('Error fetching conversation:', error);
          set({ 
            error: 'Failed to load conversation', 
            isLoading: false 
          });
          return null;
        }
      },
      
      startNewConversation: () => {
        const newConversationId = `new-${Date.now()}`;
        const newConversation: Conversation = {
          id: newConversationId,
          title: 'New conversation',
          messages: [],

          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        };
        
        set(state => ({
          conversations: {
            ...state.conversations,
            [newConversationId]: newConversation
          },
          currentConversationId: newConversationId,
        }));
      },
      
      sendMessage: async (message: string) => {
        const { currentConversationId, userSettings } = get();
        
        // Create a new conversation if none exists
        if (!currentConversationId) {
          get().startNewConversation();
        }
        
        const conversationId = get().currentConversationId;
        if (!conversationId) return; // Safety check
        
        // Optimistically add user message to UI
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        
        set(state => {
          const currentConversation = state.conversations[conversationId] || {
            id: conversationId,
            title: 'New conversation',
            messages: [],
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          };
          
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...currentConversation,
                messages: [...currentConversation.messages, userMessage],
                last_updated: new Date().toISOString(),
              }
            },
            isLoading: true,
            error: null,
          };
        });
        
        try {
          // Send message to API
          const response = await brain.chat({
            message,
            conversation_id: conversationId,
            user_id: userSettings.userId,
            include_charts: userSettings.includeCharts,
            include_market_data: userSettings.includeMarketData,
          });
          
          const data = await response.json();
          
          // Add AI response to conversation
          const aiMessage: Message = {
            id: data.id,
            type: 'ai',
            content: data.content,
            timestamp: data.timestamp,
            attachments: data.attachments,
          };
          
          set(state => {
            const currentConversation = state.conversations[conversationId];
            if (!currentConversation) return state; // Safety check
            
            // Update conversation list with new title if this is a new conversation
            let updatedList = [...state.conversationList];
            const existingIndex = updatedList.findIndex(c => c.id === conversationId);
            
            if (existingIndex === -1) {
              // This is a new conversation, add it to the list
              const title = currentConversation.title === 'New conversation' 
                ? message.length > 30 ? message.substring(0, 27) + '...' : message
                : currentConversation.title;
                
              updatedList = [
                { 
                  id: conversationId, 
                  title, 
                  timestamp: new Date().toISOString() 
                },
                ...updatedList
              ];
            }
            
            return {
              conversations: {
                ...state.conversations,
                [conversationId]: {
                  ...currentConversation,
                  messages: [...currentConversation.messages, aiMessage],
                  title: currentConversation.title === 'New conversation' 
                    ? (message.length > 30 ? message.substring(0, 27) + '...' : message)
                    : currentConversation.title,
                  last_updated: new Date().toISOString(),
                }
              },
              conversationList: updatedList,
              isLoading: false,
            };
          });
          
        } catch (error) {
          console.error('Error sending message:', error);
          
          // Generic fallback response for development/demo
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: "I'm analyzing your request. In a real implementation, this would connect to the TED AI backend to provide a detailed response based on market data and your trading history.",
            timestamp: new Date().toISOString(),
          };
          
          set(state => {
            const currentConversation = state.conversations[conversationId];
            if (!currentConversation) return { ...state, isLoading: false, error: 'Conversation not found' };
            
            return {
              conversations: {
                ...state.conversations,
                [conversationId]: {
                  ...currentConversation,
                  messages: [...currentConversation.messages, aiMessage],
                  last_updated: new Date().toISOString(),
                }
              },
              isLoading: false,
              error: 'Failed to get response from AI assistant',
            };
          });
        }
      },
      
      streamMessage: async (message: string) => {
        const { currentConversationId, userSettings } = get();
        
        // Create a new conversation if none exists
        if (!currentConversationId) {
          get().startNewConversation();
        }
        
        const conversationId = get().currentConversationId;
        if (!conversationId) return; // Safety check
        
        // Optimistically add user message to UI
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        
        set(state => {
          const currentConversation = state.conversations[conversationId] || {
            id: conversationId,
            title: 'New conversation',
            messages: [],
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          };
          
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...currentConversation,
                messages: [...currentConversation.messages, userMessage],
                last_updated: new Date().toISOString(),
              }
            },
            streamingMessage: '',
            pendingAttachments: null,
            isStreaming: true,
            error: null,
          };
        });
        
        // Periodically log to check if we're still active
        const startTime = Date.now();
        const loggingTimer = setInterval(() => {
          console.log(`Streaming active for ${(Date.now() - startTime) / 1000}s`);
        }, 5000);
        
        try {
          // Setup for streaming
          let accumulatedContent = '';
          let attachmentsJson = null;
          
          try {
            console.log('Starting streaming request with parameters:', {
              message,
              conversation_id: conversationId,
              user_id: userSettings.userId,
              include_charts: userSettings.includeCharts,
              include_market_data: userSettings.includeMarketData,
            });
            
            // Use the brain.chat_stream method for streaming which returns an AsyncIterable
            const streamIterable = brain.chat_stream({
              message,
              conversation_id: conversationId,
              user_id: userSettings.userId,
              include_charts: userSettings.includeCharts,
              include_market_data: userSettings.includeMarketData,
            });
            
            // Process the stream using for await...of loop (for AsyncIterable)
            for await (const chunk of streamIterable) {
              // Check if chunk contains attachments JSON (at the end)
              if (typeof chunk === 'string' && chunk.includes('{"attachments":')) {
                const parts = chunk.split('\n\n');
                const lastPart = parts[parts.length - 1];
                
                // Try to parse JSON
                try {
                  attachmentsJson = JSON.parse(lastPart);
                  // Remove the JSON part from accumulated content
                  accumulatedContent += parts.slice(0, parts.length - 1).join('\n\n');
                } catch (e) {
                  // Not valid JSON yet, treat as normal content
                  accumulatedContent += chunk;
                }
              } else {
                // Add chunk to accumulated content
                accumulatedContent += chunk;
              }
              
              // Update streaming state
              set({ streamingMessage: accumulatedContent });
            }
            
            // Clear the logging timer
            clearInterval(loggingTimer);
          } catch (error) {
            console.error('Error during streaming:', error);
            // Fall back to regular fetch in case streaming isn't working
            return await get().sendMessage(message);
          }
          
          // Stream complete, finalize the message
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: accumulatedContent,
            timestamp: new Date().toISOString(),
            attachments: attachmentsJson?.attachments || undefined,
          };
          
          // Update conversation with final message
          set(state => {
            const currentConversation = state.conversations[conversationId];
            if (!currentConversation) return state; // Safety check
            
            // Update conversation list with new title if this is a new conversation
            let updatedList = [...state.conversationList];
            const existingIndex = updatedList.findIndex(c => c.id === conversationId);
            
            if (existingIndex === -1) {
              // This is a new conversation, add it to the list
              const title = currentConversation.title === 'New conversation' 
                ? message.length > 30 ? message.substring(0, 27) + '...' : message
                : currentConversation.title;
                
              updatedList = [
                { 
                  id: conversationId, 
                  title, 
                  timestamp: new Date().toISOString() 
                },
                ...updatedList
              ];
            }
            
            return {
              conversations: {
                ...state.conversations,
                [conversationId]: {
                  ...currentConversation,
                  messages: [...currentConversation.messages, aiMessage],
                  title: currentConversation.title === 'New conversation' 
                    ? (message.length > 30 ? message.substring(0, 27) + '...' : message)
                    : currentConversation.title,
                  last_updated: new Date().toISOString(),
                }
              },
              conversationList: updatedList,
              streamingMessage: '',
              isStreaming: false,
              pendingAttachments: null,
            };
          });
          
        } catch (error) {
          console.error('Error streaming message:', error);
          
          // Finalize with whatever we have or a generic message
          const streamContent = get().streamingMessage;
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: streamContent || "I'm sorry, I wasn't able to provide a complete response. Please try again.",
            timestamp: new Date().toISOString(),
          };
          
          set(state => {
            const currentConversation = state.conversations[conversationId];
            if (!currentConversation) return { 
              ...state, 
              isStreaming: false, 
              streamingMessage: '',
              pendingAttachments: null,
              error: 'Conversation not found' 
            };
            
            return {
              conversations: {
                ...state.conversations,
                [conversationId]: {
                  ...currentConversation,
                  messages: [...currentConversation.messages, aiMessage],
                  last_updated: new Date().toISOString(),
                }
              },
              isStreaming: false,
              streamingMessage: '',
              pendingAttachments: null,
              error: 'Error during streaming response',
            };
          });
        }
      },
      
      toggleSidebar: () => {
        set(state => ({ showSidebar: !state.showSidebar }));
      },
      
      setUserSettings: (settings) => {
        set(state => ({
          userSettings: {
            ...state.userSettings,
            ...settings
          }
        }));
      },
    }),
    {
      name: 'ted-ai-store',
      partialize: (state) => ({
        // Only persist these parts of the state
        userSettings: state.userSettings,
        showSidebar: state.showSidebar,
      }),
    }
  )
);
