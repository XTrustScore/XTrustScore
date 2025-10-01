// app/page.tsx
export default function Home() {
  return (
    <section className="py-10 space-y-4">
      <h1 className="text-3xl font-bold">XTrustScore</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Scan XRP wallets & issuers. Gebruik de toggle rechtsboven voor dark mode.
      </p>
      {/* GEEN extra toggle hier! Alleen content. */}
    </section>
  );
}
