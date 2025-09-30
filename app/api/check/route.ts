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
    // Accept either just {account} or later extend to {issuer, currency}
    const { account } = await req.json();
    const acc = norm(account);

    // Issuer/account data
    const info = await fetchAccountInfo(acc);
    const acct = info.account_data;

    const domain = hexToDomain(acct.Domain);
    const toml = await hasToml(domain || undefined);

    const { masterDisabled, noFreeze, globalFreeze } = decodeAccountFlags(acct.Flags);
    const transferFeePct = calcTransferFeePct(acct.TransferRate);

    // Simple dispersion/popularity proxy: number of trustlines to this issuer
    // (Real holder concentration % requires currency+issuer and per-line balances.)
    let trustlines = 0;
    try { trustlines = await countTrustlines(acc); } catch { /* ignore */ }

    const signals = [
      // Existing basics
      { key: "domain_present",          ok: !!domain,         weight: 2, detail: domain || "" },
      { key: "toml_present",            ok: toml,             weight: 3 },
      { key: "master_key_disabled",     ok: masterDisabled,   weight: 3 },

      // New: issuer/token-related safeguards
      { key: "issuer_global_freeze_off", ok: !globalFreeze,    weight: 2 },
      { key: "issuer_no_freeze_enabled", ok: noFreeze,         weight: 2 },

      // New: transfer tax (prefer <= 1%)
      { key: "transfer_rate_reasonable", ok: transferFeePct <= 1, weight: 2, detail: `${transferFeePct.toFixed(2)}%` },

      // New: trustlines as rough popularity/dispersion signal (>= 10 looks healthier for tokens)
      { key: "trustlines_min_10",        ok: trustlines >= 10,    weight: 1, detail: `${trustlines}` },
    ];

    const score = computeScore(signals);

    return new Response(JSON.stringify({
      score,
      account: acc,
      details: { acct, transferFeePct, trustlines }
    }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "scan failed" }), { status: 400 });
  }
}
