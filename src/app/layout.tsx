import type { Metadata } from 'next';
import { Hanken_Grotesk, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
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

/** Runs before paint so theme class is on <html> and React cannot fight it with a hardcoded "dark". */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('localradar-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    var r = document.documentElement;
    r.classList.remove('light','dark');
    r.classList.add(t);
    r.setAttribute('data-theme', t);
    r.style.colorScheme = t;
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Do NOT hardcode "dark" here — ThemeProvider + blocking script own light/dark classes.
      // If "dark" is in React className, hydration overwrites classList and light mode never sticks.
      className={`h-full antialiased ${hanken.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
