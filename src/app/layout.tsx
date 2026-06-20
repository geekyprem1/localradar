import type { Metadata } from 'next';
import { Hanken_Grotesk, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hanken',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jbmono',
});

export const metadata: Metadata = {
  title: 'LocalRadar | Discover Local Business Gaps',
  description: 'AI-Powered Local Business Intelligence. Scan niches, calculate opportunity scores, generate audits, and draft copy sequences to close clients.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased dark ${hanken.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
