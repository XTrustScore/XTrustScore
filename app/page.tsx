export default function Home() {
  return (
    <section className="w-full rounded-2xl bg-neutral-100 px-6 py-16 shadow-md dark:bg-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-bold leading-tight">
          Scan XRP tokens, wallets & projects <br />
          for <span className="text-green-500">risk</span> — instantly.
        </h1>

        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          Get a clear Trust Score (Green / Orange / Red) with transparent evidence:  
          domain + TOML, issuer flags, age, and more.  
          Protect yourself from scams & rug pulls on the XRPL.
        </p>

        <div className="flex justify-center gap-3">
          <button className="rounded-lg bg-green-600 px-6 py-3 text-white shadow hover:bg-green-700">
            Start scanning
          </button>
          <a
            href="#how"
            className="rounded-lg border border-neutral-300 px-6 py-3 shadow hover:bg-neutral-200 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Learn more
          </a>
        </div>
      </div>
    </section>
  );
}
