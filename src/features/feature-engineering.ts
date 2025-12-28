/**
 * Feature engineering utilities for ML models
 * Normalizes and transforms technical indicators into model inputs
 */

import type { TechnicalIndicators } from '@/types';

/**
 * Normalize technical indicators into feature vector for ML models
 * Returns 8 normalized features suitable for neural network input
 */
export function normalizeFeatures(
  indicators: TechnicalIndicators,
  currentPrice: number
): number[] {
  return [
    // Feature 1: SMA5 deviation from current price (percentage)
    (indicators.sma5 - currentPrice) / currentPrice,
    
    // Feature 2: SMA20 deviation from current price (percentage)
    (indicators.sma20 - currentPrice) / currentPrice,
    
    // Feature 3: SMA50 deviation from current price (percentage)
    (indicators.sma50 - currentPrice) / currentPrice,
    
    // Feature 4: Normalized RSI (-1 to 1, centered at 0)
    (indicators.rsi - 50) / 50,
    
    // Feature 5: Normalized MACD (as percentage of price)
    indicators.macd / currentPrice,
    
    // Feature 6: Normalized MACD Signal (as percentage of price)
    indicators.macdSignal / currentPrice,
    
    // Feature 7: Volatility (already normalized)
    indicators.volatility,
    
    // Feature 8: Recent momentum (average of last 5 returns)
    indicators.returns.length >= 5
      ? indicators.returns.slice(-5).reduce((sum, r) => sum + r, 0) / 5
      : 0,
  ];
}

