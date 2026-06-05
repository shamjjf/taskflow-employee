import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'JJFIndia TaskFlow — Employee panel',
  description: 'Task management system for multi-department organizations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
