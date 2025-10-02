// app/api/check/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import xrpl from "xrpl";

type Verdict = "green" | "orange" | "red";

function colorVerdict(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

/* ------------------------- helpers / constants -------------------------- */

// Known-trusted allowlist (auto-green). Add your own.
const TRUSTED_WALLETS = new Set<string>([
  // Example placeholder(s); replace with your own trusted list
  // "rEXAMPLEexampleEXAMPLEexampleEXAMPLE"
]);

// AccountRoot flags (subset)
const FLAGS = {
  lsfRequireDestTag: 0x00020000,
  lsfRequireAuth: 0x00040000,
  lsfDisallowXRP: 0x00080000,
  lsfDisableMaster: 0x00100000,
  lsfNoFreeze: 0x00200000,
  lsfGlobalFreeze: 0x00400000,
  lsfDefaultRipple: 0x00800000,
  lsfDepositAuth: 0x01000000,
};

function hasFlag(flags: number | undefined, bit: number): boolean {
  if (typeof flags !== "number") return false;
  return (flags & bit) === bit;
}

function hexToAscii(hex?: string | null): string | null {
  if (!hex) return null;
  try {
    const bytes = hex.match(/.{1,2}/g) || [];
    return decodeURIComponent(
      bytes.map((b) => "%" + b).join("")
    ).replace(/\0+$/, "");
  } catch {
    // fallback plain conversion
    try {
      return Buffer.from(hex, "hex").toString("utf8").replace(/\0+$/, "");
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url: string, ms = 3500): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "XRPulse/1.0 (+https://xrpulse.app)",
        Accept: "text/plain,*/*",
      },
    });
  } finally {
    clearTimeout(id);
  }
}

async function getAccountInfo(client: xrpl.Client, address: string) {
  const r = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated",
    strict: true,
  });
  return r as any; // typing simplicity
}

/**
 * Get rough account age in days using the earliest transaction.
 * Uses account_tx with forward=true and limit=1 to fetch the oldest entry.
 */
async function getAccountAgeDays(client: xrpl.Client, address: string): Promise<number | null> {
  try {
    const r = await client.request({
      command: "account_tx",
      account: address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      forward: true,
      limit: 1,
    });

    const txs = (r as any).result?.transactions || [];
    if (!txs.length) return null;

    const first = txs[0];
    const ledgerIndex = first.tx?.ledger_index ?? first.ledger_index;
    if (!ledgerIndex) return null;

    // get ledger close time
    const ledger = await client.request({
      command: "ledger",
      ledger_index: ledgerIndex,
      transactions: false,
      expand: false,
    });

    const closeTime = (ledger as any).result?.ledger?.close_time; // ripple epoch seconds
    if (typeof closeTime !== "number") return null;

    const rippleEpochMs = (closeTime + 946684800) * 1000; // Ripple epoch (2000-01-01) → Unix epoch
    const ageMs = Date.now() - rippleEpochMs;
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
}

/**
 * Attempt to resolve xrp.toml and check whether the address appears in it.
 * Returns { domain, tomlFound, addressListed }.
 */
async function checkXrpToml(address: string, domainHex?: string | null) {
  const domain = hexToAscii(domainHex)?.trim().replace(/\/+$/, "") || null;
  if (!domain) {
    return { domain: null, tomlFound: false, addressListed: false };
  }

  const urls = [
    `https://${domain}/.well-known/xrp.toml`,
    `https://www.${domain}/.well-known/xrp.toml`,
  ];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 3500);
      if (!res.ok) continue;
      const text = await res.text();
      // Cheap heuristic: check if the address shows up in the TOML body.
      // (You can switch to a TOML parser later if you want strict parsing.)
      const addressListed = text.includes(address);
      return { domain, tomlFound: true, addressListed };
    } catch {
      // ignore and try next
    }
  }
  return { domain, tomlFound: false, addressListed: false };
}

/* ------------------------------ handler -------------------------------- */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { status: "error", message: "No address provided" },
      { status: 400 }
    );
  }

  let client: xrpl.Client | null = null;

  try {
    // Connect to XRPL mainnet
    client = new xrpl.Client("wss://s1.ripple.com");
    await client.connect();

    // 1) account_info
    const info = await getAccountInfo(client, address);
    const data = info.result.account_data;
    const flags = data.Flags as number | undefined;
    const ownerCount = Number(data.OwnerCount ?? 0);
    const regKey = data.RegularKey as string | undefined;
    const domainHex = data.Domain as string | undefined;

    // 2) domain + xrp.toml
    const { domain, tomlFound, addressListed } = await checkXrpToml(address, domainHex);

    // 3) account age
    const accountAgeDays = await getAccountAgeDays(client, address);

    // 4) Heuristic scoring
    let points = 0;
    const reasons: { label: string; impact: number }[] = [];

    // Allowlist: force green
    if (TRUSTED_WALLETS.has(address)) {
      return NextResponse.json({
        status: "ok",
        verdict: "green" as Verdict,
        points: 0,
        reasons: [{ label: "Trusted allowlist wallet", impact: -999 }],
        details: {
          address,
          ownerCount,
          accountAgeDays,
          domain,
          tomlFound,
          addressListed,
          flagsDecoded: {
            RequireDestTag: hasFlag(flags, FLAGS.lsfRequireDestTag),
            RequireAuth: hasFlag(flags, FLAGS.lsfRequireAuth),
            DisallowXRP: hasFlag(flags, FLAGS.lsfDisallowXRP),
            DisableMaster: hasFlag(flags, FLAGS.lsfDisableMaster),
            NoFreeze: hasFlag(flags, FLAGS.lsfNoFreeze),
            GlobalFreeze: hasFlag(flags, FLAGS.lsfGlobalFreeze),
            DefaultRipple: hasFlag(flags, FLAGS.lsfDefaultRipple),
            DepositAuth: hasFlag(flags, FLAGS.lsfDepositAuth),
          },
        },
        disclaimer:
          "Results are indicative only. XRPulse cannot guarantee 100% safety.",
      });
    }

    // GlobalFreeze is a major red flag
    if (hasFlag(flags, FLAGS.lsfGlobalFreeze)) {
      points += 3;
      reasons.push({ label: "Account has GlobalFreeze set", impact: +3 });
    }

    // DisableMaster without RegularKey can brick access (risky config)
    if (hasFlag(flags, FLAGS.lsfDisableMaster) && !regKey) {
      points += 2;
      reasons.push({
        label: "Master key disabled without RegularKey",
        impact: +2,
      });
    }

    // Very young accounts are riskier
    if (accountAgeDays !== null) {
      if (accountAgeDays < 7) {
        points += 2;
        reasons.push({ label: "Account age < 7 days", impact: +2 });
      } else if (accountAgeDays < 30) {
        points += 1;
        reasons.push({ label: "Account age < 30 days", impact: +1 });
      }
    }

    // OwnerCount high might indicate complex setup (not necessarily bad)
    if (ownerCount > 20) {
      points += 1;
      reasons.push({ label: "High OwnerCount (>20)", impact: +1 });
    }

    // TOML presence generally lowers risk; verified listing lowers more
    if (domain) {
      if (tomlFound) {
        points -= 1;
        reasons.push({ label: "xrp.toml found on domain", impact: -1 });
        if (addressListed) {
          points -= 1;
          reasons.push({ label: "Address listed in xrp.toml", impact: -1 });
        }
      } else {
        reasons.push({ label: "Domain set but xrp.toml not found", impact: 0 });
      }
    } else {
      reasons.push({ label: "No domain configured", impact: 0 });
    }

    // RequireDestTag can be positive for exchanges (less phishing risk).
    if (hasFlag(flags, FLAGS.lsfRequireDestTag)) {
      points -= 1;
      reasons.push({ label: "RequireDestTag enabled", impact: -1 });
    }

    // Aggregate
    const verdict = colorVerdict(points);

    return NextResponse.json(
      {
        status: "ok",
        verdict,
        points,
        reasons,
        details: {
          address,
          ownerCount,
          accountAgeDays,
          domain,
          tomlFound,
          addressListed,
          flagsDecoded: {
            RequireDestTag: hasFlag(flags, FLAGS.lsfRequireDestTag),
            RequireAuth: hasFlag(flags, FLAGS.lsfRequireAuth),
            DisallowXRP: hasFlag(flags, FLAGS.lsfDisallowXRP),
            DisableMaster: hasFlag(flags, FLAGS.lsfDisableMaster),
            NoFreeze: hasFlag(flags, FLAGS.lsfNoFreeze),
            GlobalFreeze: hasFlag(flags, FLAGS.lsfGlobalFreeze),
            DefaultRipple: hasFlag(flags, FLAGS.lsfDefaultRipple),
            DepositAuth: hasFlag(flags, FLAGS.lsfDepositAuth),
          },
          regularKeySet: Boolean(regKey),
        },
        disclaimer:
          "Results are indicative only. XRPulse cannot guarantee 100% safety.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    try {
      await client?.disconnect();
    } catch {}
  }
}
