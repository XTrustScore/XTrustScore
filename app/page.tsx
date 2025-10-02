"use client";

import { useState } from "react";

type Verdict = "green" | "orange" | "red" | "error";
type ApiResult =
  | {
      status: Exclude<Verdict, "error">;
      message: string;
      details?: {
        reasons?: string[];
        decodedDomain?: string | null;
        flags?: number;
        ownerCount?: number;
        account?: any;
      };
      note?: string;
    }
  | { status: "error"; message: string };

const rippleBlue = "#008cff";
const rippleBlueDark = "#0072cc";

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
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <h1 className="text-4xl font-extrabold leading-tight">
          <span className="mr-2">XRPulse</span>
          <span className="text-[color:var(--rb)]">— scan XRP wallets instantly</span>
        </h1>

        <style>{`:root{--rb:${rippleBlue}} @media(prefers-color-scheme:dark){:root{--rb:${rippleBlue}}}`}</style>

        <div className="flex justify-center gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value.trim())}
            placeholder="Enter XRP wallet address"
            className="w-[22rem] rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition focus:border-[color:var(--rb)] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className="rounded-lg bg-[color:var(--rb)] px-6 py-3 font-semibold text-white shadow hover:bg-[color:${rippleBlueDark}] disabled:opacity-50"
          >
            {loading ? "Scanning…" : "Start Scan"}
          </button>
        </div>

        {result && <ResultCard result={result} />}
      </div>
    </section>
  );
}

/* ---------------- Result Card (Ripple-blue theme) ---------------- */

function ResultCard({ result }: { result: ApiResult }) {
  // surface/background by verdict
  const surface =
    result.status === "green"
      ? "bg-emerald-600"
      : result.status === "orange"
      ? "bg-amber-600"
      : result.status === "red"
      ? "bg-rose-600"
      : "bg-slate-700";

  // light/dark compatible inner card
  return (
    <div className={`mx-auto w-full max-w-2xl overflow-hidden rounded-xl`}>
      <div className={`${surface} px-5 py-3 text-white`}>
        <div className="flex items-center gap-2 text-left">
          <StatusBadge status={result.status} />
          <p className="font-semibold">{result.message}</p>
        </div>
      </div>

      <div className="space-y-3 bg-neutral-50 px-5 py-4 text-left text-sm dark:bg-neutral-800">
        {"details" in result && result.details?.reasons?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-200">
            {result.details.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-300">
            No extra signals reported for this address.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {"details" in result && result.details?.decodedDomain && (
            <Chip label={`domain: ${result.details.decodedDomain}`} />
          )}
          {"details" in result && typeof result.details?.ownerCount === "number" && (
            <Chip label={`ownerCount: ${result.details.ownerCount}`} />
          )}
          {"details" in result && typeof result.details?.flags === "number" && (
            <Chip label={`flags: ${result.details.flags}`} />
          )}
        </div>

        <p className="mt-1 flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>⚠️</span>
          <span>
            Results are **indicative only**. XRPulse cannot guarantee 100% safety. Always do your own
            research.
          </span>
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Verdict }) {
  const map: Record<
    Verdict,
    { text: string; bg: string; dot: string }
  > = {
    green: { text: "Trusted", bg: "bg-white/10", dot: "bg-emerald-300" },
    orange: { text: "Caution", bg: "bg-white/10", dot: "bg-amber-300" },
    red: { text: "Suspicious", bg: "bg-white/10", dot: "bg-rose-300" },
    error: { text: "Error", bg: "bg-white/10", dot: "bg-slate-300" },
  };
  const s = map[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${s.bg}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
      {label}
    </span>
  );
}
