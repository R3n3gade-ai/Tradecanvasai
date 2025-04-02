import React, { useEffect, useRef, useState } from 'react';
import { PolygonBar, PolygonDataService, Timeframe } from '../utils/polygonDataService';

// AmCharts imports
import * as am5 from '@amcharts/amcharts5/index';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from '@amcharts/amcharts5/stock';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { toast } from 'sonner';

export interface ChartAnnotation {
  id: string;
  text: string;
  price: number;
  time: number;
  color?: string;
  symbol: string;
}

interface AmStockChartProps {
  symbol: string;
  timeframe?: Timeframe;
  height?: number | string;
  width?: number | string;
  darkMode?: boolean;
  showControls?: boolean;
  onChartLoaded?: (stockChart: am5stock.StockChart) => void;
  controlsContainerId?: string;
  selectedIndicators?: string[];
  annotations?: ChartAnnotation[];
  isAnnotating?: boolean;
  onAnnotationAdded?: (annotation: ChartAnnotation) => void;
  onAnnotationRemoved?: (annotationId: string) => void;
  chartType?: 'candlestick' | 'line' | 'area' | 'bar';
}

export const AmStockChart: React.FC<AmStockChartProps> = ({
  symbol,
  timeframe = '1day',
  height = 500,
  width = '100%',
  darkMode = true,
  showControls = true,
  onChartLoaded,
  controlsContainerId,
  selectedIndicators = ['volume'],
  annotations = [],
  isAnnotating = false,
  onAnnotationAdded,
  onAnnotationRemoved,
  chartType = 'candlestick',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<{
    root: am5.Root;
    stockChart: am5stock.StockChart;
    mainPanel?: am5stock.StockPanel;
    mainSeries?: am5xy.CandlestickSeries;
    isDisposed: boolean;
  }>({} as any);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotationLines, setAnnotationLines] = useState<{[id: string]: am5.DataItem<any>}>({});
  const [tempAnnotation, setTempAnnotation] = useState<{price: number, time: number} | null>(null);
  
  // Format Polygon data for AmCharts
  const formatPolygonData = (bars: PolygonBar[]) => {
    return bars.map(bar => ({
      Date: bar.t,
      Open: bar.o,
      High: bar.h,
      Low: bar.l,
      Close: bar.c,
      Volume: bar.v
    }));
  };

  // Load chart data when timeframe changes but chart is already initialized
  useEffect(() => {
    // Skip initial load as it's handled in chart initialization
    if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed || !symbol) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Loading data for ${symbol} with timeframe ${timeframe}`);
        const response = await PolygonDataService.getHistoricalBars(symbol, timeframe);

        if (response.status === 'success' && response.bars.length > 0) {
          const formattedData = formatPolygonData(response.bars);

          if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed) {
            // Update data
            const { stockChart } = chartInstanceRef.current;
            const mainPanel = stockChart.panels.getIndex(0);

            if (mainPanel) {
              const valueSeries = mainPanel.series.getIndex(0);
              const volumeSeries = mainPanel.series.getIndex(1);

              if (valueSeries && volumeSeries) {
                valueSeries.data.setAll(formattedData);
                volumeSeries.data.setAll(formattedData);

                // Update scrollbar chart data
                const scrollbar = mainPanel.get('scrollbarX') as am5xy.XYChartScrollbar;
                if (scrollbar && scrollbar.chart) {
                  const sbSeries = scrollbar.chart.series.getIndex(0);
                  if (sbSeries) {
                    sbSeries.data.setAll(formattedData);
                  }
                }
              }
            }
          }
        } else {
          setError('No data available for this symbol');
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [timeframe]);  // Only run when timeframe changes, symbol changes rebuild the chart entirely

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current || !symbol) return;

    // Clear previous chart instance if it exists
    if (chartInstanceRef.current && chartInstanceRef.current.root) {
      chartInstanceRef.current.root.dispose();
      chartInstanceRef.current.isDisposed = true;
    }

    // Create root element
    const root = am5.Root.new(chartRef.current);

    // Set theme
    const myTheme = am5.Theme.new(root);
    myTheme.rule('Grid', ['scrollbar', 'minor']).setAll({
      visible: false
    });

    // Add neo-brutalist design theme
    myTheme.rule('Grid').setAll({
      stroke: am5.color(0x2D2D2D),
      strokeWidth: 1
    });

    myTheme.rule('AxisRenderer').setAll({
      stroke: am5.color(0x666666),
      strokeWidth: 1
    });

    myTheme.rule('AxisLabel').setAll({
      fill: am5.color(0xB0B0B0),
      fontSize: "0.9em"
    });

    myTheme.rule('AxisLine').setAll({
      stroke: am5.color(0x444444),
      strokeWidth: 2
    });

    myTheme.rule('Label').setAll({
      fill: am5.color(0xFFFFFF),
      fontSize: "0.9em"
    });

    // Add themes
    root.setThemes([
      am5themes_Animated.new(root),
      myTheme
    ]);

    // Create stock chart
    const stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {
        paddingRight: 0
      })
    );

    // Set global number format
    root.numberFormatter.set('numberFormat', '#,###.00');

    // Create a main stock panel (chart)
    const mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: 'zoomX',
        panX: true,
        panY: true,
        height: am5.percent(70)
      })
    );

    // Store the main panel in the ref for later access
    chartInstanceRef.current.mainPanel = mainPanel;

    // Create value axis
    const valueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: 'zoom'
        }),
        extraMin: 0.1, // adds some space for main series
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: '#,###.00',
        extraTooltipPrecision: 2
      })
    );

    const dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: {
          timeUnit: 'day',
          count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {
          pan: 'zoom',
          minorGridEnabled: true
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    // Add series
    const valueSeries = mainPanel.series.push(
      chartType === 'candlestick' ?
      am5xy.CandlestickSeries.new(root, {
        name: symbol,
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Close',
        highValueYField: 'High',
        lowValueYField: 'Low',
        openValueYField: 'Open',
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText: 'open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]',
        legendRangeValueText: '',
        // Neo-brutalist styling
        increasingColor: am5.color(0x4CAF50),
        decreasingColor: am5.color(0xF44336),
        strokeWidth: 2
      }) :
      chartType === 'bar' ?
      am5xy.OHLCSeries.new(root, {
        name: symbol,
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Close',
        highValueYField: 'High',
        lowValueYField: 'Low',
        openValueYField: 'Open',
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText: 'open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]',
        legendRangeValueText: '',
        // Neo-brutalist styling
        increasingColor: am5.color(0x4CAF50),
        decreasingColor: am5.color(0xF44336),
        strokeWidth: 2
      }) :
      chartType === 'line' ?
      am5xy.LineSeries.new(root, {
        name: symbol,
        valueXField: 'Date',
        valueYField: 'Close',
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText: 'close: [bold]{valueY}[/]',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: '{valueY}'
        }),
        // Neo-brutalist styling
        stroke: am5.color(0x1E88E5),
        strokeWidth: 2
      }) :
      // area type or fallback
      am5xy.LineSeries.new(root, {
        name: symbol,
        valueXField: 'Date',
        valueYField: 'Close',
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        fill: am5.color(0x1E88E5),
        fillOpacity: 0.3,
        stroke: am5.color(0x1E88E5),
        strokeWidth: 2,
        legendValueText: 'close: [bold]{valueY}[/]',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: '{valueY}'
        })
      })
    );

    // Set fill gradient for area chart
    if (chartType === 'area' && valueSeries.fills) {
      const fillGradient = am5.LinearGradient.new(root, {
        stops: [{
          color: am5.color(0x1E88E5),
          opacity: 0.5
        }, {
          color: am5.color(0x1E88E5),
          opacity: 0.1
        }],
        rotation: 90
      });

      valueSeries.fills.template.setAll({
        fillGradient,
        visible: true
      });
    }

    // Store the main series in the ref for later access
    chartInstanceRef.current.mainSeries = valueSeries;

    // Set main value series
    stockChart.set('stockSeries', valueSeries);

    // Add a stock legend
    const valueLegend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, {
        stockChart: stockChart
      })
    );

    // Create volume axis
    const volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      inside: true
    });

    volumeAxisRenderer.labels.template.set('forceHidden', true);
    volumeAxisRenderer.grid.template.set('forceHidden', true);

    const volumeValueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        numberFormat: '#.#a',
        height: am5.percent(20),
        y: am5.percent(100),
        centerY: am5.percent(100),
        renderer: volumeAxisRenderer
      })
    );

    // Add volume series with neo-brutalist styling
    const volumeSeries = mainPanel.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Volume',
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Volume',
        xAxis: dateAxis,
        yAxis: volumeValueAxis,
        legendValueText: '[bold]{valueY.formatNumber(\'#,###.0a\')}[/]'
      })
    );

    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.5,
      cornerRadiusTL: 0,
      cornerRadiusTR: 0,
      cornerRadiusBL: 0,
      cornerRadiusBR: 0
    });

    // Color columns by stock rules
    volumeSeries.columns.template.adapters.add('fill', function (fill, target) {
      const dataItem = target.dataItem;
      if (dataItem) {
        return stockChart.getVolumeColor(dataItem);
      }
      return fill;
    });

    // Set main series
    stockChart.set('volumeSeries', volumeSeries);
    valueLegend.data.setAll([valueSeries, volumeSeries]);

    // Add cursor
    mainPanel.set('cursor', am5xy.XYCursor.new(root, {
      yAxis: valueAxis,
      xAxis: dateAxis,
      snapToSeries: [valueSeries],
      snapToSeriesBy: 'y!'
    }));

    // Add scrollbar
    const scrollbar = mainPanel.set(
      'scrollbarX',
      am5xy.XYChartScrollbar.new(root, {
        orientation: 'horizontal',
        height: 50
      })
    );
    stockChart.toolsContainer.children.push(scrollbar);

    const sbDateAxis = scrollbar.chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: {
          timeUnit: 'day',
          count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {})
      })
    );

    const sbValueAxis = scrollbar.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    const sbSeries = scrollbar.chart.series.push(
      am5xy.LineSeries.new(root, {
        valueYField: 'Close',
        valueXField: 'Date',
        xAxis: sbDateAxis,
        yAxis: sbValueAxis
      })
    );

    sbSeries.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3
    });

    // Add indicators based on selectedIndicators prop
    if (selectedIndicators.includes('rsi')) {
      stockChart.indicators.push(am5stock.RelativeStrengthIndex.new(root, { 
        stockChart: stockChart, 
        stockSeries: valueSeries,
        panelHeight: 80
      }));
    }

    if (selectedIndicators.includes('macd')) {
      stockChart.indicators.push(am5stock.MACD.new(root, {
        stockChart: stockChart,
        stockSeries: valueSeries,
        panelHeight: 100,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9
      }));
    }

    if (selectedIndicators.includes('ema9')) {
      stockChart.indicators.push(am5stock.MovingAverageExponential.new(root, { 
        stockChart: stockChart, 
        stockSeries: valueSeries,
        period: 9,
        seriesColor: am5.color(0xFF9800)
      }));
    }

    if (selectedIndicators.includes('ema20')) {
      stockChart.indicators.push(am5stock.MovingAverageExponential.new(root, { 
        stockChart: stockChart, 
        stockSeries: valueSeries,
        period: 20,
        seriesColor: am5.color(0x4CAF50)
      }));
    }

    if (selectedIndicators.includes('ema50')) {
      stockChart.indicators.push(am5stock.MovingAverageExponential.new(root, { 
        stockChart: stockChart, 
        stockSeries: valueSeries,
        period: 50,
        seriesColor: am5.color(0x2196F3)
      }));
    }

    if (selectedIndicators.includes('bollinger')) {
      stockChart.indicators.push(am5stock.BollingerBands.new(root, {
        stockChart: stockChart,
        stockSeries: valueSeries,
        period: 20,
        standardDeviation: 2
      }));
    }

    // Add toolbar if needed and container is available
    if (showControls && (controlsContainerId || document.getElementById('chartcontrols'))) {
      const containerId = controlsContainerId || 'chartcontrols';

      // Create the toolbar
      const toolbar = am5stock.StockToolbar.new(root, {
        container: document.getElementById(containerId),
        stockChart: stockChart,
        controls: [
          am5stock.IndicatorControl.new(root, {
            stockChart: stockChart,
            legend: valueLegend,
            width: 40,
            height: 40,
            cornerRadiusTL: 0,
            cornerRadiusTR: 0,
            cornerRadiusBL: 0,
            cornerRadiusBR: 0
          }),
          am5stock.DrawingControl.new(root, {
            stockChart: stockChart
          }),
          am5stock.ResetControl.new(root, {
            stockChart: stockChart
          }),
          am5stock.SettingsControl.new(root, {
            stockChart: stockChart,
            items: [
              {
                type: "color",
                name: "Background",
                get: () => root.interfaceColors.get("background")?.toString() || "#121212",
                set: (value) => {
                  root.interfaceColors.set("background", am5.color(value));
                }
              },
              {
                type: "switch",
                name: "Dark mode",
                get: () => darkMode,
                set: () => {}
              },
              {
                type: "dropdown",
                name: "Chart Type",
                get: () => chartType,
                options: [
                  { value: "candlestick", text: "Candlestick" },
                  { value: "bar", text: "Bar" },
                  { value: "line", text: "Line" },
                  { value: "area", text: "Area" }
                ],
                set: (value) => {
                  if (onChartLoaded && chartInstanceRef.current.stockChart) {
                    // This is just informational - the actual change happens through React props
                    toast.info(`Chart type will change on next reload`);
                  }
                }
              }
            ]
          })
        ]
      });
    }

    // Save chart instance
    chartInstanceRef.current = {
      root,
      stockChart,
      mainPanel,
      mainSeries: valueSeries,
      isDisposed: false
    };

    // Set up annotation click handling
    mainPanel.events.on('click', function(e) {
      if (isAnnotating && chartInstanceRef.current && chartInstanceRef.current.mainSeries) {
        const xAxis = chartInstanceRef.current.mainSeries.get('xAxis') as am5xy.DateAxis<any>;
        const yAxis = chartInstanceRef.current.mainSeries.get('yAxis') as am5xy.ValueAxis<any>;

        if (!xAxis || !yAxis) return;

        const point = mainPanel.toLocal({
          x: e.point.x,
          y: e.point.y
        });

        if (!point) return;

        const time = xAxis.positionToDate(xAxis.toAxisPosition(point.x)).getTime();
        const price = yAxis.positionToValue(yAxis.toAxisPosition(point.y));

        // Prompt for annotation text
        const text = prompt('Enter annotation note:', '');
        if (text && text.trim()) {
          const newAnnotation: ChartAnnotation = {
            id: `annotation-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            text: text.trim(),
            price,
            time,
            color: '#FF4081',
            symbol
          };

          if (onAnnotationAdded) {
            onAnnotationAdded(newAnnotation);
          }
        }
      }
    });

    // Call onChartLoaded callback if provided
    if (onChartLoaded) {
      onChartLoaded(stockChart);
    }

    // Load initial data
    const loadInitialData = async () => {
      try {
        console.log(`Initial data load for ${symbol} with timeframe ${timeframe}`);
        const response = await PolygonDataService.getHistoricalBars(symbol, timeframe);

        if (response.status === 'success' && response.bars.length > 0) {
          const formattedData = formatPolygonData(response.bars);
          valueSeries.data.setAll(formattedData);
          volumeSeries.data.setAll(formattedData);
          sbSeries.data.setAll(formattedData);
          console.log(`Loaded ${formattedData.length} bars for ${symbol}`);
        } else {
          console.error('No data returned for symbol:', symbol);
          setError('No data available for this symbol');
        }
      } catch (err) {
        console.error('Error loading initial chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    // Only load data if we have a valid symbol
    if (symbol && symbol.trim() !== '') {
      loadInitialData();
    } else {
      console.error('Cannot load data: symbol is empty');
      setError('Symbol is missing');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed) {
        chartInstanceRef.current.root.dispose();
        chartInstanceRef.current.isDisposed = true;
      }
    };
  }, [symbol, chartType]); // Re-initialize when symbol or chart type changes

  // No need for separate chart type effect as we've added chartType to the main dependency array

  // Handle annotations
  useEffect(() => {
    if (!chartInstanceRef.current || !chartInstanceRef.current.mainSeries || chartInstanceRef.current.isDisposed) return;

    // Clear existing annotations
    Object.values(annotationLines).forEach(dataItem => {
      dataItem.dispose();
    });
    setAnnotationLines({});

    // Add new annotations
    const newAnnotationLines: {[id: string]: am5.DataItem<any>} = {};

    if (annotations && annotations.length > 0 && chartInstanceRef.current.mainSeries) {
      const series = chartInstanceRef.current.mainSeries;
      const axis = series.get('yAxis') as am5xy.ValueAxis<any>;

      annotations.forEach(annotation => {
        // Create horizontal line
        const range = axis.createAxisRange(axis.makeDataItem({
          value: annotation.price
        }));

        const grid = range.get('grid');
        if (grid) {
          grid.setAll({
            stroke: am5.color(annotation.color || '#FF4081'),
            strokeWidth: 2,
            strokeDasharray: [2, 2]
          });
        }

        const label = range.get('label');
        if (label) {
          label.setAll({
            text: annotation.text,
            background: am5.RoundedRectangle.new(chartInstanceRef.current!.root, {
              fill: am5.color(annotation.color || '#FF4081'),
              fillOpacity: 0.9,
              cornerRadiusTL: 0,
              cornerRadiusTR: 0,
              cornerRadiusBR: 0,
              cornerRadiusBL: 0
            }),
            fill: am5.color('#FFFFFF'),
            fontSize: 12,
            fontWeight: '600',
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 5,
            paddingBottom: 5
          });
        }

        newAnnotationLines[annotation.id] = range;
      });
    }

    setAnnotationLines(newAnnotationLines);
  }, [annotations]);

  // Update annotating state
  useEffect(() => {
    if (chartInstanceRef.current && !chartInstanceRef.current.isDisposed) {
      if (isAnnotating) {
        // Change cursor to crosshair when annotating
        const root = chartInstanceRef.current.root;
        root.container.set('cursor', 'crosshair');
      } else {
        // Reset cursor
        const root = chartInstanceRef.current.root;
        root.container.set('cursor', 'default');
      }
    }
  }, [isAnnotating]);
  return (
    <div style={{ position: 'relative', width, height }}>
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.1)',
          zIndex: 5
        }}>
          <div className="text-primary flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <div>Loading {symbol} chart data...</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.05)',
          zIndex: 5
        }}>
          <div className="text-error p-4 bg-card rounded-md border border-error/20">
            {error}
          </div>
        </div>
      )}

      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default AmStockChart;