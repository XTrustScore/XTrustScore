import "./globals.css";
import Providers from "./providers";
import Header from "./Header";

export const metadata = {
  title: "XTrustScore",
  description: "Scan XRP wallets & issuers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-4xl p-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}