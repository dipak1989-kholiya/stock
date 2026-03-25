import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'NSE Intraday Scanner',
  description: 'Professional intraday stock market scanner for the Indian stock market (NSE) using AI.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-8319858590933477';

  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning className="font-sans bg-neutral-950 text-neutral-50">{children}</body>
    </html>
  );
}
