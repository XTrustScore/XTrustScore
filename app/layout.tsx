import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XTrustScore",
  description: "Scan XRP tokens & projects for risk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
