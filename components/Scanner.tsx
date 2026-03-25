'use client';

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Play, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, Target, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

interface StockRecommendation {
  stockName: string;
  nseSymbol: string;
  currentPrice: number;
  tradeType: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  volumeStrength: string;
  reason: string;
}

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<StockRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize stock list for live price tracking
  const stockList = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({ stock: r.nseSymbol, entry: r.currentPrice }));
  }, [results]);

  const livePrices = useLivePrices(stockList);

  const runScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyC5T899JUSQcdiqMqbp2pOjdwgdAKpmKdY';
      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Please configure it in the AI Studio settings.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Act as a professional intraday stock market scanner for the Indian stock market (NSE).
      Use the googleSearch tool to find the latest live market data for today, specifically looking for NSE market movers, top volume gainers, and highly active F&O stocks.
      Analyze this data and identify the top 5-10 best intraday trading opportunities.
      Scan only liquid stocks from Nifty 50, Bank Nifty, and F&O stocks.
      
      Filtering Rules:
      1. Price above ₹100
      2. Average daily volume above 500,000 shares
      3. Current volume at least 1.5x to 2x higher than average
      4. Gap up or gap down greater than 1% at market open
      5. Stock breaking previous day high or previous day low
      6. RSI between 55-70 for bullish, 30-45 for bearish
      7. MACD bullish or bearish crossover confirmation
      8. Price above VWAP for buy, below VWAP for short
      9. Strong intraday volatility and momentum

      Return the result as a JSON array of objects.
      Avoid illiquid and penny stocks. Prefer clean price action and strong institutional activity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stockName: { type: Type.STRING, description: 'Full name of the stock' },
                nseSymbol: { type: Type.STRING, description: 'NSE Symbol' },
                currentPrice: { type: Type.NUMBER, description: 'Current market price' },
                tradeType: { type: Type.STRING, description: 'BUY or SELL' },
                entryPrice: { type: Type.NUMBER, description: 'Suggested entry price' },
                stopLoss: { type: Type.NUMBER, description: 'Suggested stop loss' },
                target1: { type: Type.NUMBER, description: 'First target price' },
                target2: { type: Type.NUMBER, description: 'Second target price' },
                volumeStrength: { type: Type.STRING, description: 'Volume strength description (e.g., 2.5x Average)' },
                reason: { type: Type.STRING, description: 'Reason for selection (e.g., Breakout, Momentum)' },
              },
              required: ['stockName', 'nseSymbol', 'currentPrice', 'tradeType', 'entryPrice', 'stopLoss', 'target1', 'target2', 'volumeStrength', 'reason'],
            },
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        setResults(parsed);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while scanning.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-neutral-900 p-6 rounded-2xl border border-neutral-800 gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-100">
            <Activity className="w-5 h-5 text-indigo-400" />
            Live Market Scanner
          </h2>
          <p className="text-sm text-neutral-400">Scans Nifty 50, Bank Nifty, and F&O stocks based on your criteria.</p>
        </div>
        <div className="flex items-center gap-3">
          {results && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feed Active
            </div>
          )}
          <button
            onClick={runScan}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors w-full md:w-auto"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scanning Market...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Scan
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-300">Scan Results ({results.length} stocks found)</h3>
          <div className="grid gap-4">
            {results.map((stock, idx) => {
              const live = livePrices[stock.nseSymbol];
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={stock.nseSymbol}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold text-neutral-100">{stock.nseSymbol}</h4>
                        <span className="text-sm text-neutral-400">{stock.stockName}</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider flex items-center gap-1 ${stock.tradeType === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {stock.tradeType === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {stock.tradeType}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                        {stock.reason}
                      </p>
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 bg-neutral-950 px-2 py-1 rounded-md border border-neutral-800">
                        <Activity className="w-3.5 h-3.5" />
                        Vol: {stock.volumeStrength}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 flex-shrink-0 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">CMP</div>
                        <div className="font-mono text-lg text-neutral-200">₹{stock.currentPrice.toFixed(2)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Live</div>
                        {live ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-lg font-bold text-neutral-100">₹{live.currentPrice}</span>
                            <span className={`text-[10px] font-bold ${live.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {live.change >= 0 ? '+' : ''}{live.change} ({live.changePercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-500 italic">Syncing...</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Entry</div>
                        <div className="font-mono text-lg text-indigo-400">₹{stock.entryPrice.toFixed(2)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> SL
                        </div>
                        <div className="font-mono text-lg text-rose-400">₹{stock.stopLoss.toFixed(2)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                          <Target className="w-3 h-3" /> Targets
                        </div>
                        <div className="font-mono text-lg text-emerald-400">₹{stock.target1.toFixed(2)} / ₹{stock.target2.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {results.length === 0 && (
              <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <p className="text-neutral-400">No stocks matched the criteria at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

