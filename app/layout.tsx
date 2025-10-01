import "./globals.css";
import Providers from "./providers";
import Header from "./Header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}