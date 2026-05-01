import type { Metadata } from "next";
import { ThemeProvider } from "./context/ThemeContext";
import SwKiller from "./components/SwKiller/SwKiller";
import "./globals.css";

export const metadata: Metadata = {
  title: "BytBoom — Trading Dashboard",
  description: "Professional crypto trading bot dashboard with real-time analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SwKiller />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
