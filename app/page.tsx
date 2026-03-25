'use client';

import { useState } from 'react';
import Scanner from '@/components/Scanner';
import OptionsScanner from '@/components/OptionsScanner';
import BTSTScanner from '@/components/BTSTScanner';
import SwingScanner from '@/components/SwingScanner';
import MasterScanner from '@/components/MasterScanner';
import AdBanner from '@/components/AdBanner';
import { Activity, BarChart3, Zap, Calendar, LayoutGrid } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'intraday' | 'options' | 'btst' | 'swing' | 'master'>('master');

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3 pb-6 border-b border-neutral-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide uppercase border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Live Market Analysis
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100">NSE Professional Scanner</h1>
          <p className="text-neutral-400 max-w-3xl text-lg">
            AI-powered market analysis for the Indian stock market. Identify high-probability intraday, options, BTST, and swing trading opportunities using live data.
          </p>
        </header>

        <div className="flex flex-wrap p-1 bg-neutral-900 rounded-xl border border-neutral-800 w-fit gap-1">
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'master'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Master Scan
          </button>
          <button
            onClick={() => setActiveTab('intraday')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'intraday'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Intraday
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'options'
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Options
          </button>
          <button
            onClick={() => setActiveTab('btst')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'btst'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            BTST
          </button>
          <button
            onClick={() => setActiveTab('swing')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'swing'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Swing
          </button>
        </div>

        <div className="transition-all duration-300">
          {activeTab === 'master' && <MasterScanner />}
          {activeTab === 'intraday' && <Scanner />}
          {activeTab === 'options' && <OptionsScanner />}
          {activeTab === 'btst' && <BTSTScanner />}
          {activeTab === 'swing' && <SwingScanner />}
        </div>

        {/* Ad Placement at the bottom */}
        <div className="pt-12">
          <AdBanner dataAdSlot="1234567890" />
        </div>
      </div>
    </main>
  );
}




