'use client';

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Play, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, Target, ShieldAlert, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

interface OptionRecommendation {
  stockName: string;
  currentPrice: number;
  trend: 'Bullish' | 'Bearish';
  suggestedOption: 'Call' | 'Put';
  strikePrice: number;
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
  reason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export default function OptionsScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<OptionRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize stock list for live price tracking
  const stockList = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({ stock: r.stockName, entry: r.currentPrice }));
  }, [results]);

  const livePrices = useLivePrices(stockList);

  const runScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Please configure it in the AI Studio settings.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Act as a professional Indian stock market options trader.
      Use the googleSearch tool to find the latest live market data for today, specifically looking for NIFTY 50 and BANKNIFTY stocks with high momentum and volume.
      Identify the best options trading opportunities (Call or Put) based on the following conditions:
      1. Check trend using 5min, 15min and 1hr timeframes.
      2. Use indicators: VWAP, RSI, Volume Breakout, and Open Interest (OI) change.
      3. Identify support and resistance levels.
      4. Look for stocks with strong momentum and high volume.

      Return the result as a JSON array of objects.
      For each stock return:
      - Stock Name
      - Current Price
      - Trend (Bullish / Bearish)
      - Suggested Option (Call / Put)
      - Strike Price
      - Entry Price
      - Target 1
      - Target 2
      - Stop Loss
      - Reason for Trade
      - Risk Level (Low / Medium / High)`;

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
                stockName: { type: Type.STRING },
                currentPrice: { type: Type.NUMBER },
                trend: { type: Type.STRING, enum: ['Bullish', 'Bearish'] },
                suggestedOption: { type: Type.STRING, enum: ['Call', 'Put'] },
                strikePrice: { type: Type.NUMBER },
                entryPrice: { type: Type.NUMBER },
                target1: { type: Type.NUMBER },
                target2: { type: Type.NUMBER },
                stopLoss: { type: Type.NUMBER },
                reason: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              },
              required: ['stockName', 'currentPrice', 'trend', 'suggestedOption', 'strikePrice', 'entryPrice', 'target1', 'target2', 'stopLoss', 'reason', 'riskLevel'],
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
            <BarChart3 className="w-5 h-5 text-violet-400" />
            Options Strategy Scanner
          </h2>
          <p className="text-sm text-neutral-400">Identifies high-probability Call/Put setups for Nifty & Bank Nifty stocks.</p>
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
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors w-full md:w-auto"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing Options...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Scan Options
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
          <h3 className="text-lg font-medium text-neutral-300">Options Opportunities ({results.length})</h3>
          <div className="grid gap-4">
            {results.map((option, idx) => {
              const live = livePrices[option.stockName];
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={`${option.stockName}-${idx}`}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-bold text-neutral-100">{option.stockName}</h4>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider flex items-center gap-1 ${option.trend === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {option.trend === 'Bullish' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {option.trend}
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider ${option.suggestedOption === 'Call' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}>
                          {option.suggestedOption} @ {option.strikePrice}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${option.riskLevel === 'Low' ? 'border-emerald-500/30 text-emerald-500' : option.riskLevel === 'Medium' ? 'border-yellow-500/30 text-yellow-500' : 'border-rose-500/30 text-rose-500'}`}>
                          {option.riskLevel} Risk
                        </span>
                      </div>
                      
                      <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50 space-y-2">
                        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Strategy Reason</div>
                        <p className="text-sm text-neutral-300 leading-relaxed">
                          {option.reason}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto flex-shrink-0">
                      <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">CMP</div>
                        <div className="font-mono text-lg text-neutral-200">₹{option.currentPrice}</div>
                      </div>
                      <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Live</div>
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
                      <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Entry</div>
                        <div className="font-mono text-lg text-indigo-400">₹{option.entryPrice}</div>
                      </div>
                      <div className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Stop Loss</div>
                        <div className="font-mono text-lg text-rose-400">₹{option.stopLoss}</div>
                      </div>
                      <div className="col-span-2 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Targets</div>
                        <div className="font-mono text-lg text-emerald-400">₹{option.target1} / ₹{option.target2}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

