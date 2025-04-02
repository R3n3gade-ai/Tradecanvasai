"use client";

import React, { useEffect, useRef } from "react";

/* Imports */
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export default function Charting() {
  const chartRef = useRef<any>(null);
  const chartControlsRef = useRef<any>(null);

  useEffect(() => {
    // Ensure the chart div exists before trying to create the chart
    const chartDiv = document.getElementById("chartdiv");
    const chartControlsElement = document.getElementById("chartcontrols");
    
    if (!chartDiv || !chartControlsElement) {
      console.error("Required DOM elements not found: chartdiv or chartcontrols");
      return;
    }
    
    /* Chart code */
    // Create root element
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/getting-started/#Root_element
    let root = am5.Root.new("chartdiv");

    // Apply CSS to chart controls container to ensure visibility
    if (chartControlsElement) {
      chartControlsElement.style.color = "#ffffff";
    }

    // Set theme colors for better visibility of controls
    root.interfaceColors.set("background", am5.color(0x121212));
    root.interfaceColors.set("text", am5.color(0xFFFFFF));
    
    // Set up stock chart themes
    root.setThemes([
      am5themes_Animated.new(root),
      am5.Theme.new(root)
    ]);

    // Remove any CSS that might interfere with Settings panel operation
    // Minimal CSS that only sets background colors but does not interfere with controls
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-custom-chart-styles', 'true');
    styleElement.textContent = `
      /* Basic dark theme background */
      #chartdiv, #chartcontrols {
        background-color: #121212;
      }
    `;
    document.head.appendChild(styleElement);

    const myTheme = am5.Theme.new(root);

    myTheme.rule("Grid", ["scrollbar", "minor"]).setAll({
      visible: false
    });
    
    // Add rule to make all text white
    myTheme.rule("Label").setAll({
      fill: am5.color(0xffffff)
    });
    
    // Make toolbar text white
    myTheme.rule("Button").setAll({
      labelFill: am5.color(0xffffff) 
    });
    
    // Make dropdown items white
    myTheme.rule("DropdownList").setAll({
      labelFill: am5.color(0xffffff),
      fillOpacity: 0.8,
      fill: am5.color(0x121212),
      background: am5.Rectangle.new(root, {
        fill: am5.color(0x121212),
        fillOpacity: 0.9
      })
    });
    
    // Make dropdown items visible
    myTheme.rule("DropdownListItem").setAll({
      fill: am5.color(0x121212),
      labelFill: am5.color(0xffffff),
      fillOpacity: 0.8
    });
    
    // Additional toolbar elements
    myTheme.rule("Text").setAll({
      fill: am5.color(0xffffff)
    });
    
    myTheme.rule("Container", ["tooltip"]).setAll({
      background: am5.Rectangle.new(root, {
        fill: am5.color(0x121212),
        fillOpacity: 0.9
      })
    });
    
    // Text in buttons and form fields
    myTheme.rule("Input").setAll({
      color: "#ffffff"
    });
    
    // Toolbar specific styling
    myTheme.rule("StockControl").setAll({
      labelFill: am5.color(0xffffff)
    });
    
    // Period and date selectors
    myTheme.rule("PeriodSelector").setAll({
      labelFill: am5.color(0xffffff)
    });
    
    // Additional theme rules specifically for the settings panel
    myTheme.rule("SettingsControl").setAll({
      fill: am5.color(0x121212),
      backgroundColor: am5.color(0x121212),
      labelFill: am5.color(0xffffff)
    });
    
    // Settings menu items
    myTheme.rule("SettingsMenuItem").setAll({
      fill: am5.color(0x1E1E1E),
      labelFill: am5.color(0xffffff),
      stroke: am5.color(0x333333)
    });
    
    // Menu and dropdown styling
    myTheme.rule("Menu").setAll({
      fill: am5.color(0x1E1E1E),
      fillOpacity: 0.95,
      stroke: am5.color(0x333333),
      paddingTop: 10,
      paddingBottom: 10
    });
    
    // Input fields in settings
    myTheme.rule("Input").setAll({
      backgroundColor: am5.color(0x1E1E1E),
      fill: am5.color(0xffffff),
      borderColor: am5.color(0x333333),
      labelFill: am5.color(0xffffff)
    });

    // Color picker 
    myTheme.rule("ColorSet").setAll({
      colors: [
        am5.color(0xFF0000), // Red
        am5.color(0x00FF00), // Green
        am5.color(0x0000FF), // Blue
        am5.color(0xFFFF00), // Yellow
        am5.color(0xFF00FF), // Magenta
        am5.color(0x00FFFF), // Cyan
        am5.color(0xFFFFFF), // White
        am5.color(0x999999), // Gray
        am5.color(0x555555)  // Dark gray
      ]
    });
    

    root.setThemes([
      am5themes_Animated.new(root),
      myTheme
    ]);


    // Create a stock chart
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/#Instantiating_the_chart
    let stockChart = root.container.children.push(am5stock.StockChart.new(root, {
      paddingRight: 0
    }));

    // The navigator (mini-chart) will be configured after data is loaded


    // Set global number format
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
    root.numberFormatter.set("numberFormat", "#,###.00");


    // Create a main stock panel (chart)
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/#Adding_panels
    let mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
      wheelY: "zoomX",
      panX: true,
      panY: true
    }));


    // Create value axis
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        pan: "zoom",
        // Add visible grid for better readability
        minGridDistance: 30,
        grid: {
          stroke: am5.color(0x333333),
          strokeOpacity: 0.2
        }
      }),
      extraMin: 0.1, // adds some space for for main series
      tooltip: am5.Tooltip.new(root, {}),
      numberFormat: "#,###.00", // Default format, can be changed to percent or logarithmic
      logarithmic: false, // Default to regular scale, can be toggled in settings
      extraTooltipPrecision: 2
    }));

    let dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true,
        // Initialize with default fill to make X-axis fills work in settings
        fill: am5.color(0xFFFFFF),
        fillOpacity: 0 // Start with no fills, can be toggled with settings
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));



    // Add series
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    let valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
      name: "MSFT",
      clustered: false,
      valueXField: "Date",
      valueYField: "Close",
      highValueYField: "High",
      lowValueYField: "Low",
      openValueYField: "Open",
      calculateAggregates: true,
      xAxis: dateAxis,
      yAxis: valueAxis,
      legendValueText: "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
      legendRangeValueText: ""
    }));


    // Set main value series
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/#Setting_main_series
    stockChart.set("stockSeries", valueSeries);


    // Add a stock legend
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/stock-legend/
    let valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
      stockChart: stockChart
    }));


    // Create volume axis
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    let volumeAxisRenderer = am5xy.AxisRendererY.new(root, {});
    volumeAxisRenderer.labels.template.set("forceHidden", true);
    volumeAxisRenderer.grid.template.set("forceHidden", true);

    let volumeValueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      numberFormat: "#.#a",
      height: am5.percent(20),
      y: am5.percent(100),
      centerY: am5.percent(100),
      renderer: volumeAxisRenderer
    }));

    // Add series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    let volumeSeries = mainPanel.series.push(am5xy.ColumnSeries.new(root, {
      name: "Volume",
      clustered: false,
      valueXField: "Date",
      valueYField: "Volume",
      xAxis: dateAxis,
      yAxis: volumeValueAxis,
      legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]"
    }));

    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.5
    });

    // color columns by stock rules
    volumeSeries.columns.template.adapters.add("fill", function (fill, target) {
      let dataItem = target.dataItem;
      if (dataItem) {
        return stockChart.getVolumeColor(dataItem);
      }
      return fill;
    })


    // Set main series
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/#Setting_main_series
    stockChart.set("volumeSeries", volumeSeries);
    valueLegend.data.setAll([valueSeries, volumeSeries]);


    // Add cursor(s)
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    mainPanel.set("cursor", am5xy.XYCursor.new(root, {
      yAxis: valueAxis,
      xAxis: dateAxis,
      snapToSeries: [valueSeries],
      snapToSeriesBy: "y!"
    }));


    // Add scrollbar
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
    let scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
      orientation: "horizontal",
      height: 25  // Reduced by 50% from default of ~50px
    }));
    stockChart.toolsContainer.children.push(scrollbar);
    
    // Style the scrollbar with darker background
    scrollbar.get("background").setAll({
      fill: am5.color(0x1E1E1E),
      fillOpacity: 0.8
    });
    let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true
      })
    }));

    let sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
      valueYField: "Close",
      valueXField: "Date",
      xAxis: sbDateAxis,
      yAxis: sbValueAxis
    }));

    sbSeries.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3
    });


    // Function that dynamically loads data
    function loadData(ticker, series, granularity) {

      // Load external data
      // https://www.amcharts.com/docs/v5/charts/xy-chart/series/#Setting_data
      am5.net.load("https://www.amcharts.com/wp-content/uploads/assets/docs/stock/" + ticker + "_" + granularity + ".csv").then(function (result) {

        // Parse loaded data
        let data = am5.CSVParser.parse(result.response, {
          delimiter: ",",
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
        am5.array.each(series, function (item) {
          item.data.setAll(data);
        });
        
        // Properly initialize candlestick colors to make them customizable in settings
        if (series.includes(valueSeries) && valueSeries.columns && valueSeries.columns.template) {
          // Set default colors for candlesticks
          valueSeries.columns.template.states.create("up", {
            fill: am5.color(0x00FF00),   // Green for up candles
            stroke: am5.color(0x00FF00)
          });
          
          valueSeries.columns.template.states.create("down", {
            fill: am5.color(0xFF0000),   // Red for down candles
            stroke: am5.color(0xFF0000)
          });
          
          // Set default wick color
          valueSeries.strokes.template.set("stroke", am5.color(0xFFFFFF));
        }
        
        // Now that data is loaded, we can safely adjust the navigator height
        // stockChart.get("navigator").set("height", 40); // 50% of default height (80px)
      });
    }

    // Load initial data for the first series
    let currentGranularity = "day";
    loadData("MSFT", [valueSeries, volumeSeries, sbSeries], currentGranularity);

    // Add comparing series
    addComparingSeries("AAPL");


    // Set up main indices selector
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
    let mainSeriesControl = am5stock.DropdownListControl.new(root, {
      stockChart: stockChart,
      name: valueSeries.get("name"),
      icon: am5stock.StockIcons.getIcon("Candlestick Series"),
      fixedLabel: true,
      searchable: true,
      searchCallback: function (query) {
        let mainSeries = stockChart.get("stockSeries");
        let mainSeriesID = mainSeries ? mainSeries.get("name") : "";
        let list = getTicker(query);
        am5.array.each(list, function (item) {
          if (item.id == mainSeriesID) {
            item.disabled = true;
          }
        })
        return list;
      }
    });

    mainSeriesControl.events.on("selected", function (ev) {
      let valueSeries = stockChart.get("stockSeries");
      let volumeSeries = stockChart.get("volumeSeries");

      mainSeriesControl.set("name", ev.item.subLabel);
      valueSeries.set("name", ev.item.subLabel);
      loadData(ev.item.subLabel, [valueSeries, volumeSeries, sbSeries], currentGranularity);
      
      // Remove a compared series for the same index if present
      let comparedSeries = stockChart.getPrivate("comparedSeries");
      am5.array.eachReverse(comparedSeries, function(compared) {
        if (compared.get("name") == valueSeries.get("name")) {
          stockChart.removeComparingSeries(compared);
        }
      })
    });


    // Set up comparison control
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
    let comparisonControl = am5stock.ComparisonControl.new(root, {
      stockChart: stockChart,
      searchable: true,
      searchCallback: function (query) {
        let compared = stockChart.getPrivate("comparedSeries", []);
        let main = stockChart.get("stockSeries");
        if (compared.length > 4) {
          return [{
            label: "A maximum of 5 comparisons added",
            subLabel: "Remove some to add new ones",
            id: "",
            className: "am5stock-list-info"
          }];
        };

        let comparedIds = [];
        am5.array.each(compared, function (series) {
          comparedIds.push(series.get("name"));
        });

        let list = getTicker(query);
        am5.array.each(list, function (item) {
          if (comparedIds.indexOf(item.id) !== -1 || main.get("name") == item.id) {
            item.disabled = true;
          }
        })
        return list;
      }
    });

    comparisonControl.events.on("selected", function (ev) {
      if (ev.item.id != "") {
        addComparingSeries(ev.item.subLabel);
      }
    });

    function addComparingSeries(label) {
      let series = am5xy.LineSeries.new(root, {
        name: label,
        valueYField: "Close",
        calculateAggregates: true,
        valueXField: "Date",
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText: "{valueY.formatNumber('#.00')}"
      });
      let comparingSeries = stockChart.addComparingSeries(series);
      loadData(label, [comparingSeries], currentGranularity);
    }

    function getTicker(search) {
      if (search == "") {
        return [];
      }
      search = search.toLowerCase();
      let tickers = [
        { label: "Apple", subLabel: "AAPL", id: "AAPL" },
        { label: "Advanced Micro Devices", subLabel: "AMD", id: "AMD" },
        { label: "Microsoft", subLabel: "MSFT", id: "MSFT" },
        { label: "Alphabet (Google)", subLabel: "GOOG", id: "GOOG" },
        { label: "Amazon", subLabel: "AMZN", id: "AMZN" },
        { label: "Tesla", subLabel: "TSLA", id: "TSLA" },
        { label: "NVIDIA", subLabel: "NVDA", id: "NVDA" },
        { label: "Netflix", subLabel: "NFLX", id: "NFLX" }
      ];

      return tickers.filter(function (item) {
        return item.label.toLowerCase().match(search) || item.subLabel.toLowerCase().match(search);
      });
    }


    // Set up series type switcher
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/toolbar/series-type-control/
    let seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
      stockChart: stockChart
    });

    seriesSwitcher.events.on("selected", function (ev) {
      setSeriesType(ev.item.id);
    });

    function getNewSettings(series) {
      let newSettings = [];
      am5.array.each(["name", "valueYField", "highValueYField", "lowValueYField", "openValueYField", "calculateAggregates", "valueXField", "xAxis", "yAxis", "legendValueText", "legendRangeValueText", "stroke", "fill"], function (setting) {
        newSettings[setting] = series.get(setting);
      });
      return newSettings;
    }

    function setSeriesType(seriesType) {
      // Get current series and its settings
      let currentSeries = stockChart.get("stockSeries");
      let newSettings = getNewSettings(currentSeries);

      // Remove previous series
      let data = currentSeries.data.values;
      mainPanel.series.removeValue(currentSeries);

      // Create new series
      let series;
      switch (seriesType) {
        case "line":
          series = mainPanel.series.push(am5xy.LineSeries.new(root, newSettings));
          break;
        case "candlestick":
        case "procandlestick":
          newSettings.clustered = false;
          series = mainPanel.series.push(am5xy.CandlestickSeries.new(root, newSettings));
          if (seriesType == "procandlestick") {
            series.columns.template.get("themeTags").push("pro");
          }
          break;
        case "ohlc":
          newSettings.clustered = false;
          series = mainPanel.series.push(am5xy.OHLCSeries.new(root, newSettings));
          break;
      }

      // Set new series as stockSeries
      if (series) {
        valueLegend.data.removeValue(currentSeries);
        series.data.setAll(data);
        stockChart.set("stockSeries", series);
        let cursor = mainPanel.get("cursor");
        if (cursor) {
          cursor.set("snapToSeries", [series]);
        }
        valueLegend.data.insertIndex(0, series);
        
        // Apply appropriate candlestick colors when using candlestick series
        if (seriesType === "candlestick" || seriesType === "procandlestick") {
          // Set colors for candlesticks
          series.columns.template.states.create("up", {
            fill: am5.color(0x00FF00),   // Green for up candles
            stroke: am5.color(0x00FF00)
          });
          
          series.columns.template.states.create("down", {
            fill: am5.color(0xFF0000),   // Red for down candles
            stroke: am5.color(0xFF0000)
          });
          
          // Set wick color
          series.strokes.template.set("stroke", am5.color(0xFFFFFF));
        }
      }
    }


    // Stock toolbar
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock/toolbar/
    let toolbar = am5stock.StockToolbar.new(root, {
      container: document.getElementById("chartcontrols"),
      stockChart: stockChart,
      controls: [
        mainSeriesControl,
        comparisonControl,
        am5stock.IndicatorControl.new(root, {
          stockChart: stockChart,
          legend: valueLegend
        }),
        // First add date range selector
        am5stock.DateRangeSelector.new(root, {
          stockChart: stockChart
        }),
        
        // Add interval control for candle/bar granularity
        am5stock.IntervalControl.new(root, {
          stockChart: stockChart,
          name: "Interval",
          icon: am5stock.StockIcons.getIcon("Interval"),
          fixedLabel: true,
          currentItem: "1 day", // Default to 1 day candles
          items: [
            { id: "1 minute", label: "1m", interval: { timeUnit: "minute", count: 1 } },
            { id: "5 minute", label: "5m", interval: { timeUnit: "minute", count: 5 } },
            { id: "15 minute", label: "15m", interval: { timeUnit: "minute", count: 15 } },
            { id: "30 minute", label: "30m", interval: { timeUnit: "minute", count: 30 } },
            { id: "1 hour", label: "1h", interval: { timeUnit: "hour", count: 1 } },
            { id: "4 hour", label: "4h", interval: { timeUnit: "hour", count: 4 } },
            { id: "1 day", label: "1d", interval: { timeUnit: "day", count: 1 } },
            { id: "1 week", label: "1w", interval: { timeUnit: "week", count: 1 } },
            { id: "1 month", label: "1m", interval: { timeUnit: "month", count: 1 } }
          ],
          events: {
            selected: function(ev) {
              if (ev.item && ev.item.interval) {
                const interval = ev.item.interval;
                
                // Update the chart's base interval
                dateAxis.set("baseInterval", interval);
                
                // Show loading indicator
                stockChart.set("disabled", true);
                
                // Normally here you would reload data with the new interval
                // This is a simulated data reload for demonstration
                setTimeout(() => {
                  // In a real app, you would fetch data based on the new interval
                  // For now, we'll just simulate by adjusting the existing data
                  
                  // Re-enable the chart after "loading"
                  stockChart.set("disabled", false);
                  
                  // Display notification that interval has changed
                  console.log(`Changed to ${ev.item.label} interval`);
                }, 300);
              }
            }
          }
        }),
        
        // Create custom period selector dropdown with proper time selection
        am5stock.DropdownListControl.new(root, {
          stockChart: stockChart,
          name: "Period",
          icon: am5stock.StockIcons.getIcon("Time"),
          fixedLabel: true,
          items: [
            { id: "1D", label: "1D", period: { timeUnit: "day", count: 1 } },
            { id: "5D", label: "5D", period: { timeUnit: "day", count: 5 } },
            { id: "1W", label: "1W", period: { timeUnit: "week", count: 1 } },
            { id: "1M", label: "1M", period: { timeUnit: "month", count: 1 } },
            { id: "3M", label: "3M", period: { timeUnit: "month", count: 3 } },
            { id: "6M", label: "6M", period: { timeUnit: "month", count: 6 } },
            { id: "YTD", label: "YTD", period: { timeUnit: "ytd" } },
            { id: "1Y", label: "1Y", period: { timeUnit: "year", count: 1 } },
            { id: "2Y", label: "2Y", period: { timeUnit: "year", count: 2 } },
            { id: "5Y", label: "5Y", period: { timeUnit: "year", count: 5 } },
            { id: "Max", label: "Max", period: { timeUnit: "max" } }
          ],
          events: {
            selected: function(ev) {
              if (ev.item && ev.item.period) {
                // Get the period from the selected item
                const period = ev.item.period;
                
                // Apply the period selection to zoom the chart
                if (period.timeUnit === "max") {
                  // Zoom to full range
                  dateAxis.zoomToDates(
                    new Date(2018, 0, 1), // Use an earlier date for demo
                    new Date()
                  );
                } else if (period.timeUnit === "ytd") {
                  // Year to date
                  const now = new Date();
                  const startOfYear = new Date(now.getFullYear(), 0, 1);
                  dateAxis.zoomToDates(startOfYear, now);
                } else {
                  // Regular period
                  const now = new Date();
                  let periodEnd = now;
                  let timeUnit = period.timeUnit;
                  let count = period.count || 1;
                  
                  // Calculate the period start based on the timeUnit and count
                  const periodStart = new Date(now);
                  if (timeUnit === "day") {
                    periodStart.setDate(periodStart.getDate() - count);
                  } else if (timeUnit === "week") {
                    periodStart.setDate(periodStart.getDate() - (count * 7));
                  } else if (timeUnit === "month") {
                    periodStart.setMonth(periodStart.getMonth() - count);
                  } else if (timeUnit === "year") {
                    periodStart.setFullYear(periodStart.getFullYear() - count);
                  }
                  
                  dateAxis.zoomToDates(periodStart, periodEnd);
                }
              }
            }
          }
        }),
        seriesSwitcher,
        // Add the DrawingControl with auto-save enabled
        am5stock.DrawingControl.new(root, {
          stockChart: stockChart,
          // Enable auto-saving of drawings for persistence
          autoSave: true,
          // Set specific drawing key for current symbol to save separately for each symbol
          getDrawingKey: function() {
            // Get the current series name (symbol) as the key for storing drawings
            const valueSeries = stockChart.get("stockSeries");
            const seriesName = valueSeries ? valueSeries.get("name") : "default";
            // Create a consistent key format for storing drawings
            return "amcharts_drawings_" + seriesName;
          }
        }),
        am5stock.ResetControl.new(root, {
          stockChart: stockChart
        }),
        // Make sure settings panel works and is properly styled
        am5stock.SettingsControl.new(root, {
          stockChart: stockChart,
          // Initialize with proper theme settings
          themeTags: ["settings"],
          // Ensure settings properly appear in dark theme
          background: am5.Rectangle.new(root, {
            fill: am5.color(0x1E1E1E),
            fillOpacity: 0.95,
            stroke: am5.color(0x333333)
          })
        })
      ]
    })
    
    // Let amCharts fully handle settings control without interference
    // Do not add custom CSS overrides or event handlers that could break functionality


    chartRef.current = root;

    return () => {
      root.dispose();
    };
  }, []);

  return (
    <div className="bg-[#121212] text-foreground min-h-screen flex flex-col">
      <div id="chartcontrols" ref={chartControlsRef} className="p-4 border-b border-white/10 text-white"></div>
      <div id="chartdiv" className="flex-1" style={{ width: "100%", height: "calc(100vh - 60px)" }}></div>
    </div>
  );
}
