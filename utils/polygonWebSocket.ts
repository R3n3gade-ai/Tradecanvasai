// In Databutton, API paths need to be constructed from API_URL and path prefix
import { API_URL } from 'app';

// Event types for Polygon.io options data
export interface PolygonOptionsEvent {
  ev: string; // Event type
  sym?: string; // Symbol
  x?: number; // Exchange ID
  p?: number; // Price
  s?: number; // Size
  c?: number[]; // Condition codes
  t?: number; // Timestamp (Unix MS)
  q?: number; // Sequence number
  // Additional fields based on event type
}

interface WebSocketMessage {
  error?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

type MessageHandler = (data: PolygonOptionsEvent[] | WebSocketMessage) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error', message?: string) => void;

class PolygonOptionsWebSocket {
  private ws: WebSocket | null = null;
  private clientId: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentSubscriptions: Set<string> = new Set();
  
  constructor() {
    // Generate a unique client ID
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  public connect(): void {
    if (this.ws) {
      return; // Already connected
    }
    
    this.notifyStatusChange('connecting');
    
    try {
      // Get URL hostname from API_URL
      const urlObj = new URL(API_URL);
      
      // ALWAYS use secure WebSocket (wss://) regardless of the current protocol
      // This ensures it works both on HTTP and HTTPS without mixed content errors
      const wsProtocol = 'wss';
      
      // Correctly form the path for Databutton APIs
      // Path structure: protocol://host/path_prefix/endpoint
      // In our case, the endpoint is polygon_options/ws/options/{client_id}
      
      // For deployed apps, we need to extract the path prefix from the current API URL
      // This is important for Databutton's routing to work correctly
      
      // Extract path prefix from API_URL (everything after the hostname)
      const pathPrefix = urlObj.pathname || '';
      
      // Add diagnostic info
      console.log('API URL:', API_URL);
      console.log('URL hostname:', urlObj.host);
      console.log('Path prefix:', pathPrefix);
      
      // Check if we need to disable WebSockets
      if (window.location.protocol === 'https:' && urlObj.protocol === 'http:') {
        throw new Error('Cannot establish WebSocket connection from HTTPS page to HTTP server due to security restrictions.');
      }
      
      // Format: {ws_protocol}://{hostname}{path_prefix}/polygon_options/ws/options/{client_id}
      const wsUrl = `${wsProtocol}://${urlObj.host}${pathPrefix}/polygon_options/ws/options/${this.clientId}`;
      console.log('Connecting to WebSocket URL:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.notifyStatusChange('connected');
        this.reconnectAttempts = 0;
        
        // Resubscribe to previous subscriptions
        this.currentSubscriptions.forEach(symbol => {
          this.subscribeToSymbol(symbol);
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Notify all message handlers
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Get current URL for debugging
        const currentUrl = window.location.href;
        console.error('Current page URL:', currentUrl);
        // Create a more descriptive error message
        this.notifyStatusChange('error', `WebSocket connection error. URL: ${wsUrl}`);
      };
      
      this.ws.onclose = () => {
        this.notifyStatusChange('disconnected');
        this.ws = null;
        
        // Attempt to reconnect if not max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.connect();
          }, this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.notifyStatusChange('error', 'Failed to create WebSocket connection');
    }
  }
  
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.notifyStatusChange('disconnected');
    }
    
    this.currentSubscriptions.clear();
  }
  
  public subscribeToSymbol(symbol: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue the subscription for when we connect
      this.currentSubscriptions.add(symbol);
      if (!this.ws) {
        this.connect();
      }
      return;
    }
    
    // Add to current subscriptions
    this.currentSubscriptions.add(symbol);
    
    // Send subscription message
    const message = {
      action: 'subscribe',
      symbol: symbol.toUpperCase()
    };
    
    this.ws.send(JSON.stringify(message));
  }
  
  public unsubscribeFromSymbol(symbol: string): void {
    this.currentSubscriptions.delete(symbol);
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Send unsubscribe message
    const message = {
      action: 'unsubscribe',
      symbol: symbol.toUpperCase()
    };
    
    this.ws.send(JSON.stringify(message));
  }
  
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    
    // Return a function to remove the handler
    return () => {
      this.messageHandlers.delete(handler);
    };
  }
  
  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    
    // Return a function to remove the handler
    return () => {
      this.statusHandlers.delete(handler);
    };
  }
  
  private notifyStatusChange(status: 'connecting' | 'connected' | 'disconnected' | 'error', message?: string): void {
    this.statusHandlers.forEach(handler => handler(status, message));
  }
}

// Create a singleton instance
const polygonWebSocket = new PolygonOptionsWebSocket();

export default polygonWebSocket;
