import React, { useEffect, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5/index';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from '@amcharts/amcharts5/stock';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

export const Charts: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const [toolbarInitialized, setToolbarInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only create chart if the div exists
    if (!chartRef.current) return;

    // Clear any previous chart instance
    if (rootRef.current) {
      rootRef.current.dispose();
    }

    /* Chart code */
    // Create root element
    let root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    // Apply theme
    const myTheme = am5.Theme.new(root);
    myTheme.rule("Grid", ["scrollbar", "minor"]).setAll({
      visible: false
    });

    root.setThemes([
      am5themes_Animated.new(root),
      myTheme
    ]);

    // Create chart
    let chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout,
      pinchZoomX: true
    }));
    
    // Store chart instance for toolbar creation
    chartInstanceRef.current = chart;

    chart.get("colors").set("step", 2);

    // Create axes
    let valueAxisRenderer = am5xy.AxisRendererY.new(root, {
      pan: "zoom"
    });
    valueAxisRenderer.labels.template.setAll({
      centerY: am5.percent(100),
      maxPosition: 0.98
    });
    let valueAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: valueAxisRenderer,
      height: am5.percent(70)
    }));
    valueAxis.axisHeader.children.push(am5.Label.new(root, {
      text: "Value",
      fontWeight: "bold",
      paddingBottom: 5,
      paddingTop: 5
    }));

    let volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      pan: "zoom"
    });
    volumeAxisRenderer.labels.template.setAll({
      centerY: am5.percent(100),
      maxPosition: 0.98
    });
    let volumeAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: volumeAxisRenderer,
      height: am5.percent(30),
      layer: 5,
      numberFormat: "#a"
    }));
    volumeAxis.axisHeader.set("paddingTop", 10);
    volumeAxis.axisHeader.children.push(am5.Label.new(root, {
      text: "Volume",
      fontWeight: "bold",
      paddingTop: 5,
      paddingBottom: 5
    }));

    let dateAxisRenderer = am5xy.AxisRendererX.new(root, {
      pan: "zoom",
      minorGridEnabled: true
    });
    dateAxisRenderer.labels.template.setAll({
      minPosition: 0.01,
      maxPosition: 0.99
    });
    let dateAxis = chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      groupData: true,
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: dateAxisRenderer
    }));
    dateAxis.set("tooltip", am5.Tooltip.new(root, {}));

    let color = root.interfaceColors.get("background");

    // Add series
    let valueSeries = chart.series.push(
      am5xy.CandlestickSeries.new(root, {
        fill: color,
        clustered: false,
        calculateAggregates: true,
        stroke: color,
        name: "MSFT",
        xAxis: dateAxis,
        yAxis: valueAxis,
        valueYField: "Close",
        openValueYField: "Open",
        lowValueYField: "Low",
        highValueYField: "High",
        valueXField: "Date",
        lowValueYGrouped: "low",
        highValueYGrouped: "high",
        openValueYGrouped: "open",
        valueYGrouped: "close",
        legendValueText: "open: {openValueY} low: {lowValueY} high: {highValueY} close: {valueY}",
        legendRangeValueText: "{valueYClose}"
      })
    );

    let valueTooltip = valueSeries.set("tooltip", am5.Tooltip.new(root, {
      getFillFromSprite: false,
      getStrokeFromSprite: true,
      getLabelFillFromSprite: true,
      autoTextColor: false,
      pointerOrientation: "horizontal",
      labelText: "{name}: {valueY} {valueYChangePreviousPercent.formatNumber('[#00ff00]+#,###.##|[#ff0000]#,###.##|[#999999]0')}%"
    }));
    valueTooltip.get("background").set("fill", root.interfaceColors.get("background"));

    let firstColor = chart.get("colors").getIndex(0);
    let volumeSeries = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "MSFT",
      clustered: false,
      fill: firstColor,
      stroke: firstColor,
      valueYField: "Volume",
      valueXField: "Date",
      valueYGrouped: "sum",
      xAxis: dateAxis,
      yAxis: volumeAxis,
      legendValueText: "{valueY}",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    volumeSeries.columns.template.setAll({
      //strokeWidth: 0.5,
      //strokeOpacity: 1,
      //stroke: am5.color(0xffffff)
    });

    // Add legend to axis header
    let valueLegend = valueAxis.axisHeader.children.push(
      am5.Legend.new(root, {
        useDefaultMarker: true
      })
    );
    valueLegend.data.setAll([valueSeries]);

    let volumeLegend = volumeAxis.axisHeader.children.push(
      am5.Legend.new(root, {
        useDefaultMarker: true
      })
    );
    volumeLegend.data.setAll([volumeSeries]);

    // Stack axes vertically
    chart.leftAxesContainer.set("layout", root.verticalLayout);

    // Add cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {}));

    // Add scrollbar
    let scrollbar = chart.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
      orientation: "horizontal",
      height: 50
    }));

    let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      groupData: true,
      groupIntervals: [{
        timeUnit: "week",
        count: 1
      }],
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true
      })
    }));

    let sbValueAxis = scrollbar.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
      valueYField: "Adj Close",
      valueXField: "Date",
      xAxis: sbDateAxis,
      yAxis: sbValueAxis
    }));

    sbSeries.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3
    });

    // Load external data
    am5.net.load("https://www.amcharts.com/wp-content/uploads/assets/stock/MSFT.csv").then(function (result) {
      // Parse loaded data
      let data = am5.CSVParser.parse(result.response, {
        delimiter: ",",
        reverse: true,
        skipEmpty: true,
        useColumnNames: true
      });

      // Process data (convert dates and values)
      let processor = am5.DataProcessor.new(root, {
        dateFields: ["Date"],
        dateFormat: "yyyy-MM-dd",
        numericFields: ["Open", "High", "Low", "Close", "Adj Close", "Volume"]
      });
      processor.processMany(data);

      // Set data
      valueSeries.data.setAll(data);
      volumeSeries.data.setAll(data);
      sbSeries.data.setAll(data);
    });

    // Make stuff animate on load
    chart.appear(1000, 100);
    
    // Create toolbar if available
    try {
      if (toolbarContainerRef.current && window.am5stock && window.am5stock.StockToolbar) {
        console.log("Chart loaded for toolbar", chart);
        console.log("Attempting to create toolbar with stock chart");
        
        // Try to create external toolbar
        try {
          console.log("Attempting to create external toolbar");
          
          // Wait a bit to ensure chart is fully initialized
          setTimeout(() => {
            const toolbar = window.am5stock.StockToolbar.new(root, {
              container: toolbarContainerRef.current,
              stockChart: chart, // Use chart instance directly
              width: am5.percent(100),
              height: 60,
              paddingTop: 10,
              paddingBottom: 10
            });
            
            // Add indicators control if available
            if (window.am5stock.IndicatorControl) {
              toolbar.controls.push(window.am5stock.IndicatorControl.new(root, {
                stockChart: chart
              }));
            }
            
            // Add drawing tools control if available
            if (window.am5stock.DrawingControl) {
              toolbar.controls.push(window.am5stock.DrawingControl.new(root, {
                stockChart: chart
              }));
            }
            
            // Add reset control if available
            if (window.am5stock.ResetControl) {
              toolbar.controls.push(window.am5stock.ResetControl.new(root, {
                stockChart: chart
              }));
            }
            
            // Add settings control if available
            if (window.am5stock.SettingsControl) {
              toolbar.controls.push(window.am5stock.SettingsControl.new(root, {
                stockChart: chart
              }));
            }
            
            setToolbarInitialized(true);
          }, 500);
        } catch (err) {
          console.error("Error creating external toolbar:", err);
          setError("Failed to initialize chart toolbar");
        }
      } else {
        console.error("am5stock or StockToolbar not available");
        setError("Chart toolbar not available");
      }
    } catch (e) {
      console.error("Error creating toolbar:", e);
    }

    // Cleanup function
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      {/* Toolbar container div that replaces the header */}
      <div 
        ref={toolbarContainerRef} 
        className="w-full h-16 flex items-center bg-card/90 backdrop-blur-sm shadow-md relative z-30"
        style={{ minHeight: '64px' }}
      >
        {/* Only show minimal fallback UI if toolbar fails to initialize */}
        {!toolbarInitialized && error && (
          <div className="absolute top-full left-0 right-0 bg-red-900/90 text-white px-4 py-2 text-sm z-50">
            {error}
          </div>
        )}
      </div>
      
      {/* Chart container */}
      <div className="flex-1 h-[calc(100vh-64px)]">
        <div className="w-full h-full" ref={chartRef}></div>
      </div>
    </div>
  );
};

export default Charts;
