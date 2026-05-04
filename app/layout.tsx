import type { Metadata } from "next";
import { ThemeProvider } from "./context/ThemeContext";
import Providers from "./components/shared/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BytBoom — Trading Dashboard",
  description: "Professional crypto trading bot dashboard with real-time analytics",
};

// This stays a Server Component — no 'use client' here
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
