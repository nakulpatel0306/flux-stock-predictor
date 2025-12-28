# flux - AI Stock Prediction Platform

An advanced stock prediction platform that uses real-time data from Yahoo Finance and ensemble machine learning models powered by TensorFlow.js to predict stock price movements.

## Features

- **Real-Time Stock Data**: Fetches live 2025 stock prices and historical data from Yahoo Finance API
- **Ensemble ML Models**: Combines neural network, time series, and regression models for accurate predictions
- **Technical Analysis**: Advanced indicators including RSI, MACD, SMA (5, 20, 50 day), and volatility analysis
- **Performance Metrics**: Comprehensive backtesting with Sharpe ratio, CAGR, max drawdown, and win rate
- **Interactive Charts**: Beautiful price charts with buy/sell signals using Recharts
- **Modern UI**: Built with React, TypeScript, Tailwind CSS, and shadcn/ui components

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TensorFlow.js** for machine learning predictions
- **Yahoo Finance API** for real stock data
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

## Installation

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Start the development server:
```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

## Usage

1. Enter a stock ticker symbol (e.g., AAPL, TSLA, GOOGL, MSFT, NVDA)
2. Select a timeframe (1W, 1M, 3M, 6M, or 1Y)
3. Click "Analyze Stock" to:
   - Fetch real historical stock data from Yahoo Finance
   - Train multiple ML models on the data
   - Generate ensemble predictions and technical indicators
   - Display performance metrics and interactive charts

## How It Works

1. **Data Fetching**: The app fetches real stock data from Yahoo Finance's public API endpoint
2. **Feature Engineering**: Technical indicators (RSI, MACD, SMA, volatility) are calculated from price data
3. **ML Training**: Multiple models (Neural Network, Time Series, Regression) are trained in parallel
4. **Ensemble Prediction**: Models are combined with weighted averaging for higher accuracy
5. **Performance Metrics**: Historical backtesting metrics are calculated from actual price movements
6. **Visualization**: Results are displayed with interactive charts and detailed metrics

## Machine Learning Models

The platform uses an **ensemble approach** combining three ML models:

### 1. Neural Network Model
- **Architecture**: Multi-layer perceptron with dropout regularization
- **Features**: 8 normalized technical indicators (SMA deviations, RSI, MACD, volatility, momentum)
- **Use Case**: Pattern recognition in technical indicators
- **Weight in Ensemble**: 50%

### 2. Time Series Model
- **Architecture**: Sequence-based regression (LSTM-like approach)
- **Input**: Sliding windows of normalized prices
- **Use Case**: Capturing trend and seasonality patterns
- **Weight in Ensemble**: 30%

### 3. Regression Model
- **Architecture**: Linear regression with L2 regularization (Ridge)
- **Features**: 8 normalized technical indicators
- **Use Case**: Simple, interpretable baseline predictions
- **Weight in Ensemble**: 20%

The ensemble model combines all three predictions using weighted averaging for improved accuracy and robustness.

## Project Structure

```
src/
├── components/       # React UI components
├── features/         # Feature engineering (technical indicators)
├── models/           # ML models (neural network, time series, regression, ensemble)
├── services/         # Business logic (stock data, ML orchestration)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions (performance metrics)
└── pages/            # Page components
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Technical Indicators

- **SMA**: Simple Moving Average (5, 20, 50 day periods)
- **EMA**: Exponential Moving Average (12, 26 periods for MACD)
- **RSI**: Relative Strength Index (14 period, 0-100 scale)
- **MACD**: Moving Average Convergence Divergence (EMA12 - EMA26)
- **Volatility**: Annualized standard deviation of returns

## Performance Metrics

- **Sharpe Ratio**: Risk-adjusted return (annualized)
- **CAGR**: Compound Annual Growth Rate
- **Max Drawdown**: Largest peak-to-trough decline
- **Win Rate**: Percentage of positive returns
- **Accuracy, Precision, Recall**: Model performance metrics

## Notes

- Predictions are for educational purposes only and should not be used as financial advice
- Models train on-demand, so the first analysis may take a few seconds
- Historical data availability depends on Yahoo Finance API
- For best results, use timeframes with at least 50+ data points (3M, 6M, or 1Y recommended)
- The ensemble model provides the most accurate predictions by combining multiple approaches
- All calculations follow standard financial formulas
