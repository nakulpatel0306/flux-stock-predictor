/**
 * Trading Strategy Utilities
 * Simulates trading strategies for backtesting
 */

/**
 * Calculate total trades executed based on buy/sell signals
 * Counts each position opened and each position closed as a trade
 */
export function calculateTotalTrades(prices: number[]): number {
  if (prices.length < 10) return 0;
  
  let trades = 0;
  let position: 'long' | 'none' = 'none';
  
  // Long-only strategy: enter when price crosses above its 5-day SMA, exit when it crosses below
  for (let i = 10; i < prices.length; i++) {
    const sma5 = prices.slice(i - 5, i).reduce((sum, p) => sum + p, 0) / 5;
    
    const currentPrice = prices[i];
    const previousPrice = prices[i - 1];
    
    if (currentPrice > sma5 && previousPrice <= sma5 && position === 'none') {
      position = 'long';
      trades++; // Open position
    } else if (currentPrice < sma5 && previousPrice >= sma5 && position === 'long') {
      position = 'none';
      trades++; // Close position
    }
  }
  
  // Close any open position at the end
  if (position === 'long') {
    trades++;
  }
  
  return trades;
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

