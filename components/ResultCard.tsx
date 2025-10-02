// components/ResultCard.tsx
"use client";
import { useState } from "react";
import DebugSwitch from "./DebugSwitch";

type Verdict = "green" | "orange" | "red";

type ApiResult = {
  status: "ok" | "error";
  verdict?: Verdict;
  points?: number;
  reasons?: { label: string; impact: number }[];
  details?: {
    address?: string;
    ownerCount?: number;
    accountAgeDays?: number | null;
    domain?: string | null;
    tomlFound?: boolean;
    addressListed?: boolean;
    flagsDecoded?: Record<string, boolean>;
    regularKeySet?: boolean;
  };
  message?: string;
  disclaimer?: string;
};

function badgeStyle(v?: Verdict) {
  switch (v) {
    case "green":
      return "bg-emerald-600/90 text-white";
    case "orange":
      return "bg-amber-500/90 text-white";
    case "red":
      return "bg-rose-600/90 text-white";
    default:
      return "bg-slate-600/90 text-white";
  }
}

export default function ResultCard({ result }: { result: ApiResult | null }) {
  const [debug, setDebug] = useState(false);

  if (!result) return null;

  if (result.status === "error") {
    return (
      <div className="rounded-2xl border border-rose-400/50 bg-rose-500/10 p-4">
        <div className="mb-2 text-rose-400 font-semibold">API Error</div>
        <div className="text-sm opacity-90">{result.message ?? "Unknown error"}</div>
      </div>
    );
  }

  const { verdict, points, reasons = [], details, disclaimer } = result;

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-4 md:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className={`px-3 py-1.5 rounded-xl font-semibold ${badgeStyle(verdict)}`}>
          {verdict === "green" && "✅ Safe"}
          {verdict === "orange" && "🟠 Caution"}
          {verdict === "red" && "⛔ Risky"}
          {!verdict && "ℹ️ Result"}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Score: {typeof points === "number" ? points : "—"}</span>
          <DebugSwitch onChange={setDebug} />
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {reasons.map((r, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded-full text-xs border
                ${r.impact > 0 ? "border-rose-400" : r.impact < 0 ? "border-emerald-400" : "border-slate-400 dark:border-slate-600"}`}
              title={`impact ${r.impact > 0 ? "+" : ""}${r.impact}`}
            >
              {r.label}
            </span>
          ))}
        </div>
      )}

      {/* Debug details */}
      {debug && (
        <div className="mt-4 grid gap-2 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
            <div>Address: <span className="font-mono">{details?.address ?? "—"}</span></div>
            <div>Age (days): <b>{details?.accountAgeDays ?? "n/a"}</b></div>
            <div>OwnerCount: <b>{details?.ownerCount ?? "0"}</b></div>
            <div>Domain: <b>{details?.domain ?? "—"}</b></div>
            <div>xrp.toml: <b>{details?.tomlFound ? "found ✅" : "not found"}</b></div>
            <div>Listed in TOML: <b>{details?.addressListed ? "yes" : "no"}</b></div>
            <div>RegularKey set: <b>{details?.regularKeySet ? "yes" : "no"}</b></div>
          </div>

          <div className="mt-2">
            <div className="font-medium mb-1">Flags</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {Object.entries(details?.flagsDecoded || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border px-2 py-1
                    border-slate-300 dark:border-slate-700">
                  <span className="text-xs">{k}</span>
                  <span className={`text-xs font-semibold ${v ? "text-emerald-500" : "text-slate-400"}`}>
                    {v ? "true" : "false"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div className="mt-4 text-xs opacity-70">
          ⚠️ {disclaimer}
        </div>
      )}
    </div>
  );
}
