import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { MarketSimulationProvider } from "@/components/MarketSimulationProvider";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stock Picks - AI-Powered Stock Analysis & Virtual Options Trading",
  description: "Professional AI-powered stock analysis platform with ML screening, pattern detection, and virtual options trading simulator with live market data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MarketSimulationProvider>
          <div className="min-h-screen bg-slate-950">
            <Navigation />
            <main className="lg:pl-64">
              <div className="lg:pt-0 pt-16">
                {children}
              </div>
            </main>
          </div>
        </MarketSimulationProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
