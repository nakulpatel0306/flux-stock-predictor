/**
 * Core type definitions for the stock prediction application
 */

// Stock data point from API
export interface StockDataPoint {
  date: string;
  price: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

// Technical indicators calculated from price data
export interface TechnicalIndicators {
  prices: number[];
  sma5: number;
  sma20: number;
  sma50: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  volatility: number;
  returns: number[];
  volume: number[];
}

// Directional results of the trained models on the most recent days, which they never saw in training
export interface HoldoutMetrics {
  samples: number;
  trainSamples: number;
  accuracy: number;
  // Null when the models never called "up" (precision) or the holdout had no up days (recall)
  precision: number | null;
  recall: number | null;
  // Accuracy of always predicting "up" on the same days, the bar the models have to beat
  baselineAccuracy: number;
}

// ML model prediction result
export interface PredictionResult {
  direction: 'up' | 'down';
  // Probability of the predicted direction, 50-100
  probability: number;
  expectedReturn: number;
  confidence: 'high' | 'medium' | 'low';
  nextDayPrice: number;
  method: 'ensemble' | 'rules';
  holdout: HoldoutMetrics | null;
}

// Risk and return statistics for the fetched price history
export interface PerformanceMetrics {
  sharpeRatio: number;
  cagr: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
}

// Chart data point with trading signals
export interface ChartDataPoint {
  date: string;
  price: number;
  signal?: 'buy' | 'sell';
  volume: number;
}

// Analysis data structure combining all results
export interface AnalysisData {
  priceData: ChartDataPoint[];
  prediction: PredictionResult;
  metrics: PerformanceMetrics;
}

// Daily price history lookback
export type HistoryPeriod = '1mo' | '3mo' | '6mo' | '1y';

