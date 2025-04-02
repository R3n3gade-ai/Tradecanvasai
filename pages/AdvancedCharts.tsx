import React, { useState, useEffect } from 'react';
import { Search, Info, Activity, Lightbulb, Layers, LineChart, Save, Download, X, Pencil } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import ChartContainer, { Annotation } from '../components/ChartContainer';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import brain from 'brain';
import SaveChartModal from '../components/SaveChartModal';
import { ChartConfigManager, ChartConfiguration } from '../utils/ChartConfigManager';

interface ChartState {
  symbol: string;
  timeframe: string;
}

interface SavedChart extends ChartConfiguration {
  selected?: boolean;
}

const popularStocks = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
];

export const AdvancedCharts: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [symbol, setSymbol] = useState('SPY');
  const [chartState, setChartState] = useState<ChartState>({ 
    symbol: 'SPY', 
    timeframe: '1day' 
  });
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['volume', 'ema20']);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedChart[]>([]);
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);
  const [chartAnnotations, setChartAnnotations] = useState<Annotation[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchInput.trim()) {
      // Simple validation for ticker symbols
      const cleanSymbol = searchInput.trim().toUpperCase();
      if (/^[A-Z]{1,5}$/.test(cleanSymbol)) {
        setSymbol(cleanSymbol);
        setChartState(prev => ({ ...prev, symbol: cleanSymbol }));
        toast.success(`Loaded chart for ${cleanSymbol}`);
      } else {
        toast.error('Please enter a valid stock symbol (1-5 letters)');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAnalyzeChart = async (symbol: string, timeframe: string) => {
    setAnalysisLoading(true);
    setAnalysisResult('');

    try {
      // Use streaming endpoint for better UX
      let fullResponse = '';
      for await (const chunk of brain.analyze_chart_streaming({
        symbol,
        timeframe
      })) {
        fullResponse += chunk;
        setAnalysisResult(fullResponse);
      }
      
      if (!fullResponse) {
        throw new Error('No analysis was returned');
      }
    } catch (error) {
      console.error('Error analyzing chart:', error);
      toast.error('Failed to analyze chart');
      setAnalysisResult('Sorry, there was an error analyzing this chart. Please try again later.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleNavigateToTed = () => {
    navigate('/TedAI');
  };
  
  const handleAnnotationAdded = (annotation: Annotation) => {
    setChartAnnotations(prev => [...prev, annotation]);
    toast.success('Annotation added');
  };
  
  const handleAnnotationRemoved = (annotationId: string) => {
    setChartAnnotations(prev => prev.filter(a => a.id !== annotationId));
    toast.success('Annotation removed');
  };
  
  useEffect(() => {
    // Load saved configurations when the component mounts
    const loadSavedConfigs = async () => {
      const configs = await ChartConfigManager.getConfigurations();
      setSavedConfigs(configs);
    };
    
    loadSavedConfigs();
  }, []);

  const handleSaveChart = async (configData: ChartConfiguration) => {
    try {
      // Include current annotations in the saved config
      const configWithAnnotations = {
        ...configData,
        annotations: chartAnnotations.map(a => ({
          id: a.id,
          text: a.text,
          price: a.price,
          time: a.time,
          color: a.color || '#FFD700',
          symbol: chartState.symbol
        }))
      };
      
      let updatedConfig;
      if (activeConfigId) {
        // Update existing config
        updatedConfig = await ChartConfigManager.updateConfiguration(activeConfigId, configWithAnnotations);
      } else {
        // Create new config
        updatedConfig = await ChartConfigManager.saveConfiguration(configWithAnnotations);
      }
      
      if (updatedConfig) {
        setActiveConfigId(updatedConfig.id);
        const configs = await ChartConfigManager.getConfigurations();
        setSavedConfigs(configs.map(c => ({
          ...c,
          selected: c.id === updatedConfig.id
        })));
      }
      
      setSaveModalOpen(false);
      toast.success(`Chart configuration "${configData.name}" saved`);
    } catch (error) {
      console.error('Error saving chart configuration:', error);
      toast.error('Failed to save chart configuration');
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      const success = await ChartConfigManager.deleteConfiguration(id);
      if (success) {
        const configs = await ChartConfigManager.getConfigurations();
        setSavedConfigs(configs);
        
        // If we deleted the active config, clear the active config id and annotations
        if (id === activeConfigId) {
          setActiveConfigId(null);
          setChartAnnotations([]);
        }
        
        toast.success('Chart configuration deleted');
      }
    } catch (error) {
      console.error('Error deleting chart configuration:', error);
      toast.error('Failed to delete chart configuration');
    }
  };

  const handleLoadConfig = async (config: ChartConfiguration) => {
    setSymbol(config.symbol);
    setChartState({
      symbol: config.symbol,
      timeframe: config.timeframe
    });
    setSelectedIndicators(config.indicators);
    setActiveConfigId(config.id);
    
    // Load annotations if any
    if (config.annotations && Array.isArray(config.annotations)) {
      const annotations: Annotation[] = config.annotations.map(a => ({
        id: a.id,
        text: a.text,
        price: a.price,
        time: a.time,
        color: a.color
      }));
      setChartAnnotations(annotations);
    } else {
      setChartAnnotations([]);
    }
    
    // Update saved configs to show which one is selected
    setSavedConfigs(prev => prev.map(c => ({
      ...c,
      selected: c.id === config.id
    })));
    
    toast.success(`Loaded chart configuration "${config.name}"`);
    setShowSavedConfigs(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 p-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Advanced Charts</h1>
            <p className="text-sm text-muted-foreground">Interactive chart analysis with technical indicators</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSavedConfigs(!showSavedConfigs)}
              className="flex items-center gap-1"
            >
              <Layers className="h-4 w-4" />
              <span>Saved Charts</span>
              {savedConfigs.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedConfigs.length}</Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              <span>Save Chart</span>
            </Button>
            <Button variant="outline" onClick={handleNavigateToTed} className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>TED AI Analysis</span>
            </Button>
          </div>
        </div>

        {/* Saved Configurations Panel */}
        {showSavedConfigs && (
          <Card className="border-white/10 bg-[#1E1E2D] mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Saved Chart Configurations</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSavedConfigs(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Load or manage your saved chart configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {savedConfigs.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No saved configurations yet. Save your first chart configuration to see it here.
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {savedConfigs.map((config) => (
                      <div 
                        key={config.id} 
                        className={`flex justify-between items-center p-2 rounded-md hover:bg-black/20 border ${config.selected ? 'border-primary' : 'border-white/5'} ${config.selected ? 'bg-primary/10' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{config.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.symbol} • {config.timeframe} • 
                            {new Date(config.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleLoadConfig(config)}
                            className="h-8 px-2"
                          >
                            <span className="sr-only">Load</span>
                            <span>Load</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteConfig(config.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <span className="sr-only">Delete</span>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search & Quick Access */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 w-full max-w-sm items-center space-x-2">
            <Input 
              type="text" 
              placeholder="Enter stock symbol..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-white/10"
            />
            <Button onClick={handleSearch} type="submit" className="px-4">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularStocks.map((stock) => (
              <Button 
                key={stock.symbol} 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSymbol(stock.symbol);
                  setChartState(prev => ({ ...prev, symbol: stock.symbol }));
                }}
                className={`border-white/10 ${chartState.symbol === stock.symbol ? 'bg-primary/10 border-primary' : ''}`}
              >
                {stock.symbol}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="bg-[#1E1E2D] border border-white/10">
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            {/* Technical Indicators Panel */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-md p-4 mb-4">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <Activity className="h-4 w-4 text-primary" />
                  Technical Indicators
                </h3>
                <Button
                  size="sm"
                  variant={isAnnotating ? "default" : "outline"}
                  className={`flex items-center gap-1 py-1 px-2 h-auto text-xs ${isAnnotating ? 'bg-primary text-background' : 'bg-[#1E1E2D] border-white/10'}`}
                  onClick={() => setIsAnnotating(!isAnnotating)}
                >
                  <Pencil className="h-3 w-3" />
                  {isAnnotating ? 'Annotating' : 'Add Annotations'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'macd', label: 'MACD', icon: <LineChart className="h-3 w-3" /> },
                  { id: 'rsi', label: 'RSI', icon: <Activity className="h-3 w-3" /> },
                  { id: 'ema9', label: 'EMA 9', icon: <Layers className="h-3 w-3" /> },
                  { id: 'ema20', label: 'EMA 20', icon: <Layers className="h-3 w-3" /> }, 
                  { id: 'ema50', label: 'EMA 50', icon: <Layers className="h-3 w-3" /> },
                  { id: 'bollinger', label: 'Bollinger Bands', icon: <Lightbulb className="h-3 w-3" /> }
                ].map(indicator => (
                  <Button 
                    key={indicator.id}
                    size="sm"
                    variant={selectedIndicators.includes(indicator.id) ? "default" : "outline"}
                    className={`flex items-center gap-1 py-1 px-2 h-auto text-xs ${selectedIndicators.includes(indicator.id) ? 'bg-primary text-background' : 'bg-[#1E1E2D] border-white/10'}`}
                    onClick={() => {
                      if (selectedIndicators.includes(indicator.id)) {
                        setSelectedIndicators(prev => prev.filter(id => id !== indicator.id));
                      } else {
                        setSelectedIndicators(prev => [...prev, indicator.id]);
                      }
                    }}
                  >
                    {indicator.icon}
                    {indicator.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Main Chart Container */}
            <ChartContainer
              symbol={chartState.symbol}
              initialTimeframe="1day"
              initialChartType="candlestick"
              showToolbar={true}
              height={650}
              darkMode={true}
              onAnalyzeClicked={handleAnalyzeChart}
              selectedIndicators={selectedIndicators}
              annotations={chartAnnotations}
              onAnnotationAdded={handleAnnotationAdded}
              onAnnotationRemoved={handleAnnotationRemoved}
              isAnnotating={isAnnotating}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card className="border-white/10 bg-[#1E1E2D]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Technical Analysis: {chartState.symbol}</span>
                  {analysisLoading && <span className="text-sm font-normal text-muted-foreground animate-pulse">Analyzing...</span>}
                </CardTitle>
                <CardDescription>
                  AI-powered technical analysis of price movements and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="analysis-content font-mono text-sm whitespace-pre-wrap p-4 bg-[#121212] rounded-md border border-white/10 min-h-[300px] max-h-[500px] overflow-y-auto"
                >
                  {analysisResult ? (
                    <div dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <div className="text-muted-foreground">
                      {analysisLoading 
                        ? 'Analyzing chart data...'
                        : 'Click the "Analyze" button on the chart to generate a technical analysis'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Chart Modal */}
      <SaveChartModal 
        isOpen={isSaveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveChart}
        symbol={chartState.symbol}
        timeframe={chartState.timeframe}
        chartType="candlestick"
        selectedIndicators={selectedIndicators}
        annotations={chartAnnotations}
      />
    </DashboardLayout>
  );
};

export default AdvancedCharts;
