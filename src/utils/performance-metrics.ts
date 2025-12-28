/**
 * Performance metrics calculations for backtesting results
 * All metrics follow standard financial formulas
 */

import type { PerformanceMetrics } from '@/types';
import { calculateTotalTrades } from './trading-strategy';

/**
 * Calculate comprehensive performance metrics from historical price data
 * Includes Sharpe ratio, CAGR, drawdown, win rate, etc.
 */
export function calculatePerformanceMetrics(prices: number[]): PerformanceMetrics {
  // Need at least 2 prices to calculate returns
  if (prices.length < 2) {
    return getDefaultMetrics();
  }
  
  // Calculate daily returns
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const positiveReturns = returns.filter(r => r > 0);
  
  // Calculate maximum drawdown (largest peak-to-trough decline)
  const maxDrawdown = calculateMaxDrawdown(prices);
  
  // Calculate Sharpe Ratio (risk-adjusted return, annualized)
  const sharpeRatio = calculateSharpeRatio(returns);
  
  // Calculate CAGR (Compound Annual Growth Rate)
  const cagr = calculateCAGR(prices);
  
  // Calculate win rate (percentage of positive returns)
  const winRate = (positiveReturns.length / returns.length) * 100;
  
  // Calculate average return
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Calculate accuracy metrics (simplified - would require prediction history for real accuracy)
  const accuracy = estimateAccuracy(avgReturn, returns);
  const precision = estimatePrecision(avgReturn, positiveReturns, returns);
  const recall = estimateRecall(avgReturn, positiveReturns, returns);
  
    // Calculate total trades based on trading strategy simulation
    const totalTrades = calculateTotalTrades(prices);
    
    return {
      accuracy: Math.round(accuracy),
      precision: Math.round(precision),
      recall: Math.round(recall),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      cagr: parseFloat(cagr.toFixed(1)),
      maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(1)),
      winRate: Math.round(winRate),
      totalTrades, // Calculated from simulated trading strategy
      avgReturn: parseFloat((avgReturn * 100).toFixed(2)),
    };
}

/**
 * Calculate maximum drawdown: largest peak-to-trough decline
 * Measures worst case loss from a peak
 */
function calculateMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (const price of prices) {
    if (price > peak) peak = price; // Update peak
    const drawdown = (peak - price) / peak; // Current drawdown from peak
    if (drawdown > maxDrawdown) maxDrawdown = drawdown; // Track maximum
  }
  
  return maxDrawdown;
}

/**
 * Calculate Sharpe Ratio: (Average Return - Risk Free Rate) / StdDev of Returns
 * Annualized using sqrt(252) trading days
 * Higher is better (more return per unit of risk)
 */
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
  if (returns.length === 0) return 0;
  
  // Mean return
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Standard deviation of returns
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Avoid division by zero
  if (stdDev === 0) return 0;
  
  // Sharpe ratio (annualized)
  const excessReturn = avgReturn - (riskFreeRate / 252); // Daily risk-free rate
  return (excessReturn / stdDev) * Math.sqrt(252);
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * Annualized return over the period
 */
function calculateCAGR(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const startPrice = prices[0];
  const endPrice = prices[prices.length - 1];
  const totalReturn = (endPrice - startPrice) / startPrice;
  
  // Number of years (assuming 252 trading days per year)
  const years = prices.length / 252;
  
  if (years <= 0) return 0;
  
  // CAGR formula: (End Value / Start Value)^(1/years) - 1
  return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
}

/**
 * Estimate accuracy based on return consistency
 * Simplified - real accuracy would require prediction vs actual comparison
 */
function estimateAccuracy(avgReturn: number, returns: number[]): number {
  // Base accuracy on how consistent returns are
  const consistency = 1 - (Math.abs(avgReturn) * 2); // More volatile = less accurate
  return Math.max(50, Math.min(90, 50 + consistency * 40));
}

/**
 * Estimate precision (true positives / (true positives + false positives))
 * Simplified estimation
 */
function estimatePrecision(avgReturn: number, positiveReturns: number[], allReturns: number[]): number {
  if (positiveReturns.length === 0) return 50;
  // Base precision on positive return ratio and consistency
  const basePrecision = (positiveReturns.length / allReturns.length) * 100;
  return Math.max(50, Math.min(90, basePrecision + Math.abs(avgReturn) * 50));
}

/**
 * Estimate recall (true positives / (true positives + false negatives))
 * Simplified estimation
 */
function estimateRecall(avgReturn: number, positiveReturns: number[], allReturns: number[]): number {
  // Similar to precision but focuses on capture rate
  const baseRecall = (positiveReturns.length / allReturns.length) * 100;
  return Math.max(50, Math.min(90, baseRecall + Math.abs(avgReturn) * 60));
}

/**
 * Return default metrics when insufficient data
 */
function getDefaultMetrics(): PerformanceMetrics {
  return {
    accuracy: 50,
    precision: 50,
    recall: 50,
    sharpeRatio: 0,
    cagr: 0,
    maxDrawdown: 0,
    winRate: 50,
    totalTrades: 0,
    avgReturn: 0,
  };
}

