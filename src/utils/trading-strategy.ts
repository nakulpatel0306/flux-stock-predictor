/**
 * Trading Strategy Utilities
 * Simulates trading strategies for backtesting
 */

/**
 * Calculate total trades executed based on buy/sell signals
 * Counts each buy->sell or sell->buy transition as a trade
 */
export function calculateTotalTrades(prices: number[]): number {
  if (prices.length < 10) return 0;
  
  let trades = 0;
  let position: 'long' | 'short' | 'none' = 'none';
  
  // Simple strategy: use SMA crossover to generate signals
  for (let i = 10; i < prices.length; i++) {
    // Calculate 5-day and 20-day SMAs
    const sma5 = prices.slice(i - 5, i).reduce((sum, p) => sum + p, 0) / 5;
    const sma20 = prices.slice(i - 20, i).reduce((sum, p) => sum + p, 0) / Math.min(20, i);
    
    const currentPrice = prices[i];
    const previousPrice = prices[i - 1];
    
    // Buy signal: price crosses above SMA5
    if (currentPrice > sma5 && previousPrice <= sma5) {
      if (position === 'none' || position === 'short') {
        if (position === 'short') trades++; // Close short, open long
        position = 'long';
        trades++; // Count as a trade
      }
    }
    // Sell signal: price crosses below SMA5
    else if (currentPrice < sma5 && previousPrice >= sma5) {
      if (position === 'long' || position === 'none') {
        if (position === 'long') trades++; // Close long
        position = 'none'; // Exit position
      }
    }
  }
  
  // Close any open position at the end
  if (position !== 'none') {
    trades++;
  }
  
  return Math.max(1, trades); // At least 1 trade
}

/**
 * Calculate total trades from signal array
 * More accurate if you have explicit buy/sell signals
 */
export function calculateTradesFromSignals(signals: Array<'buy' | 'sell' | undefined>): number {
  let trades = 0;
  let position: 'long' | 'none' = 'none';
  
  for (const signal of signals) {
    if (signal === 'buy' && position === 'none') {
      position = 'long';
      trades++; // Open position
    } else if (signal === 'sell' && position === 'long') {
      position = 'none';
      trades++; // Close position
    }
  }
  
  // Close any open position
  if (position === 'long') {
    trades++;
  }
  
  return Math.max(1, trades);
}

