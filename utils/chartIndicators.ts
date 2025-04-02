import { PolygonBar } from './polygonDataService';

export interface MacdData {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export interface IndicatorData {
  time: number;  // Timestamp
  value: number; // Indicator value
}

export interface MacdIndicatorData {
  time: number;   // Timestamp
  macd: number;   // MACD line value
  signal: number; // Signal line value
  hist: number;   // Histogram value
}

export interface ChartIndicators {
  // Simple Moving Average (SMA)
  sma: (data: PolygonBar[], period: number) => IndicatorData[];
  
  // Exponential Moving Average (EMA)
  ema: (data: PolygonBar[], period: number) => IndicatorData[];
  
  // Relative Strength Index (RSI)
  rsi: (data: PolygonBar[], period: number) => IndicatorData[];
  
  // Moving Average Convergence Divergence (MACD)
  macd: (data: PolygonBar[], fastPeriod: number, slowPeriod: number, signalPeriod: number) => MacdIndicatorData[];
  
  // Bollinger Bands
  bbands: (data: PolygonBar[], period: number, stdDev: number) => { upper: IndicatorData[], middle: IndicatorData[], lower: IndicatorData[] };
  
  // Volume Weighted Average Price (VWAP)
  vwap: (data: PolygonBar[]) => IndicatorData[];
  
  // Average True Range (ATR)
  atr: (data: PolygonBar[], period: number) => IndicatorData[];
}

// Helper to get closing prices
const getClosePrices = (data: PolygonBar[]): number[] => {
  return data.map(bar => bar.c);
};

// Helper to get timestamps
const getTimestamps = (data: PolygonBar[]): number[] => {
  return data.map(bar => bar.t);
};

// Calculate SMA (Simple Moving Average)
const calculateSMA = (prices: number[], period: number): number[] => {
  const result: number[] = [];
  
  // Need at least 'period' data points to calculate SMA
  if (prices.length < period) {
    return result;
  }
  
  let sum = 0;
  // Calculate first SMA
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  result.push(sum / period);
  
  // Calculate rest using previous SMA
  for (let i = period; i < prices.length; i++) {
    sum = sum - prices[i - period] + prices[i];
    result.push(sum / period);
  }
  
  return result;
};

// Calculate EMA (Exponential Moving Average)
const calculateEMA = (prices: number[], period: number): number[] => {
  const result: number[] = [];
  
  // Need at least 'period' data points
  if (prices.length < period) {
    return result;
  }
  
  // Start with SMA for the first value
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  result.push(ema);
  
  // Calculate EMA for the rest
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
};

// Calculate RSI (Relative Strength Index)
const calculateRSI = (prices: number[], period: number): number[] => {
  const result: number[] = [];
  const deltas: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }
  
  // Need enough data points
  if (deltas.length < period) {
    return result;
  }
  
  // Calculate first average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (deltas[i] > 0) {
      avgGain += deltas[i];
    } else {
      avgLoss += Math.abs(deltas[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate first RSI
  let rs = avgGain / (avgLoss || 1); // Avoid division by zero
  result.push(100 - (100 / (1 + rs)));
  
  // Calculate remaining RSI values
  for (let i = period; i < deltas.length; i++) {
    const delta = deltas[i];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    
    // Use smoothed averages
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    
    rs = avgGain / (avgLoss || 1); // Avoid division by zero
    result.push(100 - (100 / (1 + rs)));
  }
  
  return result;
};

// Calculate MACD (Moving Average Convergence Divergence)
const calculateMACD = (
  prices: number[], 
  fastPeriod: number, 
  slowPeriod: number, 
  signalPeriod: number
): {macdLine: number[], signalLine: number[], histogram: number[]} => {
  // Calculate fast and slow EMA
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // MACD line is fast EMA - slow EMA
  const macdLine: number[] = [];
  const offset = slowPeriod - fastPeriod;
  
  for (let i = 0; i < fastEMA.length; i++) {
    if (i + offset >= 0 && i + offset < slowEMA.length) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Signal line is EMA of MACD line
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Histogram is MACD line - signal line
  const histogram: number[] = [];
  const signalOffset = signalPeriod - 1;
  
  for (let i = signalOffset; i < macdLine.length; i++) {
    histogram.push(macdLine[i] - signalLine[i - signalOffset]);
  }
  
  return { macdLine, signalLine, histogram };
};

// Calculate Bollinger Bands
const calculateBollingerBands = (prices: number[], period: number, stdDev: number): 
  {upper: number[], middle: number[], lower: number[]} => {
  // Middle band is SMA
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  // Calculate standard deviation for each point
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = middle[i - (period - 1)];
    
    // Calculate standard deviation
    let sum = 0;
    for (let j = 0; j < slice.length; j++) {
      sum += Math.pow(slice[j] - sma, 2);
    }
    const stdev = Math.sqrt(sum / period);
    
    // Upper band = middle + (stdDev * standard deviation)
    upper.push(sma + (stdDev * stdev));
    
    // Lower band = middle - (stdDev * standard deviation)
    lower.push(sma - (stdDev * stdev));
  }
  
  return { upper, middle, lower };
};

// Calculate VWAP (Volume Weighted Average Price)
const calculateVWAP = (data: PolygonBar[]): number[] => {
  const result: number[] = [];
  let cumulativeTPV = 0; // Typical Price × Volume
  let cumulativeVolume = 0;
  
  for (let i = 0; i < data.length; i++) {
    const bar = data[i];
    const typicalPrice = (bar.h + bar.l + bar.c) / 3;
    const tpv = typicalPrice * bar.v;
    
    cumulativeTPV += tpv;
    cumulativeVolume += bar.v;
    
    const vwap = cumulativeTPV / cumulativeVolume;
    result.push(vwap);
  }
  
  return result;
};

// Calculate ATR (Average True Range)
const calculateATR = (data: PolygonBar[], period: number): number[] => {
  const trueRanges: number[] = [];
  const result: number[] = [];
  
  // Calculate true ranges
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      // First TR is just High - Low
      trueRanges.push(data[i].h - data[i].l);
    } else {
      // TR = max(high - low, abs(high - prevClose), abs(low - prevClose))
      const tr1 = data[i].h - data[i].l;
      const tr2 = Math.abs(data[i].h - data[i-1].c);
      const tr3 = Math.abs(data[i].l - data[i-1].c);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
  }
  
  // Need enough data points
  if (trueRanges.length < period) {
    return result;
  }
  
  // First ATR is simple average of first 'period' true ranges
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(atr);
  
  // Calculate remaining ATRs using smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    result.push(atr);
  }
  
  return result;
};

export const ChartIndicatorsUtil: ChartIndicators = {
  // Simple Moving Average
  sma: (data: PolygonBar[], period: number): IndicatorData[] => {
    const prices = getClosePrices(data);
    const timestamps = getTimestamps(data);
    const smaValues = calculateSMA(prices, period);
    
    // Align results with original data
    const result: IndicatorData[] = [];
    const offset = period - 1;
    
    for (let i = 0; i < smaValues.length; i++) {
      result.push({
        time: timestamps[i + offset],
        value: smaValues[i]
      });
    }
    
    return result;
  },
  
  // Exponential Moving Average
  ema: (data: PolygonBar[], period: number): IndicatorData[] => {
    const prices = getClosePrices(data);
    const timestamps = getTimestamps(data);
    const emaValues = calculateEMA(prices, period);
    
    // Align results with original data
    const result: IndicatorData[] = [];
    const offset = period - 1;
    
    for (let i = 0; i < emaValues.length; i++) {
      result.push({
        time: timestamps[i + offset],
        value: emaValues[i]
      });
    }
    
    return result;
  },
  
  // Relative Strength Index
  rsi: (data: PolygonBar[], period: number): IndicatorData[] => {
    const prices = getClosePrices(data);
    const timestamps = getTimestamps(data);
    const rsiValues = calculateRSI(prices, period);
    
    // Align results with original data
    const result: IndicatorData[] = [];
    const offset = period;
    
    for (let i = 0; i < rsiValues.length; i++) {
      result.push({
        time: timestamps[i + offset],
        value: rsiValues[i]
      });
    }
    
    return result;
  },
  
  // Moving Average Convergence Divergence
  macd: (data: PolygonBar[], fastPeriod: number, slowPeriod: number, signalPeriod: number): MacdIndicatorData[] => {
    const prices = getClosePrices(data);
    const timestamps = getTimestamps(data);
    const { macdLine, signalLine, histogram } = calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
    
    // Align results with original data
    const result: MacdIndicatorData[] = [];
    const offset = slowPeriod + signalPeriod - 2;
    
    for (let i = 0; i < histogram.length; i++) {
      result.push({
        time: timestamps[i + offset],
        macd: macdLine[i + signalPeriod - 1],
        signal: signalLine[i],
        hist: histogram[i]
      });
    }
    
    return result;
  },
  
  // Bollinger Bands
  bbands: (data: PolygonBar[], period: number, stdDev: number) => {
    const prices = getClosePrices(data);
    const timestamps = getTimestamps(data);
    const { upper, middle, lower } = calculateBollingerBands(prices, period, stdDev);
    
    // Align results with original data
    const upperBand: IndicatorData[] = [];
    const middleBand: IndicatorData[] = [];
    const lowerBand: IndicatorData[] = [];
    const offset = period - 1;
    
    for (let i = 0; i < upper.length; i++) {
      upperBand.push({
        time: timestamps[i + offset],
        value: upper[i]
      });
      
      middleBand.push({
        time: timestamps[i + offset],
        value: middle[i]
      });
      
      lowerBand.push({
        time: timestamps[i + offset],
        value: lower[i]
      });
    }
    
    return { upper: upperBand, middle: middleBand, lower: lowerBand };
  },
  
  // Volume Weighted Average Price
  vwap: (data: PolygonBar[]): IndicatorData[] => {
    const timestamps = getTimestamps(data);
    const vwapValues = calculateVWAP(data);
    
    // Create result array
    const result: IndicatorData[] = [];
    
    for (let i = 0; i < vwapValues.length; i++) {
      result.push({
        time: timestamps[i],
        value: vwapValues[i]
      });
    }
    
    return result;
  },
  
  // Average True Range
  atr: (data: PolygonBar[], period: number): IndicatorData[] => {
    const timestamps = getTimestamps(data);
    const atrValues = calculateATR(data, period);
    
    // Align results with original data
    const result: IndicatorData[] = [];
    const offset = period - 1;
    
    for (let i = 0; i < atrValues.length; i++) {
      result.push({
        time: timestamps[i + offset],
        value: atrValues[i]
      });
    }
    
    return result;
  }
};

export default ChartIndicatorsUtil;