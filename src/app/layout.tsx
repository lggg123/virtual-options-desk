import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { MarketSimulationProvider } from "@/components/MarketSimulationProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Virtual Options Desk",
  description: "Professional Options Trading Platform",
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
          {children}
        </MarketSimulationProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
