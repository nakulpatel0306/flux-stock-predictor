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

// Current stock quote
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
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

// ML model prediction result
export interface PredictionResult {
  direction: 'up' | 'down';
  probability: number;
  expectedReturn: number;
  confidence: 'high' | 'medium' | 'low';
  modelAccuracy: number;
  nextDayPrice: number;
}

// Performance metrics from backtesting
export interface PerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
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

// Yahoo Finance API period types
export type YahooFinancePeriod = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';

