"use client";

import { useState } from "react";

export default function Home() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<null | { status: string; message: string }>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    if (!address) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/check?address=" + encodeURIComponent(address));
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ status: "error", message: "Failed to fetch API" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full rounded-2xl bg-neutral-100 px-6 py-16 shadow-md dark:bg-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-bold leading-tight">
          Scan XRP tokens, wallets & projects <br />
          for <span className="text-[#008cff]">risk</span> — instantly.
        </h1>

        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          Get a clear Trust Score (Blue / Orange / Red) with transparent evidence:  
          domain + TOML, issuer flags, age, and more.
        </p>

        <div className="flex justify-center gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter XRP wallet address"
            className="w-80 rounded-lg border border-neutral-300 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className="rounded-lg bg-[#008cff] px-6 py-3 text-white shadow hover:bg-[#0072cc] disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Start scanning"}
          </button>
        </div>

        {result && (
          <div
            className={`mt-6 rounded-lg p-4 font-semibold ${
              result.status === "green"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : result.status === "orange"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : result.status === "red"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </section>
  );
}
