'use client';

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Play, TrendingUp, AlertCircle, RefreshCw, Zap, Target, ShieldAlert, Briefcase, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

interface BTSTRecommendation {
  stock: string;
  sector: string;
  closingPrice: number;
  breakoutLevel: number;
  entryRange: string;
  targetPrice: number;
  stopLoss: number;
  expectedGainPct: number;
  reason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export default function BTSTScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<BTSTRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize stock list for live price tracking
  const stockList = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({ stock: r.stock, entry: r.closingPrice }));
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
      const prompt = `Act as an Indian stock market swing analyst.
      Use the googleSearch tool to find the latest NSE market data for today, specifically looking for stocks with strong closing momentum and high delivery volume.
      Identify the top 5 BTST (Buy Today Sell Tomorrow) stock opportunities based on:
      1. Stocks with strong closing momentum.
      2. Breakout above resistance.
      3. High delivery volume.
      4. Positive news or sector strength.
      5. RSI between 55–70.
      6. Price above 20EMA and 50EMA.

      Return the result as a JSON array of objects.
      For each stock return:
      - Stock (Symbol)
      - Sector
      - Closing Price
      - Breakout Level
      - Entry Range
      - Target Price
      - Stop Loss
      - Expected Gain %
      - Reason for BTST Trade
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
                stock: { type: Type.STRING },
                sector: { type: Type.STRING },
                closingPrice: { type: Type.NUMBER },
                breakoutLevel: { type: Type.NUMBER },
                entryRange: { type: Type.STRING },
                targetPrice: { type: Type.NUMBER },
                stopLoss: { type: Type.NUMBER },
                expectedGainPct: { type: Type.NUMBER },
                reason: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              },
              required: ['stock', 'sector', 'closingPrice', 'breakoutLevel', 'entryRange', 'targetPrice', 'stopLoss', 'expectedGainPct', 'reason', 'riskLevel'],
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
            <Zap className="w-5 h-5 text-amber-400" />
            BTST Swing Analyst
          </h2>
          <p className="text-sm text-neutral-400">Identifies momentum stocks for &quot;Buy Today Sell Tomorrow&quot; setups.</p>
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
            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors w-full md:w-auto"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Finding BTST Picks...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Find BTST Stocks
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
          <h3 className="text-lg font-medium text-neutral-300">Top 5 BTST Opportunities</h3>
          <div className="grid gap-4">
            {results.map((item, idx) => {
              const live = livePrices[item.stock];
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={`${item.stock}-${idx}`}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${item.riskLevel === 'Low' ? 'border-emerald-500/30 text-emerald-500' : item.riskLevel === 'Medium' ? 'border-yellow-500/30 text-yellow-500' : 'border-rose-500/30 text-rose-500'}`}>
                      {item.riskLevel} Risk
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-2xl font-black text-neutral-100">{item.stock}</h4>
                          <span className="text-xs font-medium text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded uppercase tracking-wider">{item.sector}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-neutral-400">Closing: <span className="text-neutral-100 font-mono">₹{item.closingPrice}</span></span>
                          {live && (
                            <span className="text-neutral-400">Live: <span className={`font-mono font-bold ${live.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{live.currentPrice}</span></span>
                          )}
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {item.expectedGainPct}% Exp.
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-neutral-950/40 rounded-xl border border-neutral-800/50">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Trade Logic</div>
                        <p className="text-sm text-neutral-300 italic">&quot;{item.reason}&quot;</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:w-80 shrink-0">
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Entry Range</div>
                        <div className="text-sm font-medium text-neutral-200">{item.entryRange}</div>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Breakout</div>
                        <div className="text-sm font-medium text-amber-400">₹{item.breakoutLevel}</div>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Target</div>
                        <div className="text-sm font-bold text-emerald-400">₹{item.targetPrice}</div>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> SL</div>
                        <div className="text-sm font-bold text-rose-400">₹{item.stopLoss}</div>
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

