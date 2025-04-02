"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, SeriesType, Time, UTCTimestamp, LineStyle, MouseEventParams, IPriceLine } from 'lightweight-charts';
import { PolygonBar, ChartType } from 'utils/polygonDataService';
import ChartIndicatorsUtil from 'utils/chartIndicators';

export interface Annotation {
  id: string;
  text: string;
  price: number;
  time: number;
  color?: string;
}

export interface StockChartProps {
  data: PolygonBar[];
  symbol: string;
  timeframe: string;
  chartType?: ChartType;
  width?: number;
  height?: number;
  showVolume?: boolean;
  backgroundColor?: string;
  lineColor?: string;
  textColor?: string;
  areaTopColor?: string;
  areaBottomColor?: string;
  upColor?: string;
  downColor?: string;
  indicatorColors?: {
    macd?: string;
    signal?: string;
    histogram?: string;
    rsi?: string;
    overbought?: string;
    oversold?: string;
    ema?: string;
  };
  showToolbar?: boolean;
  onChartCreated?: (chart: IChartApi) => void;
  onNewData?: (data: PolygonBar[]) => void;
  indicators?: string[];
  annotations?: Annotation[];
  isAnnotating?: boolean;
  onAnnotationAdded?: (annotation: Annotation) => void;
  onAnnotationRemoved?: (annotationId: string) => void;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  symbol,
  timeframe,
  chartType = 'candlestick',
  width = 600,
  height = 400,
  showVolume = true,
  backgroundColor = '#121212',
  lineColor = '#2962FF',
  textColor = '#D9D9D9',
  areaTopColor = 'rgba(41, 98, 255, 0.28)',
  areaBottomColor = 'rgba(41, 98, 255, 0.05)',
  upColor = '#26a69a',
  downColor = '#ef5350',
  indicatorColors = {
    macd: '#2962FF',
    signal: '#FF6D00',
    histogram: '#B2DFDB',
    rsi: '#2962FF',
    overbought: '#FF6D00',
    oversold: '#26a69a',
    ema: '#F5C143'
  },
  showToolbar = true,
  onChartCreated,
  onNewData,
  indicators = [],
  annotations = [],
  isAnnotating = false,
  onAnnotationAdded,
  onAnnotationRemoved,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<SeriesType> | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<'histogram'> | null>(null);
  const [indicatorSeries, setIndicatorSeries] = useState<{[key: string]: ISeriesApi<'line'>}>({});
  const [annotationLines, setAnnotationLines] = useState<{[id: string]: IPriceLine}>({});
  const [isDrawingAnnotation, setIsDrawingAnnotation] = useState<boolean>(false);
  const [tempAnnotation, setTempAnnotation] = useState<{price: number, time: number} | null>(null);
  
  // Convert Polygon bars to lightweight-charts compatible format
  const formatCandlestickData = (bars: PolygonBar[]) => {
    return bars.map(bar => ({
      time: (bar.t / 1000) as UTCTimestamp, // Convert ms to seconds for UTCTimestamp
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c
    }));
  };

  const formatVolumeData = (bars: PolygonBar[]) => {
    return bars.map(bar => ({
      time: (bar.t / 1000) as UTCTimestamp,
      value: bar.v,
      color: bar.c >= bar.o ? upColor + '80' : downColor + '80' // Add transparency to volume bars
    }));
  };

  // Line chart data format
  const formatLineData = (bars: PolygonBar[]) => {
    return bars.map(bar => ({
      time: (bar.t / 1000) as UTCTimestamp,
      value: bar.c
    }));
  };

  // Area chart data format
  const formatAreaData = (bars: PolygonBar[]) => {
    return bars.map(bar => ({
      time: (bar.t / 1000) as UTCTimestamp,
      value: bar.c
    }));
  };

  // Bar chart data format
  const formatBarData = (bars: PolygonBar[]) => {
    return bars.map(bar => ({
      time: (bar.t / 1000) as UTCTimestamp,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c
    }));
  };

  // Create and configure the chart instance
  useEffect(() => {
    if (chartContainerRef.current && !chart) {
      // Create the chart instance
      const newChart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: backgroundColor },
          textColor: textColor,
        },
        grid: {
          vertLines: {
            color: 'rgba(42, 46, 57, 0.5)',
          },
          horzLines: {
            color: 'rgba(42, 46, 57, 0.5)',
          },
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.5)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 0, // Vertical mode only
        },
        // Neo-brutalist theme elements
        localization: {
          priceFormatter: (price: number) => price.toFixed(2),
        },
        // Neo-brutalist style adjustments
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      // Set the chart instance
      setChart(newChart);
      
      // Call the callback if provided
      if (onChartCreated) {
        onChartCreated(newChart);
      }
      
      let newSeries;
      
      // Create the main series based on chart type
      switch (chartType) {
        case 'line':
          newSeries = newChart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
          });
          if (data && data.length > 0) {
            newSeries.setData(formatLineData(data));
          }
          break;
          
        case 'area':
          newSeries = newChart.addAreaSeries({
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineColor: lineColor,
            lineWidth: 2,
          });
          if (data && data.length > 0) {
            newSeries.setData(formatAreaData(data));
          }
          break;
          
        case 'bar':
          newSeries = newChart.addBarSeries({
            upColor: upColor,
            downColor: downColor,
            thinBars: false,
          });
          if (data && data.length > 0) {
            newSeries.setData(formatBarData(data));
          }
          break;
          
        case 'candlestick':
        default:
          newSeries = newChart.addCandlestickSeries({
            upColor: upColor,
            downColor: downColor,
            borderVisible: false,
            wickUpColor: upColor,
            wickDownColor: downColor,
          });
          if (data && data.length > 0) {
            newSeries.setData(formatCandlestickData(data));
          }
          break;
      }
      
      setSeries(newSeries);
      
      // Add volume series if enabled
      if (showVolume && data && data.length > 0) {
        const newVolumeSeries = newChart.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        newVolumeSeries.setData(formatVolumeData(data));
        setVolumeSeries(newVolumeSeries);
      }
      
      // Set up chart event handlers for annotations
      newChart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (isAnnotating && isDrawingAnnotation && param.point && param.time && param.seriesPrices.size > 0) {
          const time = param.time as number;
          // Get the price from the main series
          let price = 0;
          for (const [series, value] of param.seriesPrices.entries()) {
            if (series === newSeries) {
              price = value as number;
              break;
            }
          }
          
          if (price !== 0) {
            setTempAnnotation({ price, time });
          }
        }
      });
      
      newChart.subscribeClick((param: MouseEventParams) => {
        if (isAnnotating && param.point && param.time && param.seriesPrices.size > 0) {
          // If we're already drawing an annotation, complete it
          if (isDrawingAnnotation && tempAnnotation) {
            const annotationText = prompt('Enter annotation text:', '');
            if (annotationText) {
              const newAnnotation: Annotation = {
                id: crypto.randomUUID(),
                text: annotationText,
                price: tempAnnotation.price,
                time: tempAnnotation.time,
                color: '#FFD700' // Gold color for annotations
              };
              
              if (onAnnotationAdded) {
                onAnnotationAdded(newAnnotation);
              }
              
              setTempAnnotation(null);
            }
            setIsDrawingAnnotation(false);
          } else {
            // Start drawing an annotation
            setIsDrawingAnnotation(true);
          }
        }
      });
      
      // Fit content for better UX
      newChart.timeScale().fitContent();
    }
    
    return () => {
      if (chart) {
        chart.remove();
        setChart(null);
        setSeries(null);
        setVolumeSeries(null);
      }
    };
  }, []);
  
  // Update chart dimensions when width or height changes
  useEffect(() => {
    if (chart) {
      chart.resize(width, height);
    }
  }, [chart, width, height]);
  
  // Update indicators when the indicators prop changes
  useEffect(() => {
    if (chart && data && data.length > 0) {
      updateIndicators(data, indicators);
    }
  }, [chart, data, indicators]);
  
  // Update chart when annotations change
  useEffect(() => {
    if (series && annotations.length > 0) {
      // Remove old annotation lines
      Object.values(annotationLines).forEach(line => {
        series.removePriceLine(line);
      });
      
      const newAnnotationLines: {[id: string]: IPriceLine} = {};
      
      // Add new annotation lines
      annotations.forEach(annotation => {
        const priceLine = series.createPriceLine({
          price: annotation.price,
          color: annotation.color || '#FFD700',
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: annotation.text,
        });
        
        newAnnotationLines[annotation.id] = priceLine;
      });
      
      setAnnotationLines(newAnnotationLines);
    }
  }, [series, annotations]);
  
  // Update annotating state
  useEffect(() => {
    setIsDrawingAnnotation(false);
    setTempAnnotation(null);
  }, [isAnnotating]);
  
  // Render temporary annotation if drawing
  useEffect(() => {
    if (series && tempAnnotation) {
      // Remove previous temp line if exists
      const tempLine = annotationLines['temp'];
      if (tempLine) {
        series.removePriceLine(tempLine);
      }
      
      // Add new temp line
      const priceLine = series.createPriceLine({
        price: tempAnnotation.price,
        color: '#FFD700',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'New Annotation',
      });
      
      setAnnotationLines(prev => ({
        ...prev,
        temp: priceLine
      }));
      
      return () => {
        if (series) {
          series.removePriceLine(priceLine);
        }
      };
    }
  }, [series, tempAnnotation]);
  
  // Update chart data when data prop changes
  useEffect(() => {
    if (series && data && data.length > 0) {
      // Update based on chart type
      switch (chartType) {
        case 'line':
          series.setData(formatLineData(data));
          break;
        case 'area':
          series.setData(formatAreaData(data));
          break;
        case 'bar':
          series.setData(formatBarData(data));
          break;
        case 'candlestick':
        default:
          series.setData(formatCandlestickData(data));
          break;
      }
      
      // Update volume data if enabled
      if (showVolume && volumeSeries) {
        volumeSeries.setData(formatVolumeData(data));
      }
      
      // Update technical indicators
      if (chart && indicators.length > 0) {
        updateIndicators(data, indicators);
      }
      
      // Fit the content for better user experience
      if (chart) {
        chart.timeScale().fitContent();
      }
      
      // Call the onNewData callback if provided
      if (onNewData) {
        onNewData(data);
      }
    }
  }, [series, volumeSeries, data, chartType, showVolume]);
  
  // Function to update technical indicators on the chart
  const updateIndicators = (data: PolygonBar[], selectedIndicators: string[]) => {
    if (!chart || data.length === 0) return;
    
    // Remove existing indicator series
    Object.values(indicatorSeries).forEach(series => {
      chart.removeSeries(series);
    });
    
    const newIndicatorSeries: {[key: string]: ISeriesApi<'line'>} = {};
    
    // Add each selected indicator
    selectedIndicators.forEach(indicator => {
      try {
        switch (indicator) {
          case 'rsi': {
            // Create RSI pane
            const rsiPane = chart.addPane({
              height: 120,
            });
            
            // Add RSI line
            const rsiSeries = rsiPane.addLineSeries({
              color: indicatorColors.rsi,
              lineWidth: 2,
              title: 'RSI (14)',
            });
            
            // Calculate RSI
            const rsiData = ChartIndicatorsUtil.rsi(data, 14);
            
            // Format RSI data for chart
            const formattedRsiData = rsiData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.value
            }));
            
            rsiSeries.setData(formattedRsiData);
            
            // Add overbought line (70)
            const overboughtSeries = rsiPane.addLineSeries({
              color: indicatorColors.overbought,
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
            });
            
            // Add oversold line (30)
            const oversoldSeries = rsiPane.addLineSeries({
              color: indicatorColors.oversold,
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
            });
            
            // Create horizontal lines for overbought/oversold
            const overboughtData = formattedRsiData.map(d => ({
              time: d.time,
              value: 70
            }));
            
            const oversoldData = formattedRsiData.map(d => ({
              time: d.time,
              value: 30
            }));
            
            overboughtSeries.setData(overboughtData);
            oversoldSeries.setData(oversoldData);
            
            newIndicatorSeries['rsi'] = rsiSeries;
            newIndicatorSeries['rsi-overbought'] = overboughtSeries;
            newIndicatorSeries['rsi-oversold'] = oversoldSeries;
            break;
          }
          
          case 'macd': {
            // Create MACD pane
            const macdPane = chart.addPane({
              height: 120,
            });
            
            // Add MACD lines
            const macdLineSeries = macdPane.addLineSeries({
              color: indicatorColors.macd,
              lineWidth: 2,
              title: 'MACD'
            });
            
            const signalLineSeries = macdPane.addLineSeries({
              color: indicatorColors.signal,
              lineWidth: 1,
              title: 'Signal'
            });
            
            // Add histogram
            const histogramSeries = macdPane.addHistogramSeries({
              color: indicatorColors.histogram,
              title: 'Histogram'
            });
            
            // Calculate MACD (12, 26, 9 are standard parameters)
            const macdData = ChartIndicatorsUtil.macd(data, 12, 26, 9);
            
            // Format MACD data for chart
            const macdLineData = macdData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.macd
            }));
            
            const signalLineData = macdData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.signal
            }));
            
            const histogramData = macdData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.hist,
              color: d.hist >= 0 ? indicatorColors.histogram + '80' : indicatorColors.signal + '80'
            }));
            
            macdLineSeries.setData(macdLineData);
            signalLineSeries.setData(signalLineData);
            histogramSeries.setData(histogramData);
            
            newIndicatorSeries['macd-line'] = macdLineSeries;
            newIndicatorSeries['macd-signal'] = signalLineSeries;
            newIndicatorSeries['macd-hist'] = histogramSeries as any;
            break;
          }
          
          case 'ema9': {
            const ema9Series = chart.addLineSeries({
              color: '#F44336',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: 'EMA 9'
            });
            
            const emaData = ChartIndicatorsUtil.ema(data, 9);
            const formattedEmaData = emaData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.value
            }));
            
            ema9Series.setData(formattedEmaData);
            newIndicatorSeries['ema9'] = ema9Series;
            break;
          }
          
          case 'ema20': {
            const ema20Series = chart.addLineSeries({
              color: '#FF9800',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: 'EMA 20'
            });
            
            const emaData = ChartIndicatorsUtil.ema(data, 20);
            const formattedEmaData = emaData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.value
            }));
            
            ema20Series.setData(formattedEmaData);
            newIndicatorSeries['ema20'] = ema20Series;
            break;
          }
          
          case 'ema50': {
            const ema50Series = chart.addLineSeries({
              color: '#4CAF50',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: 'EMA 50'
            });
            
            const emaData = ChartIndicatorsUtil.ema(data, 50);
            const formattedEmaData = emaData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.value
            }));
            
            ema50Series.setData(formattedEmaData);
            newIndicatorSeries['ema50'] = ema50Series;
            break;
          }
          
          case 'ema200': {
            const ema200Series = chart.addLineSeries({
              color: '#9C27B0',
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              title: 'EMA 200'
            });
            
            const emaData = ChartIndicatorsUtil.ema(data, 200);
            const formattedEmaData = emaData.map(d => ({
              time: (d.time / 1000) as UTCTimestamp,
              value: d.value
            }));
            
            ema200Series.setData(formattedEmaData);
            newIndicatorSeries['ema200'] = ema200Series;
            break;
          }
        }
      } catch (error) {
        console.error(`Error adding indicator ${indicator}:`, error);
      }
    });
    
    setIndicatorSeries(newIndicatorSeries);
  };
  
  // Update chart type when chartType prop changes
  useEffect(() => {
    if (chart && series && data && data.length > 0) {
      // Remove existing series
      chart.removeSeries(series);
      if (volumeSeries) {
        chart.removeSeries(volumeSeries);
      }
      
      let newSeries;
      
      // Create new series based on chart type
      switch (chartType) {
        case 'line':
          newSeries = chart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
          });
          newSeries.setData(formatLineData(data));
          break;
          
        case 'area':
          newSeries = chart.addAreaSeries({
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineColor: lineColor,
            lineWidth: 2,
          });
          newSeries.setData(formatAreaData(data));
          break;
          
        case 'bar':
          newSeries = chart.addBarSeries({
            upColor: upColor,
            downColor: downColor,
            thinBars: false,
          });
          newSeries.setData(formatBarData(data));
          break;
          
        case 'candlestick':
        default:
          newSeries = chart.addCandlestickSeries({
            upColor: upColor,
            downColor: downColor,
            borderVisible: false,
            wickUpColor: upColor,
            wickDownColor: downColor,
          });
          newSeries.setData(formatCandlestickData(data));
          break;
      }
      
      setSeries(newSeries);
      
      // Add volume series if enabled
      if (showVolume) {
        const newVolumeSeries = chart.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        newVolumeSeries.setData(formatVolumeData(data));
        setVolumeSeries(newVolumeSeries);
      }
      
      // Fit the content
      chart.timeScale().fitContent();
    }
  }, [chartType]);

  return (
    <div className="stock-chart-container relative">
      <div 
        ref={chartContainerRef} 
        className="stock-chart w-full h-full"
        style={{ 
          width, 
          height,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative' 
        }}
      />
      {/* Chart header overlay - symbol & timeframe */}
      <div 
        className="absolute top-2 left-2 px-3 py-1.5 bg-[#1E1E2D]/70 backdrop-blur-sm
                  border border-white/10 rounded-sm z-10 flex items-center gap-2"
      >
        <span className="text-sm font-mono font-semibold">{symbol}</span>
        <span className="text-xs text-gray-300 font-mono">{timeframe}</span>
      </div>
    </div>
  );
};

export default StockChart;