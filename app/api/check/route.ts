import { NextRequest } from "next/server";
import { fetchAccountInfo, hexToDomain, decodeAccountFlags, calcTransferFeePct, countTrustlines } from "@/lib/xrpl";
import { computeScore } from "@/lib/scoring";

export const runtime = "edge";

function norm(s: string) { return s.trim(); }

async function hasToml(domain?: string) {
  if (!domain) return false;
  try {
    const r = await fetch(`https://${domain}/.well-known/xrp-ledger.toml`, { cache: "no-store" });
    return r.ok;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  try {
    const { account, kind } = await req.json(); // kind: "issuer" | "address"
    const mode: "issuer" | "address" = (kind === "address" ? "address" : "issuer");
    const acc = norm(account);

    const info = await fetchAccountInfo(acc);
    const acct = info.account_data;

    const { masterDisabled, noFreeze, globalFreeze } = decodeAccountFlags(acct.Flags);
    const domain = hexToDomain(acct.Domain);
    const toml = await hasToml(domain || undefined);
    const transferFeePct = calcTransferFeePct(acct.TransferRate);

    let trustlines = 0;
    try { trustlines = await countTrustlines(acc); } catch {}

    // --- Mode-aware signals ---
    const signals = [];

    // Common safety
    signals.push({ key: "master_key_disabled", ok: masterDisabled, weight: 3 });

    if (mode === "issuer") {
      // Issuer-specific checks
      signals.push(
        { key: "domain_present",              ok: !!domain,          weight: 2, detail: domain || "" },
        { key: "toml_present",                ok: toml,              weight: 3 },
        { key: "issuer_global_freeze_off",    ok: !globalFreeze,     weight: 2 },
        { key: "issuer_no_freeze_enabled",    ok: noFreeze,          weight: 2 },
        { key: "transfer_rate_reasonable",    ok: transferFeePct <= 1, weight: 2, detail: `${transferFeePct.toFixed(2)}%` },
        { key: "trustlines_min_10",           ok: trustlines >= 10,  weight: 1, detail: `${trustlines}` },
      );
    } else {
      // Wallet scan: do NOT penalize missing domain/TOML
      // Use a lighter heuristic: older sequence looks healthier; no global freeze from this account (mostly irrelevant).
      const young = (acct.Sequence ?? 0) >= 1000;
      signals.push(
        { key: "account_old_enough",          ok: !young,            weight: 1 },
      );
    }

    const score = computeScore(signals as any);

    return new Response(JSON.stringify({
      score,
      account: acc,
      details: { acct, transferFeePct, trustlines, mode },
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "scan failed" }), { status: 400 });
  }
}
