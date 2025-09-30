import { NextRequest } from "next/server";
import { computeScore } from "@/lib/scoring";

export const runtime = "edge";

function cleanDomain(input: string) {
  return input.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
}

async function headOk(url: string) {
  try { const r = await fetch(url, { method: "HEAD" }); return r.ok; } catch { return false; }
}

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    const d = cleanDomain(domain);

    const httpsOk = await headOk(`https://${d}`);
    const tomlOk = await headOk(`https://${d}/.well-known/xrp-ledger.toml`);

    const signals = [
      { key: "https_ok", ok: httpsOk, weight: 1 },
      { key: "toml_present", ok: tomlOk, weight: 2 },
    ];

    const score = computeScore(signals);

    return new Response(JSON.stringify({ score, domain: d, signals }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "project scan failed" }), { status: 400 });
  }
}
