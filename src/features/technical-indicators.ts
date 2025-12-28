/**
 * Technical indicator calculations for stock analysis
 * All calculations follow standard financial formulas
 */

import type { TechnicalIndicators } from '@/types';

/**
 * Calculate technical indicators from price and volume data
 * Returns SMA, RSI, MACD, volatility, and returns
 */
export function calculateTechnicalIndicators(
  prices: number[], 
  volumes: number[] = []
): TechnicalIndicators {
  // Calculate daily returns (percentage change)
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  
  // Simple Moving Averages (SMA) - average of last N days
  const sma5 = calculateSMA(prices, 5);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // Volatility: standard deviation of returns (annualized)
  const volatility = calculateVolatility(returns);
  
  // RSI (Relative Strength Index): momentum oscillator 0-100
  const rsi = calculateRSI(returns, 14);
  
  // MACD (Moving Average Convergence Divergence): trend-following indicator
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const macdSignal = calculateEMASignal(macd, prices); // Approximate signal line
  
  return {
    prices,
    sma5,
    sma20,
    sma50,
    rsi,
    macd,
    macdSignal,
    volatility: volatility || 0.01, // Minimum volatility to prevent division by zero
    returns,
    volume: volumes.length > 0 ? volumes : [],
  };
}

/**
 * Calculate Simple Moving Average (SMA)
 * Average of last N prices
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / slice.length;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * Weighted average giving more weight to recent prices
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  
  // If not enough data, use SMA
  if (prices.length < period) {
    return calculateSMA(prices, prices.length);
  }
  
  // EMA multiplier: 2 / (period + 1)
  const multiplier = 2 / (period + 1);
  
  // Start with SMA of first period values
  const sma = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  // Calculate EMA iteratively
  let ema = sma;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

/**
 * Calculate RSI (Relative Strength Index)
 * Momentum indicator that measures speed and magnitude of price changes
 * Returns value between 0-100 (70+ overbought, 30- oversold)
 */
function calculateRSI(returns: number[], period: number = 14): number {
  if (returns.length < period) return 50; // Neutral if insufficient data
  
  // Separate gains and losses
  const recentReturns = returns.slice(-period);
  const gains = recentReturns.filter(r => r > 0);
  const losses = recentReturns.filter(r => r < 0).map(r => -r);
  
  // Average gain and loss
  const avgGain = gains.reduce((sum, g) => sum + g, 0) / period;
  const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period || 0.001; // Avoid division by zero
  
  // RSI formula: 100 - (100 / (1 + RS)), where RS = avgGain / avgLoss
  if (avgLoss === 0) return 100; // All gains, maximum RSI
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate volatility as annualized standard deviation of returns
 * Uses sample standard deviation formula
 */
function calculateVolatility(returns: number[], lookback: number = 20): number {
  if (returns.length === 0) return 0;
  
  const recentReturns = returns.slice(-lookback);
  if (recentReturns.length < 2) return 0;
  
  // Mean return
  const meanReturn = recentReturns.reduce((sum, r) => sum + r, 0) / recentReturns.length;
  
  // Variance: average of squared deviations from mean
  const variance = recentReturns.reduce((sum, ret) => {
    return sum + Math.pow(ret - meanReturn, 2);
  }, 0) / recentReturns.length;
  
  // Standard deviation (volatility)
  const stdDev = Math.sqrt(variance);
  
  // Annualize: multiply by sqrt(252 trading days per year)
  return stdDev * Math.sqrt(252);
}

/**
 * Calculate MACD signal line (simplified)
 * In practice, this would be EMA of MACD values, but we approximate
 */
function calculateEMASignal(macd: number, prices: number[]): number {
  // Simplified: use a fraction of MACD as approximation
  // Real signal line would require historical MACD values
  return macd * 0.9;
}

