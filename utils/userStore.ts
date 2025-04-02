import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  joinedAt: string;
  settings: UserSettings;
  subscription: SubscriptionTier;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultTicker: string;
  notifications: boolean;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface UserState {
  // Current user
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
}

// Mock users for demonstration
const MOCK_USERS = {
  'alex@marketpulse.com': {
    id: 'user-1',
    email: 'alex@marketpulse.com',
    name: 'Alex Lane',
    photoUrl: undefined,
    password: 'password123', // Note: In a real app, passwords would be hashed and never stored client-side
    joinedAt: '2024-01-15T08:30:00Z',
    settings: {
      theme: 'dark' as const,
      defaultTicker: 'SPY',
      notifications: true,
    },
    subscription: 'pro' as const,
  },
  'demo@marketpulse.com': {
    id: 'user-2',
    email: 'demo@marketpulse.com',
    name: 'Demo User',
    photoUrl: undefined,
    password: 'demo123',
    joinedAt: '2024-03-01T10:15:00Z',
    settings: {
      theme: 'dark' as const,
      defaultTicker: 'AAPL',
      notifications: false,
    },
    subscription: 'free' as const,
  },
};

export const useUserStore = create<UserState>(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Check if user exists in our mock database
          const mockUser = MOCK_USERS[email.toLowerCase()];
          
          if (!mockUser || mockUser.password !== password) {
            set({ 
              isLoading: false, 
              error: 'Invalid email or password' 
            });
            return false;
          }
          
          // Remove password field before storing in state
          const { password: _, ...userWithoutPassword } = mockUser;
          
          set({
            user: userWithoutPassword as User,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to login. Please try again.' 
          });
          return false;
        }
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },
      
      signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if email already exists
          if (MOCK_USERS[email.toLowerCase()]) {
            set({ 
              isLoading: false, 
              error: 'Email already in use' 
            });
            return false;
          }
          
          // Create new user
          const newUser = {
            id: `user-${Date.now()}`,
            email: email.toLowerCase(),
            name,
            joinedAt: new Date().toISOString(),
            settings: {
              theme: 'dark' as const,
              defaultTicker: 'SPY',
              notifications: true,
            },
            subscription: 'free' as const,
          };
          
          // In a real app, would add to database here
          // For demo, we'll just log and set the state
          console.log('Created new user:', newUser);
          
          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return true;
        } catch (error) {
          console.error('Signup error:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to create account. Please try again.' 
          });
          return false;
        }
      },
      
      updateUserProfile: (updates) => {
        const { user } = get();
        if (!user) return;
        
        set({
          user: { ...user, ...updates },
        });
      },
      
      updateUserSettings: (settings) => {
        const { user } = get();
        if (!user) return;
        
        set({
          user: {
            ...user,
            settings: { ...user.settings, ...settings },
          },
        });
      },
    }),
    {
      name: 'market-pulse-user',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);