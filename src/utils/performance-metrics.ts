/**
 * Risk and return statistics for a price history
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
  
    // Calculate total trades based on trading strategy simulation
    const totalTrades = calculateTotalTrades(prices);
    
    return {
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
 * Return default metrics when insufficient data
 */
function getDefaultMetrics(): PerformanceMetrics {
  return {
    sharpeRatio: 0,
    cagr: 0,
    maxDrawdown: 0,
    winRate: 50,
    totalTrades: 0,
    avgReturn: 0,
  };
}

