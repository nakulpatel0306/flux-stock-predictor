/**
 * Stock Data Service
 * Fetches real-time stock data from Yahoo Finance API
 * Handles CORS issues with multiple fallback strategies
 */

import type { StockDataPoint, StockQuote, YahooFinancePeriod } from '@/types';

// Check if we're in development mode (can use Vite proxy)
const isDev = import.meta.env.DEV;

/**
 * Fetch data with multiple fallback strategies to handle CORS
 * Tries: Vite proxy (dev) -> Direct fetch -> CORS proxies
 */
async function fetchWithCORSProxy(url: string): Promise<any> {
  // Strategy 1: Try Vite proxy in development mode
  if (isDev) {
    try {
      const proxyUrl = url.replace('https://query1.finance.yahoo.com', '/api/yahoo');
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Vite proxy failed, trying direct fetch...', error);
    }
  }
  
  // Strategy 2: Try direct fetch (works if CORS allows)
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log('Direct fetch failed, trying CORS proxy...', error);
    
    // Strategy 3: Fallback to CORS proxy - allorigins.win
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyResponse = await fetch(proxyUrl);
      
      if (!proxyResponse.ok) {
        throw new Error(`Proxy HTTP error! status: ${proxyResponse.status}`);
      }
      
      const text = await proxyResponse.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response`);
      }
    } catch (proxyError) {
      // Strategy 4: Try alternative CORS proxy
      try {
        const altProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const altResponse = await fetch(altProxyUrl);
        
        if (!altResponse.ok) {
          throw new Error(`Alternative proxy failed: ${altResponse.status}`);
        }
        
        return await altResponse.json();
      } catch (altError) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch data. All methods failed. Last error: ${errorMsg}. Please check your internet connection and try again.`);
      }
    }
  }
}

/**
 * Fetch historical stock data from Yahoo Finance API
 * Returns array of price data points with dates, prices, and volumes
 */
export async function fetchStockHistory(
  symbol: string,
  period: YahooFinancePeriod
): Promise<StockDataPoint[]> {
  try {
    // Convert period to Unix timestamps
    const period1 = Math.floor(getPeriodStartDate(period).getTime() / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    
    // Construct Yahoo Finance API URL
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US`;
    
    // Fetch data with CORS handling
    const data = await fetchWithCORSProxy(url);
    
    // Validate response structure
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data returned from API');
    }
    
    const result = data.chart.result[0];
    
    // Check for API errors
    if (result.error) {
      throw new Error(result.error.description || 'API returned an error');
    }
    
    // Extract price data from API response
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];
    const opens = quotes.open || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    
    // Validate data exists
    if (timestamps.length === 0 || closes.length === 0) {
      throw new Error('No price data available for this symbol');
    }
    
    // Map API data to our format and filter invalid points
    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: closes[index] || 0,
      volume: volumes[index] || 0,
      open: opens[index],
      high: highs[index],
      low: lows[index],
      close: closes[index],
    })).filter((point: StockDataPoint) => point.price > 0); // Filter out invalid data points
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch stock data for ${symbol}: ${errorMessage}`);
  }
}

/**
 * Get current stock quote from Yahoo Finance API
 * Returns current price, change, and change percentage
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d`;
    
    const data = await fetchWithCORSProxy(url);
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data returned from API');
    }
    
    const result = data.chart.result[0];
    
    if (result.error) {
      throw new Error(result.error.description || 'API returned an error');
    }
    
    // Extract quote data
    const meta = result.meta || {};
    const regularMarketPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || regularMarketPrice;
    const change = regularMarketPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol: meta.symbol || symbol,
      price: regularMarketPrice,
      change,
      changePercent,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch quote for ${symbol}: ${errorMessage}`);
  }
}

/**
 * Convert timeframe string to Yahoo Finance period format
 */
export function timeframeToPeriod(timeframe: string): YahooFinancePeriod {
  const mapping: Record<string, YahooFinancePeriod> = {
    '1W': '5d',
    '1M': '1mo',
    '3M': '3mo',
    '6M': '6mo',
    '1Y': '1y',
  };
  return mapping[timeframe] || '1mo';
}

/**
 * Get start date for a given period
 * Calculates the date that is N periods ago from today
 */
function getPeriodStartDate(period: string): Date {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '1d':
      startDate.setDate(now.getDate() - 1);
      break;
    case '5d':
      startDate.setDate(now.getDate() - 5);
      break;
    case '1mo':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3mo':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      startDate.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      startDate.setFullYear(now.getFullYear() - 5);
      break;
    case '10y':
      startDate.setFullYear(now.getFullYear() - 10);
      break;
    case 'ytd':
      startDate.setMonth(0, 1); // January 1st
      break;
    default:
      startDate.setFullYear(now.getFullYear() - 5); // Default to 5 years
  }
  
  return startDate;
}

