import { create } from 'zustand';
import brain from 'brain';
import { 
  AddToBrainRequest, 
  AddToBrainResponse, 
  BrainItem, 
  AppApisTedBrainAddToBrainRequest, 
  AppApisTedBrainAddToBrainResponse,
  BrainStoreStatusResponse,
  QueryResult
} from 'types';

interface BrainState {
  // Ted's Brain
  queryTedBrain: (query: string) => Promise<BrainItem[]>;
  // State
  isAddingToBrain: boolean;
  recentItems: BrainItem[];
  error: string | null;
  
  // UI State
  showBrainModal: boolean;
  showUrlImportModal: boolean;
  pendingContent: string | null;
  pendingSource: string | null;
  pendingMetadata: Record<string, any> | null;
  
  // Actions
  addToBrain: (content: string, source: string, metadata?: Record<string, any>) => Promise<AddToBrainResponse | null>;
  queryBrain: (query: string, limit?: number) => Promise<BrainItem[]>;
  setBrainModalOpen: (isOpen: boolean) => void;
  setUrlImportModalOpen: (isOpen: boolean) => void;
  setPendingContent: (content: string | null, source?: string | null, metadata?: Record<string, any> | null) => void;
  clearError: () => void;

  // TedBrain Actions
  addToTedBrain: (content: string, source: string, metadata?: Record<string, any>) => Promise<AppApisTedBrainAddToBrainResponse | null>;
  queryTedBrain: (query: string, limit?: number) => Promise<QueryResult[]>;
  getBrainStatus: (userId?: string) => Promise<BrainStoreStatusResponse | null>;
}

export const useBrainStore = create<BrainState>((set, get) => ({
  // Initial state
  isAddingToBrain: false,
  recentItems: [],
  error: null,
  
  // UI State
  showBrainModal: false,
  showUrlImportModal: false,
  pendingContent: null,
  pendingSource: null,
  pendingMetadata: null,
  
  // Actions
  addToBrain: async (content, source, metadata = {}) => {
    try {
      set({ isAddingToBrain: true, error: null });
      
      // Default user ID - in a real app, this would come from auth
      const userId = 'default-user';
      
      const request: AddToBrainRequest = {
        user_id: userId,
        content,
        source,
        metadata: metadata || {},
        context: { added_from: window.location.pathname }
      };
      
      const response = await brain.add_to_brain(request);
      const data = await response.json();
      
      // Add to recent items
      set(state => ({
        recentItems: [
          // Create a synthetic item that matches BrainItem format
          {
            id: data.id,
            user_id: userId,
            content,
            metadata: metadata || {},
            source,
            timestamp: data.timestamp,
          },
          ...state.recentItems.slice(0, 9) // Keep last 10 items
        ],
        isAddingToBrain: false,
        // Reset modal state
        showBrainModal: false,
        pendingContent: null,
        pendingSource: null,
        pendingMetadata: null,
      }));
      
      return data;
    } catch (error) {
      console.error('Error adding to brain:', error);
      set({ 
        isAddingToBrain: false, 
        error: 'Failed to add content to brain' 
      });
      return null;
    }
  },
  
  queryBrain: async (query, limit = 5) => {
    try {
      // Default user ID - in a real app, this would come from auth
      const userId = 'default-user';
      
      const response = await brain.query_brain({
        user_id: userId,
        query,
        limit
      });
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error querying brain:', error);
      set({ error: 'Failed to query brain' });
      return [];
    }
  },
  
  setBrainModalOpen: (isOpen: boolean) => {
    set({ showBrainModal: isOpen });
    // If closing and not submitting, clear pending content
    if (!isOpen) {
      set({ 
        pendingContent: null,
        pendingSource: null,
        pendingMetadata: null
      });
    }
  },
  
  setUrlImportModalOpen: (isOpen: boolean) => {
    set({ showUrlImportModal: isOpen });
  },
  
  setPendingContent: (content, source = null, metadata = null) => {
    set({ 
      pendingContent: content,
      pendingSource: source,
      pendingMetadata: metadata,
      showBrainModal: content !== null, // Open modal if setting content
    });
  },
  
  clearError: () => set({ error: null }),

  // TedBrain implementations
  addToTedBrain: async (content, source, metadata = {}) => {
    try {
      set({ isAddingToBrain: true, error: null });
      
      // Default user ID
      const userId = 'default';
      
      const request: AppApisTedBrainAddToBrainRequest = {
        content,
        source,
        metadata: metadata || {},
        user_id: userId
      };
      
      const response = await brain.add_to_brain2(request);
      const data = await response.json();
      
      // Add to recent items
      set(state => ({
        recentItems: [
          // Create a synthetic item that matches BrainItem format
          {
            id: data.id,
            user_id: userId,
            content,
            metadata: metadata || {},
            source,
            timestamp: data.id, // Using ID as timestamp since it's a UUID
            created_at: new Date().toISOString(),
          },
          ...state.recentItems.slice(0, 9) // Keep last 10 items
        ],
        isAddingToBrain: false,
        // Reset modal state
        showBrainModal: false,
        pendingContent: null,
        pendingSource: null,
        pendingMetadata: null,
      }));
      
      return data;
    } catch (error) {
      console.error('Error adding to TedBrain:', error);
      set({ 
        isAddingToBrain: false, 
        error: 'Failed to add content to TedBrain' 
      });
      return null;
    }
  },
  
  queryTedBrain: async (query: string, filterCategories?: string[]) => {
    try {
      const response = await brain.query_brain2({
        query,
        limit: 10,
        user_id: "default",
        filter_categories: filterCategories
      });
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error querying TedBrain:', error);
      set({ error: 'Failed to query TedBrain' });
      return [];
    }
  },
  
  getBrainStatus: async (userId = 'default') => {
    try {
      const response = await brain.brain_store_status({ user_id: userId });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting TedBrain status:', error);
      set({ error: 'Failed to get TedBrain status' });
      return null;
    }
  },
}));