// app/api/check/route.ts
export const runtime = "nodejs"; // ensure Node runtime

import { NextResponse } from "next/server";

type Verdict = "green" | "orange" | "red";

function verdictFrom(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { status: "error", message: "No address provided" },
      { status: 400 }
    );
  }

  const RPC = process.env.XRPL_RPC ?? "https://xrplcluster.com/"; // HTTPS JSON-RPC

  try {
    // 1) account_info via JSON-RPC (HTTPS, no websockets)
    const rpcBody = {
      method: "account_info",
      params: [{ account: address, ledger_index: "validated" }],
    };

    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rpcBody),
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP ${res.status}`);
    }

    const json = await res.json();

    // XRPL error when account is missing
    if (json?.result?.error === "actNotFound" || json?.result?.error === "act_not_found") {
      return NextResponse.json({
        status: "red",
        message: "Address not found on XRPL ❌",
        details: null,
      });
    }

    const acc = json?.result?.account_data;
    if (!acc) {
      throw new Error("Malformed RPC response");
    }

    // 2) Simple scoring heuristics (same logic as before)
    let points = 0;
    const reasons: string[] = [];
    const flags: number = acc.Flags ?? 0;

    // Known Ripple donation address => green
    if (address === "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh") {
      return NextResponse.json({
        status: "green",
        message: "Trusted Ripple donation wallet ✅",
        details: { account: acc, reasons: ["Known Ripple donation wallet"] },
        note: "This score is indicative only. XRPulse cannot guarantee 100% safety.",
      });
    }

    // Master key not disabled? (lsfDisableMaster = 0x00100000)
    const lsfDisableMaster = (flags & 0x00100000) !== 0;
    if (!lsfDisableMaster) {
      points += 1;
      reasons.push("Master key is not disabled");
    }

    // Domain (hex) present?
    let decodedDomain: string | null = null;
    if (acc.Domain) {
      try {
        decodedDomain = Buffer.from(acc.Domain, "hex").toString("utf8");
        reasons.push(`Has domain: ${decodedDomain}`);
      } catch {
        reasons.push("Has domain (could not decode)");
      }
    }

    // OwnerCount heuristic
    const ownerCount = acc.OwnerCount ?? 0;
    if (ownerCount > 10) {
      points += 1;
      reasons.push(`High owner count: ${ownerCount}`);
    }

    const status = verdictFrom(points);

    return NextResponse.json({
      status,
      message:
        status === "green"
          ? "Likely safe wallet ✅"
          : status === "orange"
          ? "Be cautious ⚠️"
          : "Suspicious wallet ❌",
      details: { account: acc, reasons, decodedDomain, flags, ownerCount },
      note: "Results are indicative only. XRPulse cannot guarantee 100% safety.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: "Ledger lookup failed: " + (e?.message ?? String(e)) },
      { status: 500 }
    );
  }
}
