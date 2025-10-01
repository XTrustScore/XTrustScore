/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import xrpl from "xrpl";

export const runtime = "edge";

/**
 * Body: { issuer: string, currency: string, topN?: number }
 * - issuer: XRPL account (r...)
 * - currency: 3-letter (e.g. "USD") or 40-hex uppercase code
 * Returns:
 *  - totalSupply: number
 *  - holdersCount: number
 *  - topHolders: Array<{ account: string, amount: number, percent: number }>
 *  - topNPercent: number
 *  - largestPercent: number
 */
export async function POST(req: NextRequest) {
  try {
    const { issuer, currency, topN = 10 } = await req.json();
    const iss = String(issuer || "").trim();
    const curRaw = String(currency || "").trim();
    if (!iss || !curRaw) {
      return new Response(JSON.stringify({ error: "issuer and currency are required" }), { status: 400 });
    }

    // Normalize currency comparison
    const isHexCurrency = /^[A-F0-9]{40}$/i.test(curRaw);
    const cur = isHexCurrency ? curRaw.toUpperCase() : curRaw.toUpperCase(); // XRPL uses uppercase codes

    // Connect (use same WSS as the rest of the app)
    const WSS = process.env.XRPL_WSS || "wss://xrplcluster.com";
    const client = new xrpl.Client(WSS);
    await client.connect();

    try {
      // Paginate account_lines for the ISSUER. Each line is the trustline with a counterparty.
      let marker: any | undefined;
      const holders: { account: string; amount: number }[] = [];

      do {
        const reqBody: any = {
          command: "account_lines",
          account: iss,
          ledger_index: "validated",
          limit: 400,
        };
        if (marker) reqBody.marker = marker;

        const resp: any = await client.request(reqBody);
        marker = resp.result?.marker;

        for (const line of resp.result?.lines ?? []) {
          // Match by currency
          const lineCur: string = String(line.currency || "").toUpperCase();
          if (lineCur !== cur) continue;

          // From the ISSUER's perspective, balances owed to holders are NEGATIVE.
          // Example: line.balance = "-123.456" means the counterparty holds 123.456 units.
          const bal = parseFloat(String(line.balance || "0"));
          const owedToHolder = bal < 0 ? -bal : 0; // only count negative (issuer owes)
          if (owedToHolder > 0) {
            const holder = String(line.account || "").trim();
            holders.push({ account: holder, amount: owedToHolder });
          }
        }
      } while (marker);

      // Aggregate (just in case of duplicates — normally there aren't)
      const map = new Map<string, number>();
      for (const h of holders) {
        map.set(h.account, (map.get(h.account) || 0) + h.amount);
      }
      const rows = Array.from(map.entries()).map(([account, amount]) => ({ account, amount }));

      // Totals
      const totalSupply = rows.reduce((a, r) => a + r.amount, 0);
      const holdersCount = rows.length;

      // Sort desc and compute topN %
      rows.sort((a, b) => b.amount - a.amount);
      const top = rows.slice(0, Math.max(1, Math.min(topN, rows.length)));
      const topSum = top.reduce((a, r) => a + r.amount, 0);
      const topNPercent = totalSupply > 0 ? (topSum / totalSupply) * 100 : 0;
      const largestPercent = totalSupply > 0 ? (top[0]?.amount / totalSupply) * 100 : 0;

      // Attach percent per holder (of total)
      const topHolders = top.map((r) => ({
        account: r.account,
        amount: +r.amount.toFixed(6),
        percent: totalSupply > 0 ? +( (r.amount / totalSupply) * 100 ).toFixed(2) : 0
      }));

      return new Response(JSON.stringify({
        issuer: iss,
        currency: cur,
        totalSupply: +totalSupply.toFixed(6),
        holdersCount,
        topN: top.length,
        topHolders,
        topNPercent: +topNPercent.toFixed(2),
        largestPercent: +largestPercent.toFixed(2),
      }), { status: 200 });
    } finally {
      try { await client.disconnect(); } catch {}
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "metrics error" }), { status: 400 });
  }
}
