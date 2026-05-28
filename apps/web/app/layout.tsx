import type { Metadata } from 'next';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Aether - Web3 Collaboration Platform',
    template: '%s | Aether',
  },
  description:
    'Collaborate with Web3 communities, govern with DAOs, and connect through decentralized networks',
  keywords: ['Web3', 'DAO', 'Collaboration', 'Blockchain', 'Community'],
  authors: [
    {
      name: 'Aether',
      url: 'https://aether.build',
    },
  ],
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
