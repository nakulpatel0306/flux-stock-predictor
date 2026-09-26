# flux - AI Stock Prediction Platform

A browser-based stock predictor. It pulls real price history from Yahoo Finance, trains three models with TensorFlow.js right in the browser, and combines them into one ensemble forecast with charts and backtest metrics.

## At a Glance

- **Stack:** React 18, TypeScript, Vite, TensorFlow.js, Recharts, Tailwind CSS, shadcn/ui
- **Data:** Yahoo Finance public API
- **State:** Complete. For learning only, not financial advice.

## Features

- Any ticker (AAPL, TSLA, NVDA and so on) over 1W, 1M, 3M, 6M or 1Y
- Ensemble of a neural network, a time series model and a ridge regression
- Technical indicators: SMA (5, 20, 50), EMA, RSI, MACD and volatility
- Backtest metrics: Sharpe ratio, CAGR, max drawdown, win rate, accuracy, precision, recall
- Interactive price chart with buy and sell signals

## How It Works

1. Fetch price history for the chosen ticker and timeframe
2. Calculate technical indicators as model features
3. Train all three models in parallel, in the browser
4. Blend their outputs with weighted averaging
5. Backtest against actual price moves and chart the results

| Model | Approach | Ensemble weight |
|---|---|---|
| Neural network | Multi-layer perceptron with dropout, on 8 normalized indicators | 50% |
| Time series | Sequence regression on sliding windows of prices | 30% |
| Regression | Ridge (L2) regression, an interpretable baseline | 20% |

Full design details are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Project Structure

```
src/
├── components/   # UI components (input, charts, prediction panel, metrics)
├── features/     # Technical indicator calculations
├── models/       # Neural network, time series, regression and ensemble
├── services/     # Stock data fetching and model orchestration
├── utils/        # Performance metrics
├── types/        # TypeScript types
└── pages/        # Page components
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

## Notes

- Models train on demand, so the first analysis takes a few seconds
- Use 3M, 6M or 1Y for best results, since the models need 50+ data points
- Data availability depends on the Yahoo Finance API
