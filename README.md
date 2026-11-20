# Flux - Next-Day Stock Forecasts Trained In Your Browser

A browser-based stock forecasting experiment. Pick a ticker and it pulls daily price history from Nasdaq (or Yahoo Finance as a fallback), trains three small TensorFlow.js models on that history right in the browser, and blends them into a next-day up/down call with an expected return, alongside a chart and risk stats for the period.

## At a Glance

- **Stack:** React 18, TypeScript, Vite, TensorFlow.js, Recharts, Tailwind CSS, shadcn/ui
- **Data:** Nasdaq historical quotes API, with the Yahoo Finance chart API as a fallback (daily OHLCV), no API key
- **State:** Complete. A learning project, not financial advice

## Features

- **Any ticker** (AAPL, TSLA, NVDA and so on) over 1M, 3M, 6M or 1Y of daily data
- **Three models trained on demand:** a neural network, a time series network and a ridge regression, each fit fresh on the stock you pick
- **Ensemble forecast:** a weighted blend giving next-day direction, probability and expected return
- **Technical indicators** as model features: SMA (5, 20, 50), EMA, RSI, MACD, volatility and momentum
- **Risk stats** for the period: Sharpe ratio, CAGR, max drawdown and share of up days
- **Price chart** with buy and sell markers where the price breaks 2% above or below its 5-day average

## How It Works

1. Fetch daily price history for the chosen ticker and timeframe
2. Turn each 20-day window into 8 normalized indicator features, labelled with the next day's move
3. Train all three models in parallel, in the browser
4. Blend their outputs with weighted averaging
5. Chart the history and compute risk stats for the period

| Model | Approach | Ensemble weight |
|---|---|---|
| Neural network | Multi-layer perceptron with dropout, classifying next-day up or down from 8 indicators | 50% |
| Time series | Dense network on sliding 10-day windows of normalized prices, predicting the next close | 30% |
| Regression | Linear model with L2 (ridge) regularization on the same 8 indicators, predicting next-day return | 20% |

With fewer than 50 data points (the 1M timeframe), the models are skipped and a rule-based score from the same indicators is used instead. More design detail is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Limitations

- The "Model Accuracy" figure and the accuracy, precision and recall in the metrics panel are estimates, not measured against past predictions; there is no backtest of the models yet
- Chart markers are a random sample of 5-day-average crossovers, so they change between runs
- Neither data source allows direct browser requests (no CORS), so the app needs a proxy. `npm run dev` and `npm run preview` include one and are the reliable way to run it. Nasdaq is tried first because Yahoo Finance often rate limits unauthenticated requests
- On a static host there is no local proxy, so requests go through public CORS proxies (allorigins, cors.lol, codetabs). These are free, rate limited and often down, so fetching there is best effort; when every source fails, the app says so instead of showing stale or fake data
- Nasdaq covers US-listed stocks and ETFs; any other ticker depends on Yahoo Finance being reachable

## Project Structure

```
src/
├── components/          # Ticker input, price chart, prediction panel, metrics (ui/ is shadcn/ui)
├── features/
│   ├── technical-indicators.ts  # SMA, EMA, RSI, MACD, volatility
│   └── feature-engineering.ts   # The 8 normalized model features
├── models/
│   ├── neural-network.model.ts  # Up/down classifier
│   ├── time-series.model.ts     # Next-close regressor on price windows
│   ├── regression.model.ts      # Ridge regression on indicators
│   ├── ensemble.model.ts        # Weighted blend of the three
│   └── index.ts                 # Entry point with per-model fallbacks
├── services/
│   ├── price-sources.ts         # Nasdaq and Yahoo endpoints and response parsers
│   ├── stock-data.service.ts    # Source and proxy fallbacks for price history
│   └── ml.service.ts            # Runs the models, or the rule-based fallback
├── utils/               # Risk stats and trade counting
├── pages/               # Main page and 404
├── hooks/, lib/, types/ # Shared helpers and TypeScript types
└── main.tsx
```

## Running Locally

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/nakulpatel0306/flux-stock-predictor.git
   cd flux-stock-predictor
   npm install
   ```
2. Start the dev server and open `http://localhost:8080`:
   ```bash
   npm run dev
   ```
3. Build for production with `npm run build`.

## Notes

- Models train each time you analyze a ticker, so an analysis takes a few seconds
- Use 3M, 6M or 1Y to get the trained models: they need 50+ data points
