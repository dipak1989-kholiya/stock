import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
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
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-neutral-950 text-neutral-50">{children}</body>
    </html>
  );
}
