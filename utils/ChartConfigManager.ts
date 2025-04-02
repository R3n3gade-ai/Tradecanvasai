// ChartConfigManager.ts
// Utility for managing chart configurations and annotations

import databutton from "databutton";

export interface ChartAnnotation {
  id: string;
  symbol: string;
  text: string;
  price: number;
  time: number;
  color?: string;
}

export interface ChartConfiguration {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  chartType: string;
  indicators: string[];
  annotations: ChartAnnotation[];
  createdAt: number;
  updatedAt: number;
}

// Local storage keys
const SAVED_CONFIGS_KEY = 'marketpulse-chart-configs';

export const ChartConfigManager = {
  /**
   * Save a chart configuration
   */
  saveConfiguration: async (config: Omit<ChartConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChartConfiguration> => {
    // Get existing configs
    const configs = await ChartConfigManager.getConfigurations();
    
    // Create new config with ID and timestamps
    const newConfig: ChartConfiguration = {
      ...config,
      id: `chart-config-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Add to list and save
    configs.push(newConfig);
    localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(configs));
    
    return newConfig;
  },
  
  /**
   * Update an existing configuration
   */
  updateConfiguration: async (id: string, updates: Partial<ChartConfiguration>): Promise<ChartConfiguration | null> => {
    const configs = await ChartConfigManager.getConfigurations();
    const configIndex = configs.findIndex(c => c.id === id);
    
    if (configIndex === -1) return null;
    
    // Update the config
    const updatedConfig = {
      ...configs[configIndex],
      ...updates,
      updatedAt: Date.now()
    };
    
    configs[configIndex] = updatedConfig;
    localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(configs));
    
    return updatedConfig;
  },
  
  /**
   * Delete a configuration
   */
  deleteConfiguration: async (id: string): Promise<boolean> => {
    const configs = await ChartConfigManager.getConfigurations();
    const filteredConfigs = configs.filter(c => c.id !== id);
    
    if (filteredConfigs.length === configs.length) {
      return false; // Nothing was deleted
    }
    
    localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(filteredConfigs));
    return true;
  },
  
  /**
   * Get all saved configurations
   */
  getConfigurations: async (): Promise<ChartConfiguration[]> => {
    const savedConfigs = localStorage.getItem(SAVED_CONFIGS_KEY);
    if (!savedConfigs) return [];
    
    try {
      return JSON.parse(savedConfigs) as ChartConfiguration[];
    } catch (e) {
      console.error('Failed to parse saved chart configurations', e);
      return [];
    }
  },
  
  /**
   * Get a specific configuration by ID
   */
  getConfigurationById: async (id: string): Promise<ChartConfiguration | null> => {
    const configs = await ChartConfigManager.getConfigurations();
    return configs.find(c => c.id === id) || null;
  },
  
  /**
   * Get configurations for a specific symbol
   */
  getConfigurationsBySymbol: async (symbol: string): Promise<ChartConfiguration[]> => {
    const configs = await ChartConfigManager.getConfigurations();
    return configs.filter(c => c.symbol === symbol);
  },
  
  /**
   * Add an annotation to a specific configuration
   */
  addAnnotation: async (configId: string, annotation: Omit<ChartAnnotation, 'id'>): Promise<ChartAnnotation | null> => {
    const config = await ChartConfigManager.getConfigurationById(configId);
    if (!config) return null;
    
    const newAnnotation: ChartAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    
    const updatedConfig = await ChartConfigManager.updateConfiguration(configId, {
      annotations: [...config.annotations, newAnnotation],
      updatedAt: Date.now()
    });
    
    return updatedConfig ? newAnnotation : null;
  },
  
  /**
   * Remove an annotation from a configuration
   */
  removeAnnotation: async (configId: string, annotationId: string): Promise<boolean> => {
    const config = await ChartConfigManager.getConfigurationById(configId);
    if (!config) return false;
    
    const filteredAnnotations = config.annotations.filter(a => a.id !== annotationId);
    
    if (filteredAnnotations.length === config.annotations.length) {
      return false; // Nothing was removed
    }
    
    const updated = await ChartConfigManager.updateConfiguration(configId, {
      annotations: filteredAnnotations,
      updatedAt: Date.now()
    });
    
    return !!updated;
  }
};

export default ChartConfigManager;