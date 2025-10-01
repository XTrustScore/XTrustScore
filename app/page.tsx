"use client";

import { useState } from "react";

type Level = "green" | "orange" | "red";
type Tab = "token" | "address" | "project";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const lvlEmoji = (l?: Level) => (l === "green" ? "🟢" : l === "orange" ? "🟠" : l === "red" ? "🔴" : "•");
const pctBar = (p: number) => (p >= 75 ? "bg-emerald-500" : p >= 40 ? "bg-amber-500" : "bg-rose-500");
const pctBadge = (p: number) =>
  p >= 75
    ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20 border-emerald-300"
    : p >= 40
    ? "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/20 border-amber-300"
    : "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/20 border-rose-300";

export default function Page() {
  return <App />;
}

function App() {
  const [tab, setTab] = useState<Tab>("token");
  const [q, setQ] = useState("");                 // account (issuer or wallet)
  const [currency, setCurrency] = useState("");   // only used in token/issuer mode
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [res, setRes] = useState<any>(null);

  // Token metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsErr, setMetricsErr] = useState<string>("");

  function toggleDark() {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    try { localStorage.setItem("xtrust-theme", isDark ? "dark" : "light"); } catch {}
  }

  async function run() {
    try {
      setLoading(true);
      setErr("");
      setRes(null);
      setMetrics(null);
      setMetricsErr("");

      if (tab === "project") {
        const r = await fetch("/api/project-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: q }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Scan failed");
        setRes(j);
      } else {
        const kind = tab === "address" ? "address" : "issuer";
        const r = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: q, kind }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Scan failed");
        setRes(j);

        // If issuer mode and currency provided → fetch holder concentration
        if (kind === "issuer" && currency.trim()) {
          setMetricsLoading(true);
          try {
            const m = await fetch("/api/token-metrics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ issuer: q.trim(), currency: currency.trim(), topN: 10 }),
            });
            const mj = await m.json();
            if (!m.ok) throw new Error(mj?.error || "metrics failed");
            setMetrics(mj);
          } catch (e: any) {
            setMetricsErr(e?.message || "metrics failed");
          } finally {
            setMetricsLoading(false);
          }
        }
      }
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const percent = res?.score?.percent ?? 0;
  const level: Level | undefined = res?.score?.level;

  const transferFee = res?.details?.transferFeePct as number | undefined;
  const trustlines = res?.details?.trustlines as number | undefined;
  const signals = (res?.score?.signals as any[]) || [];
  const hasGlobalFreeze = signals.find((s) => s.key === "issuer_global_freeze_off" && s.ok === false);
  const lowTrustlines = typeof trustlines === "number" && trustlines < 10;
  const highTax = typeof transferFee === "number" && transferFee > 1;

  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Nav onToggleDark={toggleDark} />

      {/* HERO */}
      <header className="border-b border-zinc-200/60 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Scan XRP tokens, wallets & projects for <span className="text-emerald-500">risk</span> — instantly.
            </h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-300">
              Wallet scans don’t penalize missing domains. Issuer scans check TOML, freeze/clawback, transfer tax, trustlines — and now holder concentration %.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#scan" className="rounded-2xl border px-4 py-2">Start scanning</a>
              <button onClick={toggleDark} className="rounded-2xl border px-4 py-2">Toggle Dark</button>
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5">
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <li className="rounded-2xl border p-3">Issuer master key <b className="float-right">disabled?</b></li>
              <li className="rounded-2xl border p-3">xrp-ledger.toml <b className="float-right">present?</b></li>
              <li className="rounded-2xl border p-3">Global freeze <b className="float-right">OFF?</b></li>
              <li className="rounded-2xl border p-3">Holder top-10 <b className="float-right">reasonable?</b></li>
            </ul>
          </div>
        </div>
      </header>

      {/* SCAN */}
      <section id="scan" className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl border p-1 bg-zinc-50 dark:bg-zinc-900">
            {[
              { id: "token", label: "Token / Issuer (XRP)" },
              { id: "address", label: "Wallet Address" },
              { id: "project", label: "Project Domain" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={cx("px-3 py-2 rounded-xl text-sm", tab === t.id && "bg-white dark:bg-zinc-800 shadow")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-4 rounded-3xl border p-4 md:p-6">
          <div className={cx("grid gap-3", tab === "token" ? "md:grid-cols-[1fr_220px_auto]" : "md:grid-cols-[1fr_auto]")}>
            <input
              className="w-full rounded-2xl border px-4 py-3 bg-white dark:bg-zinc-900"
              placeholder={tab === "project" ? "Enter project domain (example.com)" : "Enter XRP account (starts with r…)"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {tab === "token" && (
              <input
                className="w-full rounded-2xl border px-4 py-3 bg-white dark:bg-zinc-900"
                placeholder="Currency code (e.g. USD or 534F4D45544F4B454E00000000000000000000)"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            )}
            <button
              onClick={run}
              disabled={loading || !q.trim() || (tab === "token" && !q.trim())}
              className="rounded-2xl px-5 py-3 bg-zinc-900 text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
              {loading ? "Scanning…" : "Scan now"}
            </button>
          </div>
          {tab === "token" && (
            <p className="text-xs opacity-70 mt-3">
              Currency must match the issuer’s token code exactly. 3-letter (e.g. <b>USD</b>) or 40-hex uppercase for custom codes.
            </p>
          )}
        </div>

        {/* Errors */}
        {err && (
          <div className="mt-4 rounded-2xl border border-rose-500 bg-rose-50 p-4 text-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
            ❌ {err}
          </div>
        )}

        {/* RESULTS */}
        {!loading && res && (
          <div className="grid gap-6 md:grid-cols-3 mt-6">
            <div className="md:col-span-2 space-y-6">
              {/* Score card */}
              <div className="rounded-3xl border p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Trust Score</h3>
                  <span className="text-2xl" title={level || ""}>{lvlEmoji(level)}</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className={cx("rounded-2xl border px-4 py-3 text-lg font-semibold", "border", pctBadge(res?.score?.percent ?? 0))}>
                    {res?.score?.percent ?? 0}%
                  </div>
                  <div className="flex-1 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div className={cx("h-full", pctBar(res?.score?.percent ?? 0))} style={{ width: `${Math.min(100, Math.max(0, res?.score?.percent ?? 0))}%` }} />
                  </div>
                </div>
                <div className="mt-3 text-sm opacity-80">
                  Bands: <b>75–100</b> Green, <b>40–74</b> Orange, <b>0–39</b> Red.
                </div>
              </div>

              {/* Signals */}
              <div className="rounded-3xl border p-5">
                <h3 className="text-lg font-semibold">Signals (evidence)</h3>
                <ul className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  {(res?.score?.signals || []).map((s: any) => (
                    <li
                      key={s.key}
                      className={cx(
                        "rounded-2xl border p-3",
                        s.ok ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20" : "border-rose-300 bg-rose-50 dark:bg-rose-900/20"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{labelize(s.key)}</span>
                        <span className={cx("text-xs rounded-full px-2 py-1 border",
                          s.ok ? "border-emerald-300 text-emerald-700 dark:text-emerald-300"
                               : "border-rose-300 text-rose-700 dark:text-rose-300")}>
                          {s.ok ? "OK" : "Fail"}
                        </span>
                      </div>
                      {s.detail && <div className="text-xs mt-1 opacity-80 break-all">{s.detail}</div>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Holder concentration (only if we have metrics) */}
              {(tab === "token") && (
                <div className="rounded-3xl border p-5">
                  <h3 className="text-lg font-semibold">Holder concentration</h3>
                  {metricsLoading && <p className="mt-2 opacity-80 text-sm">Calculating holder distribution…</p>}
                  {metricsErr && <p className="mt-2 text-sm text-rose-600">❌ {metricsErr}</p>}
                  {!metricsLoading && !metricsErr && metrics && (
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs opacity-70">Total supply (from trustlines)</div>
                          <div className="text-base font-semibold">{metrics.totalSupply}</div>
                        </div>
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs opacity-70">Holders</div>
                          <div className="text-base font-semibold">{metrics.holdersCount}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs opacity-70">Top {metrics.topN} holders</div>
                          <div className="text-base font-semibold">{metrics.topNPercent}%</div>
                        </div>
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs opacity-70">Largest holder</div>
                          <div className="text-base font-semibold">{metrics.largestPercent}%</div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="text-xs opacity-70 mb-1">Top holders</div>
                        <div className="rounded-2xl border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-900">
                              <tr>
                                <th className="text-left px-3 py-2">Account</th>
                                <th className="text-right px-3 py-2">Amount</th>
                                <th className="text-right px-3 py-2">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.topHolders.map((h: any) => (
                                <tr key={h.account} className="border-t">
                                  <td className="px-3 py-2 break-all">{h.account}</td>
                                  <td className="px-3 py-2 text-right">{h.amount}</td>
                                  <td className="px-3 py-2 text-right">{h.percent}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Simple risk hint */}
                      <div className="text-xs opacity-80">
                        Hint: if a single holder &gt; 50% or top-10 &gt; 90%, that’s typically high risk for a rug pull.
                      </div>
                    </div>
                  )}
                  {!metricsLoading && !metrics && !metricsErr && (
                    <p className="mt-2 text-sm opacity-80">Enter a currency code and scan to compute distribution.</p>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {(hasGlobalFreeze || lowTrustlines || highTax) && (
                <div className="rounded-3xl border border-amber-400 bg-amber-50 p-5 dark:bg-amber-900/20">
                  <h3 className="text-lg font-semibold">Alerts</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    {hasGlobalFreeze && <li>Issuer has <b>global freeze</b> ON — high risk.</li>}
                    {typeof transferFee === "number" && transferFee > 1 && <li>Transfer tax: <b>{transferFee.toFixed(2)}%</b> — caution.</li>}
                    {typeof trustlines === "number" && trustlines < 10 && <li>Very few trustlines (<b>{trustlines}</b>) — low adoption.</li>}
                  </ul>
                </div>
              )}

              <div className="rounded-3xl border p-5">
                <h3 className="text-lg font-semibold">Quick checks</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {res?.account && (
                    <li className="flex justify-between">
                      <span>Target account</span>
                      <code className="opacity-80">{res.account}</code>
                    </li>
                  )}
                  {res?.domain && (
                    <li className="flex justify-between">
                      <span>Project domain</span>
                      <code className="opacity-80">{res.domain}</code>
                    </li>
                  )}
                  {res?.details?.acct?.Sequence !== undefined && (
                    <li className="flex justify-between">
                      <span>Sequence</span>
                      <span className="opacity-80">{res.details.acct.Sequence}</span>
                    </li>
                  )}
                  {res?.details?.acct?.Flags !== undefined && (
                    <li className="flex justify-between">
                      <span>Flags</span>
                      <span className="opacity-80">{res.details.acct.Flags}</span>
                    </li>
                  )}
                </ul>
                <details className="mt-3">
                  <summary className="text-sm opacity-80 cursor-pointer">Raw JSON</summary>
                  <pre className="mt-2 text-xs overflow-auto bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl">{JSON.stringify(res, null, 2)}</pre>
                </details>
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="text-lg font-semibold">Safety & disclaimer</h3>
                <p className="mt-2 text-sm opacity-90">Heuristic indicators only; not financial advice. Not affiliated with Ripple or XRPL Foundation.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="mt-10 py-10 border-t border-zinc-200/60 dark:border-zinc-800 text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="opacity-80">© {new Date().getFullYear()} XTrustScore — Community tool</div>
          <div className="opacity-70 space-x-2">
            <a className="hover:opacity-100" href="#">Privacy</a>
            <span>•</span>
            <a className="hover:opacity-100" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Nav({ onToggleDark }: { onToggleDark: () => void }) {
  return (
    <nav className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-white grid place-items-center text-white dark:text-zinc-900 font-bold">X</span>
          <span className="font-semibold">XTrustScore</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm opacity-80">
          <a href="#how" className="hover:opacity-100">How it works</a>
          <a href="#signals" className="hover:opacity-100">Signals</a>
          <a href="#scan" className="hover:opacity-100">Scan</a>
        </div>
        <button onClick={onToggleDark} className="rounded-xl border px-3 py-2 text-sm">Toggle</button>
      </div>
    </nav>
  );
}

function labelize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
