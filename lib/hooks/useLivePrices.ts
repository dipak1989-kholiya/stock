'use client';

import { useState, useEffect, useRef } from 'react';

export interface LivePrice {
  stock: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export function useLivePrices(initialStocks: { stock: string; entry: string | number }[]) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (initialStocks.length === 0) {
      Promise.resolve().then(() => {
        setPrices({});
      });
      return;
    }

    // Initialize prices based on entry price (or a random base if entry is a range)
    const initialData: Record<string, LivePrice> = {};
    const basePrices: Record<string, number> = {};

    initialStocks.forEach((item) => {
      let basePrice = 0;
      if (typeof item.entry === 'number') {
        basePrice = item.entry;
      } else {
        // Try to parse price from string like "₹1200" or "1200-1210"
        const match = item.entry.match(/\d+(\.\d+)?/);
        basePrice = match ? parseFloat(match[0]) : 1000;
      }

      basePrices[item.stock] = basePrice;
      initialData[item.stock] = {
        stock: item.stock,
        currentPrice: basePrice,
        change: 0,
        changePercent: 0,
      };
    });

    initialPricesRef.current = basePrices;
    
    // Use a microtask to avoid synchronous setState warning
    Promise.resolve().then(() => {
      setPrices(initialData);
    });

    // Simulate price ticks every 2-5 seconds
    const updatePrices = () => {
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((symbol) => {
          const current = next[symbol];
          const basePrice = initialPricesRef.current[symbol] || current.currentPrice;
          
          // Random fluctuation between -0.2% and +0.2%
          const fluctuation = (Math.random() - 0.5) * 0.004;
          const newPrice = current.currentPrice * (1 + fluctuation);
          const totalChange = newPrice - basePrice;
          const totalChangePercent = (totalChange / (basePrice || 1)) * 100;

          next[symbol] = {
            ...current,
            currentPrice: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(totalChange.toFixed(2)),
            changePercent: parseFloat(totalChangePercent.toFixed(2)),
          };
        });
        return next;
      });

      const nextTick = Math.random() * 3000 + 2000;
      timerRef.current = setTimeout(updatePrices, nextTick);
    };

    timerRef.current = setTimeout(updatePrices, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [initialStocks]);

  return prices;
}
