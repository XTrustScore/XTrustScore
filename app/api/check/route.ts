import { NextResponse } from "next/server";
import xrpl from "xrpl";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ status: "error", message: "No address provided" }, { status: 400 });
  }

  try {
    // 1. Verbinden met XRPL mainnet
    const client = new xrpl.Client("wss://xrplcluster.com"); // publieke cluster
    await client.connect();

    // 2. Ophalen account info
    const account = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated"
    });

    client.disconnect();

    // 3. Basis checks
    const info = account.result.account_data;
    let status = "orange";
    let message = "Unknown wallet ⚠️";

    // Voorbeeld van trusted: Ripple donation address
    if (address === "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh") {
      status = "green";
      message = "Trusted Ripple donation wallet ✅";
    }
    // Check op flags / owner count
    else if (info.Flags === 0 && info.OwnerCount === 0) {
      status = "green";
      message = "Likely safe wallet (no suspicious flags) ✅";
    }
    else if (info.Domain) {
      status = "orange";
      message = `Wallet has domain: ${info.Domain}`;
    }
    else {
      status = "red";
      message = "Suspicious wallet ❌";
    }

    return NextResponse.json({ status, message, raw: info });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: "Ledger lookup failed: " + e.message });
  }
}
