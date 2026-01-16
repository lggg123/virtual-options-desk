import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Market Insights - Virtual Options Desk",
  description: "Daily market analysis and trading opportunities powered by artificial intelligence",
  alternates: {
    types: {
      'application/rss+xml': '/api/blog/rss',
    },
  },
  openGraph: {
    title: "AI Market Insights - Virtual Options Desk",
    description: "Daily market analysis and trading opportunities powered by artificial intelligence",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
