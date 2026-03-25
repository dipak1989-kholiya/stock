'use client';

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Play, TrendingUp, AlertCircle, RefreshCw, Calendar, Target, ShieldAlert, Layers, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

interface SwingRecommendation {
  stockName: string;
  sector: string;
  currentPrice: number;
  swingDirection: 'Bullish' | 'Bearish';
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
  expectedHoldingPeriod: string;
  technicalReason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export default function SwingScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<SwingRecommendation[] | null>(null);
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
      const prompt = `Act as a professional swing trader for the Indian stock market.
      Use the googleSearch tool to find the latest NSE market data for today.
      Identify the top 5 swing trading opportunities for the next 3–15 days based on:
      1. Strong trend on daily chart.
      2. Breakout or pullback setup.
      3. RSI between 50–65.
      4. MACD bullish crossover.
      5. Volume expansion.
      6. Price above 50DMA and 200DMA.

      Return the result as a JSON array of objects.
      For each stock return:
      - Stock Name
      - Sector
      - Current Price
      - Swing Direction (Bullish / Bearish)
      - Entry Price
      - Target 1
      - Target 2
      - Stop Loss
      - Expected Holding Period
      - Technical Reason
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
                sector: { type: Type.STRING },
                currentPrice: { type: Type.NUMBER },
                swingDirection: { type: Type.STRING, enum: ['Bullish', 'Bearish'] },
                entryPrice: { type: Type.NUMBER },
                target1: { type: Type.NUMBER },
                target2: { type: Type.NUMBER },
                stopLoss: { type: Type.NUMBER },
                expectedHoldingPeriod: { type: Type.STRING },
                technicalReason: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              },
              required: ['stockName', 'sector', 'currentPrice', 'swingDirection', 'entryPrice', 'target1', 'target2', 'stopLoss', 'expectedHoldingPeriod', 'technicalReason', 'riskLevel'],
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
            <Calendar className="w-5 h-5 text-emerald-400" />
            Swing Trading Analyst
          </h2>
          <p className="text-sm text-neutral-400">Identifies 3-15 day setups based on daily chart trends and DMA support.</p>
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
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors w-full md:w-auto"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scanning Daily Charts...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Swing Scan
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
          <h3 className="text-lg font-medium text-neutral-300">Top 5 Swing Opportunities</h3>
          <div className="grid gap-4">
            {results.map((item, idx) => {
              const live = livePrices[item.stockName];
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={`${item.stockName}-${idx}`}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-2xl font-bold text-neutral-100">{item.stockName}</h4>
                        <span className="text-xs font-semibold text-neutral-500 bg-neutral-800 px-2 py-1 rounded uppercase tracking-wider">{item.sector}</span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider flex items-center gap-1 ${item.swingDirection === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {item.swingDirection === 'Bullish' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                          {item.swingDirection}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                          <Calendar className="w-3 h-3" /> {item.expectedHoldingPeriod}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">CMP</div>
                          <div className="text-lg font-mono text-neutral-100">₹{item.currentPrice}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Live</div>
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
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Entry Price</div>
                          <div className="text-lg font-mono text-indigo-400">₹{item.entryPrice}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Stop Loss</div>
                          <div className="text-lg font-mono text-rose-400">₹{item.stopLoss}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Risk</div>
                          <div className={`text-lg font-bold ${item.riskLevel === 'Low' ? 'text-emerald-500' : item.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-rose-500'}`}>
                            {item.riskLevel}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-neutral-950/40 rounded-xl border border-neutral-800/50">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Technical Analysis</div>
                        <p className="text-sm text-neutral-300 leading-relaxed">{item.technicalReason}</p>
                      </div>
                    </div>

                    <div className="lg:w-64 shrink-0 flex flex-col gap-3">
                      <div className="flex-1 bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-center items-center text-center">
                        <Target className="w-6 h-6 text-emerald-400 mb-2" />
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Target 1</div>
                        <div className="text-2xl font-black text-emerald-400">₹{item.target1}</div>
                      </div>
                      <div className="flex-1 bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col justify-center items-center text-center">
                        <Target className="w-6 h-6 text-emerald-500 mb-2 opacity-60" />
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Target 2</div>
                        <div className="text-2xl font-black text-emerald-500">₹{item.target2}</div>
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

