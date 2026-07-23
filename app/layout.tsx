import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Article Enhancer',
  description:
    'Submit an article to an SEO enhancement pipeline and watch gap analysis, recommendations, an enhanced draft, and coverage verification stream in live.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen bg-paper font-sans text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
