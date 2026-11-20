/**
 * Price Sources
 * Keyless daily price history endpoints and parsers for their responses.
 * Neither endpoint sends CORS headers, so the browser reaches them through
 * the Vite proxy (see vite.config.ts) or a public CORS proxy.
 */

import type { HistoryPeriod, StockDataPoint } from '@/types';
import { nasdaqSymbol, yahooSymbol } from './ticker';

/** Thrown when a source answers but says the ticker doesn't exist */
export class SymbolNotFoundError extends Error {}

export interface PriceSource {
  name: string;
  /** Upstream origin, mapped to `proxyPrefix` by the Vite proxy */
  origin: string;
  proxyPrefix: string;
  /** Request paths to try in order; a not-found answer moves to the next one. Empty if the source can't serve the symbol */
  paths(symbol: string, period: HistoryPeriod): string[];
  parse(body: unknown): StockDataPoint[];
}

const PERIOD_MONTHS: Record<HistoryPeriod, number> = {
  '1mo': 1,
  '3mo': 3,
  '6mo': 6,
  '1y': 12,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Nasdaq formats numbers for display: "$349.21", "40,906,860", "N/A" */
function parseDisplayNumber(value: string | undefined): number {
  const n = parseFloat((value ?? '').replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

interface NasdaqRow {
  date: string;
  close: string;
  volume: string;
  open: string;
  high: string;
  low: string;
}

interface NasdaqResponse {
  data?: { tradesTable?: { rows?: NasdaqRow[] } } | null;
  status?: { bCodeMessage?: { errorMessage: string }[] | null };
}

interface YahooResponse {
  chart?: {
    error?: { code: string; description?: string } | null;
    result?: {
      timestamp?: number[];
      indicators?: { quote?: Partial<Record<'open' | 'high' | 'low' | 'close' | 'volume', (number | null)[]>>[] };
    }[];
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const nasdaq: PriceSource = {
  name: 'Nasdaq',
  origin: 'https://api.nasdaq.com',
  proxyPrefix: '/api/nasdaq',
  paths(symbol, period) {
    const nasdaqTicker = nasdaqSymbol(symbol);
    if (!nasdaqTicker) return [];
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - PERIOD_MONTHS[period]);
    const query = `fromdate=${isoDate(from)}&todate=${isoDate(to)}&limit=400`;
    const ticker = encodeURIComponent(nasdaqTicker);
    // ETFs live under a different asset class and 404 as stocks
    return ['stocks', 'etf'].map(
      (assetClass) => `/api/quote/${ticker}/historical?assetclass=${assetClass}&${query}`
    );
  },
  parse(raw) {
    const body = raw as NasdaqResponse;
    const rows = body?.data?.tradesTable?.rows;
    if (!Array.isArray(rows)) {
      const messages: string[] = (body?.status?.bCodeMessage ?? []).map((m) => m.errorMessage);
      if (messages.some((m) => /symbol not exists/i.test(m))) {
        throw new SymbolNotFoundError('Symbol not found');
      }
      throw new Error(messages[0] || 'Unexpected response');
    }
    // Rows are newest first with MM/DD/YYYY dates
    return rows
      .map((row) => {
        const [month, day, year] = String(row.date).split('/').map(Number);
        const close = parseDisplayNumber(row.close);
        return {
          date: formatDate(new Date(year, month - 1, day)),
          price: close,
          volume: parseDisplayNumber(row.volume),
          open: parseDisplayNumber(row.open),
          high: parseDisplayNumber(row.high),
          low: parseDisplayNumber(row.low),
          close,
        };
      })
      .filter((point) => point.price > 0)
      .reverse();
  },
};

export const yahoo: PriceSource = {
  name: 'Yahoo Finance',
  origin: 'https://query1.finance.yahoo.com',
  proxyPrefix: '/api/yahoo',
  paths(symbol, period) {
    return [`/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=${period}&interval=1d`];
  },
  parse(raw) {
    const body = raw as YahooResponse;
    const error = body?.chart?.error;
    if (error) {
      if (error.code === 'Not Found') throw new SymbolNotFoundError('Symbol not found');
      throw new Error(error.description || 'API returned an error');
    }
    const result = body?.chart?.result?.[0];
    if (!result) throw new Error('Unexpected response');

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    return timestamps
      .map((timestamp, i) => ({
        date: formatDate(new Date(timestamp * 1000)),
        price: quote.close?.[i] || 0,
        volume: quote.volume?.[i] || 0,
        open: quote.open?.[i],
        high: quote.high?.[i],
        low: quote.low?.[i],
        close: quote.close?.[i],
      }))
      .filter((point) => point.price > 0);
  },
};

/** Tried in order: Nasdaq first because Yahoo rate limits unauthenticated clients aggressively */
export const PRICE_SOURCES: PriceSource[] = [nasdaq, yahoo];
