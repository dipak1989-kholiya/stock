import Scanner from '@/components/Scanner';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-3 pb-6 border-b border-neutral-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide uppercase border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Live Market Analysis
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-100">NSE Intraday Scanner</h1>
          <p className="text-neutral-400 max-w-2xl text-lg">
            AI-powered intraday stock market scanner for the Indian stock market. Analyzes live market data to identify high-probability trading opportunities based on volume, price action, and technical indicators.
          </p>
        </header>
        <Scanner />
      </div>
    </main>
  );
}
