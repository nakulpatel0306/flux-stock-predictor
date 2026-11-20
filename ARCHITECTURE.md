# Architecture Documentation

## Project Structure

```
src/
├── components/          # React UI components
│   ├── ui/             # shadcn/ui component library
│   ├── Header.tsx      # App header component
│   ├── StockInput.tsx  # Stock ticker input form
│   ├── PriceChart.tsx  # Price visualization chart
│   ├── PredictionPanel.tsx # ML prediction display
│   └── PerformanceMetrics.tsx # Holdout results and risk stats
│
├── features/           # Feature engineering
│   ├── technical-indicators.ts  # RSI, MACD, SMA calculations
│   └── feature-engineering.ts   # Feature normalization for ML
│
├── models/             # ML Models (TensorFlow.js)
│   ├── dataset.ts               # Samples, holdout split, scoring, shared math
│   ├── neural-network.model.ts  # Multi-layer perceptron
│   ├── time-series.model.ts     # Dense network on return windows
│   ├── regression.model.ts      # Linear regression
│   ├── ensemble.model.ts        # Ensemble of all models
│   └── index.ts                 # Main model exports
│
├── services/           # Business logic services
│   ├── price-sources.ts         # Nasdaq and Yahoo endpoints and parsers
│   ├── stock-data.service.ts    # Source and proxy fallbacks
│   ├── ticker.ts                # Ticker validation and per-source symbol formats
│   └── ml.service.ts            # ML prediction orchestrator
│
├── types/              # TypeScript type definitions
│   └── index.ts        # All shared types/interfaces
│
├── utils/              # Utility functions
│   ├── performance-metrics.ts   # Sharpe, CAGR, drawdown calculations
│   └── trading-strategy.ts      # Trade count for a 5-day SMA crossover strategy
│
├── pages/              # Page components
│   ├── Index.tsx       # Main analysis page
│   └── NotFound.tsx    # 404 page
│
└── lib/                # Shared libraries
    └── utils.ts        # General utilities (cn helper)
```

## ML Models Architecture

### Samples and holdout (`dataset.ts`)
- **Samples**: one per day from day 20 to the second-last day. Features use only prices up to that day; the label is the return to the next close
- **Split**: time-ordered, the oldest 80% train and the newest 20% are held out. Nothing is shuffled across the boundary, and feature and target scaling is fitted on the training rows only
- **Latest sample**: the last day, which has no label yet, is what gets forecast
- **Determinism**: seeded initializers and dropout with unshuffled batches, so the same history trains the same models

Every model trains on the same samples and outputs P(up) for any sample, so the outputs can be blended and scored together.

### 1. Neural Network Model (`neural-network.model.ts`)
- **Type**: Multi-layer perceptron with dropout (32-16-8, sigmoid output)
- **Input**: 8 technical indicator features, z-scored on the training rows
- **Output**: P(next close is higher), trained with binary cross-entropy

### 2. Time Series Model (`time-series.model.ts`)
- **Type**: Dense network on a flattened sequence
- **Input**: the last 10 daily returns, standardized
- **Output**: next-day return, de-normalized, then P(up) = Φ(predicted return / training residual std)

### 3. Regression Model (`regression.model.ts`)
- **Type**: Linear regression with L2 regularization (Ridge)
- **Input**: the same 8 standardized features
- **Output**: next-day return, de-normalized, then P(up) the same way as the time series model

### 4. Ensemble Model (`ensemble.model.ts`)
- **Type**: Weighted average of the three P(up) values
- **Weights**: Neural Network (50%), Time Series (30%), Regression (20%), fixed by hand and re-normalized if a model fails to train
- **Holdout metrics**: the blend's up/down calls on the held-out days give accuracy, precision and recall (up as the positive class), plus the accuracy of always predicting up. The UI hides them below 20 held-out days
- **Expected return**: P(up) × average up day − (1 − P(up)) × average down day, over the last 60 sessions
- **Confidence**: low unless the blend beat the always-up baseline on 20+ held-out days and all models agree; then high at |P(up) − 0.5| ≥ 0.15, medium at ≥ 0.05

With fewer than 50 prices, `ml.service.ts` skips the models and uses a rule-based indicator score, with the same expected-return formula, low confidence and no holdout metrics.

## Data Flow

```
User Input (Ticker + Timeframe)
    ↓
Ticker validation and per-source symbol format (BRK.B → Nasdaq "BRK.B", Yahoo "BRK-B")
    ↓
Stock Data Service (fetchStockHistory)
    ↓
Nasdaq API (Yahoo Finance fallback) → Historical Prices & Volumes
    ↓
ML Service (predictStock)
    ↓
Samples → time-ordered train / holdout split
    ↓
Ensemble: train 3 models on the training days
    ↓
Blend P(up) → holdout metrics + next-day forecast
    ↓
Performance Metrics (calculatePerformanceMetrics)
    ↓
UI Display (Chart + Prediction + Holdout Results + Risk Stats)
```

## Key Calculations

### Technical Indicators
- **SMA**: Simple moving average (5, 20, 50 day)
- **EMA**: Exponential moving average (12, 26 period for MACD)
- **RSI**: Relative Strength Index (14 period, 0-100 scale)
- **MACD**: Moving Average Convergence Divergence (EMA12 - EMA26)
- **Volatility**: Annualized standard deviation of returns

### Performance Metrics
- **Sharpe Ratio**: (Return - Risk Free Rate) / StdDev, annualized
- **CAGR**: Compound Annual Growth Rate
- **Max Drawdown**: Largest peak-to-trough decline
- **Up Days**: Percentage of positive daily returns
- **Total Trades**: Positions opened plus closed by a long-only strategy that enters when price crosses above its 5-day SMA and exits when it crosses below

### Chart Markers
- **Buy / sell**: every day the price crosses 2% above (buy) or below (sell) its 5-day SMA; deterministic

## Notes

- Models train on demand for each prediction, in the browser
- Holdout results are the only accuracy figures shown; nothing is estimated or simulated
- Fallback to a rule-based indicator score when there is too little data or every model fails
- Price data: each source (Nasdaq, then Yahoo) is tried through the Vite proxy, then raced across public CORS proxies; a clear error is shown if all fail
