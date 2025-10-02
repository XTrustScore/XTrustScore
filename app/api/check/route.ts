// app/api/check/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Client } from "xrpl";

type Verdict = "green" | "orange" | "red";

function colorVerdict(points: number): Verdict {
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

  let client: Client | null = null;

  try {
    client = new Client(process.env.XRPL_NODE ?? "wss://xrplcluster.com");
    await client.connect();

    const infoResp = await client
      .request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      })
      .catch((e: any) => {
        if (
          e?.data?.error === "actNotFound" ||
          e?.data?.error === "act_not_found"
        ) {
          return null;
        }
        throw e;
      });

    if (!infoResp) {
      return NextResponse.json({
        status: "red",
        message: "Address not found on XRPL ❌",
        details: null,
      });
    }

    const acc = (infoResp.result as any).account_data;
    const flags: number = acc.Flags ?? 0;

    let points = 0;
    const reasons: string[] = [];

    if (address === "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh") {
      return NextResponse.json({
        status: "green",
        message: "Trusted Ripple donation wallet ✅",
        details: {
          account: acc,
          reasons: ["Known Ripple donation wallet"],
        },
      });
    }

    const lsfDisableMaster = (flags & 0x00100000) !== 0;
    if (!lsfDisableMaster) {
      points += 1;
      reasons.push("Master key is not disabled");
    }

    let decodedDomain: string | null = null;
    if (acc.Domain) {
      try {
        decodedDomain = Buffer.from(acc.Domain, "hex").toString("utf8");
        reasons.push(`Has domain: ${decodedDomain}`);
      } catch {
        reasons.push("Has domain (could not decode)");
      }
    }

    const ownerCount = acc.OwnerCount ?? 0;
    if (ownerCount > 10) {
      points += 1;
      reasons.push(`High owner count: ${ownerCount}`);
    }

    const verdict = colorVerdict(points);

    return NextResponse.json({
      status: verdict,
      message:
        verdict === "green"
          ? "Likely safe wallet ✅"
          : verdict === "orange"
          ? "Be cautious ⚠️"
          : "Suspicious wallet ❌",
      details: {
        account: acc,
        reasons,
        decodedDomain,
        flags,
        ownerCount,
      },
      note: "This score is only indicative. XRPulse cannot guarantee 100% safety.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Ledger lookup failed: " + (e?.message ?? String(e)),
      },
      { status: 500 }
    );
  } finally {
    if (client && client.isConnected()) {
      try {
        await client.disconnect();
      } catch {}
    }
  }
}
