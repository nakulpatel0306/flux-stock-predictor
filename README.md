# Flux - Next-Day Stock Forecasts Trained In Your Browser

A browser-based stock forecasting experiment. Pick a ticker and it pulls daily price history from Nasdaq (or Yahoo Finance as a fallback), trains three small TensorFlow.js models on that history right in the browser, and blends them into a next-day up/down call with an expected return. It scores the models on the most recent days they never trained on and shows a chart and risk stats for the period.

## At a Glance

- **Stack:** React 18, TypeScript, Vite, TensorFlow.js, Recharts, Tailwind CSS, shadcn/ui
- **Data:** Nasdaq historical quotes API, with the Yahoo Finance chart API as a fallback (daily OHLCV), no API key
- **State:** Complete. A learning project, not financial advice

## Features

- **Any ticker** Nasdaq or Yahoo Finance serves, over 1M, 3M, 6M or 1Y of daily data: US stocks and ETFs (AAPL, SPY), share classes (BRK.B, BRK-B or BRK/B) and non-US listings with a Yahoo exchange suffix (SHOP.TO)
- **Three models trained on demand:** a neural network, a time series network and a ridge regression, each fit fresh on the stock you pick
- **Ensemble forecast:** a weighted blend giving next-day direction, its probability and an expected return
- **Holdout evaluation:** accuracy, precision and recall of the models' direction calls on the most recent days, which they never trained on, next to an always-up baseline
- **Technical indicators** as model features: SMA (5, 20, 50), EMA, RSI, MACD, volatility and momentum
- **Risk stats** for the period: Sharpe ratio, CAGR, max drawdown and share of up days
- **Price chart** with buy and sell markers on every day the price crosses 2% above or below its 5-day average

## How It Works

1. Fetch daily price history for the chosen ticker and timeframe
2. For each day from day 20 on, compute 8 indicator features from the prices up to that day, and label it with the next day's return
3. Split the days in time order: the oldest 80% train the models, the newest 20% are held out
4. Train all three models on the training days, in the browser; each outputs a probability that the next close is higher
5. Blend the three probabilities with fixed weights, score the blend's up/down calls on the held-out days, and forecast the next day from the latest one
6. Chart the history and compute risk stats for the period

| Model | Approach | Ensemble weight |
|---|---|---|
| Neural network | Multi-layer perceptron with dropout, classifying next-day up or down from the 8 standardized indicators | 50% |
| Time series | Dense network on the last 10 daily returns, predicting the next return | 30% |
| Regression | Linear model with L2 (ridge) regularization on the same 8 indicators, predicting the next return | 20% |

The two return models are trained on standardized returns and de-normalized afterwards. Their forecast becomes an up probability by comparing it with their own training error, so a forecast that is small next to that error lands near 50%.

**Expected return** is not a raw model output. It is the blended up probability applied to the stock's average up day and average down day over the last 60 sessions, so it stays within the size of moves the stock actually makes. **Confidence** is low unless the blend beat the always-up baseline on at least 20 held-out days and all three models agree on the direction; it is then medium or high depending on how far the probability is from 50%.

Weights are seeded and batches unshuffled, so the same price history always trains to the same models. With fewer than 50 data points (the 1M timeframe), the models are skipped and a rule-based score from the same indicators is used instead, shown at low confidence with no holdout results. More design detail is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Limitations

- The holdout is small: about 46 days on 1Y and 21 on 6M. On 3M only about 9 days can be held out, so the app shows no accuracy for it. Expect results near the always-up baseline; a few points either way is noise, not skill
- The forecast uses the same models that were scored on the holdout, so it is trained on the oldest 80% of the period, not the most recent days
- The ensemble weights are fixed by hand, not tuned on data
- Results can differ by a point or two between the WebGL backend in the browser and the CPU backend, because floating point math differs between them
- Neither data source allows direct browser requests (no CORS), so the app needs a proxy. `npm run dev` and `npm run preview` include one and are the reliable way to run it. Nasdaq is tried first because Yahoo Finance often rate limits unauthenticated requests
- On a static host there is no local proxy, so requests go through public CORS proxies (allorigins, cors.lol, codetabs). These are free, rate limited and often down, so fetching there is best effort; when every source fails, the app says so instead of showing stale or fake data
- Nasdaq covers US-listed stocks and ETFs; non-US listings (SHOP.TO) and anything else depend on Yahoo Finance being reachable

## Project Structure

```
src/
├── components/          # Ticker input, price chart, prediction panel, metrics (ui/ is shadcn/ui)
├── features/
│   ├── technical-indicators.ts  # SMA, EMA, RSI, MACD, volatility
│   └── feature-engineering.ts   # The 8 normalized model features
├── models/
│   ├── dataset.ts               # Samples, time-ordered holdout split, scoring
│   ├── neural-network.model.ts  # Up/down classifier
│   ├── time-series.model.ts     # Next-return regressor on return windows
│   ├── regression.model.ts      # Ridge regression on indicators
│   ├── ensemble.model.ts        # Trains the three, blends, scores the holdout
│   └── index.ts                 # Entry point
├── services/
│   ├── price-sources.ts         # Nasdaq and Yahoo endpoints and response parsers
│   ├── stock-data.service.ts    # Source and proxy fallbacks for price history
│   ├── ticker.ts                # Ticker validation and per-source symbol formats
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

- Models train each time you analyze a ticker, so an analysis takes several seconds
- Use 3M or longer to get the trained models (they need 50+ data points), and 6M or 1Y to get holdout results

## License

MIT, see [LICENSE](LICENSE).
