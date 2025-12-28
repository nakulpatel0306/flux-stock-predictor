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
│   └── PerformanceMetrics.tsx # Backtesting metrics
│
├── features/           # Feature engineering
│   ├── technical-indicators.ts  # RSI, MACD, SMA calculations
│   └── feature-engineering.ts   # Feature normalization for ML
│
├── models/             # ML Models (TensorFlow.js)
│   ├── neural-network.model.ts  # Multi-layer perceptron
│   ├── time-series.model.ts     # ARIMA-like time series
│   ├── regression.model.ts      # Linear regression
│   ├── ensemble.model.ts        # Ensemble of all models
│   └── index.ts                 # Main model exports
│
├── services/           # Business logic services
│   ├── stock-data.service.ts    # Yahoo Finance API client
│   └── ml.service.ts            # ML prediction orchestrator
│
├── types/              # TypeScript type definitions
│   └── index.ts        # All shared types/interfaces
│
├── utils/              # Utility functions
│   └── performance-metrics.ts   # Sharpe, CAGR, drawdown calculations
│
├── pages/              # Page components
│   ├── Index.tsx       # Main analysis page
│   └── NotFound.tsx    # 404 page
│
└── lib/                # Shared libraries
    └── utils.ts        # General utilities (cn helper)
```

## ML Models Architecture

### 1. Neural Network Model (`neural-network.model.ts`)
- **Type**: Multi-layer perceptron with dropout
- **Input**: 8 normalized technical indicators
- **Output**: Binary classification (up/down probability)
- **Use Case**: Pattern recognition in technical indicators
- **Accuracy**: Best for complex non-linear patterns

### 2. Time Series Model (`time-series.model.ts`)
- **Type**: Sequence-based regression (LSTM-like)
- **Input**: Sliding windows of normalized prices
- **Output**: Predicted next price
- **Use Case**: Trend and seasonality patterns
- **Accuracy**: Good for capturing temporal dependencies

### 3. Regression Model (`regression.model.ts`)
- **Type**: Linear regression with L2 regularization (Ridge)
- **Input**: 8 normalized technical indicators
- **Output**: Normalized return prediction
- **Use Case**: Simple, interpretable predictions
- **Accuracy**: Baseline model, fast training

### 4. Ensemble Model (`ensemble.model.ts`)
- **Type**: Weighted average of all models
- **Weights**: Neural Network (50%), Time Series (30%), Regression (20%)
- **Output**: Combined prediction with higher accuracy
- **Use Case**: Production prediction (most accurate)

## Data Flow

```
User Input (Ticker + Timeframe)
    ↓
Stock Data Service (fetchStockHistory)
    ↓
Yahoo Finance API → Historical Prices & Volumes
    ↓
Feature Engineering (calculateTechnicalIndicators)
    ↓
Technical Indicators (RSI, MACD, SMA, Volatility)
    ↓
ML Service (predictStock)
    ↓
Ensemble Model (runs all 3 models in parallel)
    ↓
Weighted Average Prediction
    ↓
Performance Metrics (calculatePerformanceMetrics)
    ↓
UI Display (Chart + Prediction + Metrics)
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
- **Win Rate**: Percentage of positive returns

## Notes

- All calculations follow standard financial formulas
- Models train on-demand for each prediction
- Ensemble approach provides most accurate results
- Fallback to simple technical analysis if ML fails
- CORS handling with multiple proxy strategies

