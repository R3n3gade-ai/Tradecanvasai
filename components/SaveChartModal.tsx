import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from 'lucide-react';
import { ChartConfigManager, ChartConfiguration, ChartAnnotation } from '../utils/ChartConfigManager';

interface SaveChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ChartConfiguration) => void;
  symbol: string;
  timeframe: string;
  chartType: string;
  selectedIndicators: string[];
  annotations?: ChartAnnotation[];
}

export const SaveChartModal: React.FC<SaveChartModalProps> = ({
  isOpen,
  onClose,
  onSave,
  symbol,
  timeframe,
  chartType,
  selectedIndicators,
  annotations = []
}) => {
  const [configName, setConfigName] = useState<string>(`${symbol} - ${timeframe}`);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async () => {
    if (!configName.trim()) return;
    
    setIsSaving(true);
    
    try {
      const savedConfig = await ChartConfigManager.saveConfiguration({
        name: configName.trim(),
        symbol,
        timeframe,
        chartType,
        indicators: selectedIndicators,
        annotations: annotations,
      });
      
      onSave(savedConfig);
      onClose();
    } catch (error) {
      console.error('Failed to save chart configuration', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1A] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Save Chart Configuration</DialogTitle>
          <DialogDescription className="text-white/70">
            Save your current chart setup for quick access later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="My Chart Configuration"
              className="bg-[#121212] border-white/10"
              autoFocus
            />
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Symbol</div>
            <div className="text-sm text-white/70">{symbol}</div>
          </div>
          
          <div className="flex space-x-4">
            <div className="space-y-1 flex-1">
              <div className="text-sm font-medium">Timeframe</div>
              <div className="text-sm text-white/70">{timeframe}</div>
            </div>
            
            <div className="space-y-1 flex-1">
              <div className="text-sm font-medium">Chart Type</div>
              <div className="text-sm text-white/70">{chartType}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Indicators</div>
            <div className="text-sm text-white/70">
              {selectedIndicators.length > 0 
                ? selectedIndicators.join(', ')
                : 'None'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Annotations</div>
            <div className="text-sm text-white/70">
              {annotations.length > 0 
                ? `${annotations.length} annotation${annotations.length !== 1 ? 's' : ''}`
                : 'None'}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-white/10 hover:bg-white/5"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!configName.trim() || isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveChartModal;