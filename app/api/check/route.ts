// Forceer Node.js runtime (WS werkt niet op Edge)
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Client } from "xrpl";

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
    // 1) Verbinden met XRPL mainnet
    client = new Client(process.env.XRPL_NODE ?? "wss://xrplcluster.com");
    await client.connect();

    // 2) account_info ophalen
    const infoResp = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    }).catch((e: any) => {
      // XRPL error als account niet bestaat
      if (e?.data?.error === "actNotFound" || e?.data?.error === "act_not_found") {
        return null;
      }
      throw e;
    });

    if (!infoResp) {
      return NextResponse.json({
        status: "red",
        message: "Address not found on XRPL ❌",
        raw: null,
      });
    }

    const acc = (infoResp.result as any).account_data;
    const flags: number = acc.Flags ?? 0;

    // 3) Simpele heuristiek
    let status: "green" | "orange" | "red" = "orange";
    let message = "Unknown wallet ⚠️";

    // Bekend Ripple donation adres → green
    if (address === "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh") {
      status = "green";
      message = "Trusted Ripple donation wallet ✅";
    } else if ((flags === 0 || flags === undefined) && (acc.OwnerCount ?? 0) === 0) {
      status = "green";
      message = "Likely safe wallet (no suspicious flags) ✅";
    } else if (acc.Domain) {
      // Domain is in hex, decode
      try {
        const decoded = Buffer.from(acc.Domain, "hex").toString("utf8");
        message = `Wallet has domain: ${decoded}`;
        status = "orange";
      } catch {
        message = "Wallet has domain (could not decode) ⚠️";
        status = "orange";
      }
    } else {
      status = "red";
      message = "Suspicious wallet ❌";
    }

    return NextResponse.json({ status, message, raw: acc });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      message: "Ledger lookup failed: " + (e?.message ?? String(e)),
    }, { status: 500 });
  } finally {
    if (client && client.isConnected()) {
      try { await client.disconnect(); } catch {}
    }
  }
}
