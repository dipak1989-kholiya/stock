'use client';

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Play, AlertCircle, RefreshCw, LayoutGrid, ShieldCheck, ArrowUpRight, Info, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useLivePrices } from '@/lib/hooks/useLivePrices';

interface MasterTrade {
  stock: string;
  tradeType: 'Intraday' | 'Options' | 'BTST' | 'Swing';
  entry: number | string;
  target: number | string;
  stopLoss: number | string;
  confidence: number;
  reason: string;
}

export default function MasterScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<MasterTrade[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize stock list for live price tracking
  const stockList = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({ stock: r.stock, entry: r.entry }));
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
      const prompt = `Act as a professional stock market scanner for the Indian market (NSE).
      Use the googleSearch tool to find the latest market data, news, and technical indicators for today.
      Identify high-probability trade opportunities for:
      1. Intraday
      2. Options Trading
      3. BTST (Buy Today Sell Tomorrow)
      4. Swing Trading (3-15 days)

      Use these technical indicators in your analysis:
      - RSI (Relative Strength Index)
      - MACD (Moving Average Convergence Divergence)
      - VWAP (Volume Weighted Average Price)
      - Volume Breakout
      - Support & Resistance levels
      - Open Interest (specifically for Options)

      Return exactly the top 8-10 high-probability trades across these categories as a JSON array.
      Each object must have:
      - stock (Symbol)
      - tradeType (One of: "Intraday", "Options", "BTST", "Swing")
      - entry (Price or Range)
      - target (Price)
      - stopLoss (Price)
      - confidence (Percentage 0-100)
      - reason (Brief technical justification)`;

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
                tradeType: { type: Type.STRING, enum: ['Intraday', 'Options', 'BTST', 'Swing'] },
                entry: { type: Type.STRING },
                target: { type: Type.STRING },
                stopLoss: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ['stock', 'tradeType', 'entry', 'target', 'stopLoss', 'confidence', 'reason'],
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
      setError(err.message || 'An error occurred during the master scan.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-neutral-900 p-6 rounded-2xl border border-neutral-800 gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-100">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            Master Market Scanner
          </h2>
          <p className="text-sm text-neutral-400">Comprehensive scan across Intraday, Options, BTST, and Swing categories.</p>
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
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 w-full md:w-auto"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing Master Scan...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Master Scan
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
        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900/80 border-b border-neutral-800">
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Entry</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Live Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Target</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Stop Loss</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Confidence</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {results.map((trade, idx) => {
                const live = livePrices[trade.stock];
                return (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={`${trade.stock}-${idx}`}
                    className="hover:bg-neutral-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-100">{trade.stock}</span>
                        <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        trade.tradeType === 'Intraday' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                        trade.tradeType === 'Options' ? 'border-violet-500/30 text-violet-400 bg-violet-500/5' :
                        trade.tradeType === 'BTST' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' :
                        'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                      }`}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-neutral-300">{trade.entry}</td>
                    <td className="px-6 py-4">
                      {live ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-neutral-100">₹{live.currentPrice}</span>
                          <span className={`text-[10px] font-bold ${live.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {live.change >= 0 ? '+' : ''}{live.change} ({live.changePercent}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 italic">Connecting...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-emerald-400 font-bold">{trade.target}</td>
                    <td className="px-6 py-4 font-mono text-sm text-rose-400">{trade.stopLoss}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${trade.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-400">{trade.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-400 max-w-xs">
                        <Info className="w-3 h-3 shrink-0" />
                        <span className="truncate hover:whitespace-normal hover:overflow-visible hover:bg-neutral-900 hover:p-2 hover:rounded hover:border hover:border-neutral-700 hover:z-10 hover:absolute">
                          {trade.reason}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {results && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-900/30 p-4 rounded-xl border border-neutral-800/50">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>All trades are identified using multi-indicator confluence. Always maintain strict risk management.</span>
        </div>
      )}
    </div>
  );
}

