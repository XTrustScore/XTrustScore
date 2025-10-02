"use client";

import { useState } from "react";

type ApiResult =
  | { status: "green" | "orange" | "red"; message: string; details?: any; note?: string }
  | { status: "error"; message: string };

export default function Home() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    if (!address) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/check?address=" + encodeURIComponent(address));
      const data = (await res.json()) as ApiResult;
      setResult(data);
    } catch {
      setResult({ status: "error", message: "Failed to reach API" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full rounded-2xl bg-neutral-100 px-6 py-16 shadow-md dark:bg-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-bold leading-tight">
          XRPulse — <span className="text-[#008cff]">scan XRP wallets instantly</span>
        </h1>

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
            {loading ? "Scanning..." : "Start Scan"}
          </button>
        </div>

        {result && (
          <div
            className={`mx-auto mt-6 w-full max-w-2xl rounded-lg p-4 text-left ${
              result.status === "green"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : result.status === "orange"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : result.status === "red"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            <div className="font-semibold">{result.message}</div>
            {"details" in result && result.details?.reasons?.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm opacity-90">
                {result.details.reasons.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs opacity-70">
              ⚠️ Results are indicative only. XRPulse cannot guarantee 100% safety.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
