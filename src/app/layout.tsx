
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'PennyWise',
  description: 'Smart Budgeting and Expense Tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider> {/* AuthProvider wraps DataProvider */}
          <DataProvider>
            <AppShell>
              {children}
            </AppShell>
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
