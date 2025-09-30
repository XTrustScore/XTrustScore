import xrpl, { Client } from "xrpl";

const WSS = process.env.XRPL_WSS || "wss://xrplcluster.com";

export async function withClient<T>(fn: (c: Client) => Promise<T>) {
  const client = new xrpl.Client(WSS);
  await client.connect();
  try { return await fn(client); } finally { await client.disconnect(); }
}

export async function fetchAccountInfo(account: string) {
  return withClient(async (c) => {
    const info = await c.request({ command: "account_info", account, ledger_index: "validated" });
    return info.result;
  });
}

export function hexToDomain(hex?: string) {
  if (!hex) return null;
  try { return Buffer.from(hex, "hex").toString("utf8"); } catch { return null; }
}

/**
 * Decode important AccountRoot flag bits.
 * Docs (bits may change): lsfDisableMaster=0x00100000, lsfNoFreeze=0x00200000, lsfGlobalFreeze=0x00400000
 */
export function decodeAccountFlags(flags: number | undefined) {
  const f = flags ?? 0;
  const lsfDisableMaster = 0x00100000;
  const lsfNoFreeze      = 0x00200000;
  const lsfGlobalFreeze  = 0x00400000;
  return {
    masterDisabled: (f & lsfDisableMaster) === lsfDisableMaster,
    noFreeze:       (f & lsfNoFreeze) === lsfNoFreeze,
    globalFreeze:   (f & lsfGlobalFreeze) === lsfGlobalFreeze,
  };
}

/**
 * TransferRate: billionths. 1_000_000_000 = 0% fee. Above means fee.
 * Returns percentage as a number, e.g. 0, 0.5, 2.0, etc.
 */
export function calcTransferFeePct(transferRate?: number): number {
  const ONE_BILLION = 1_000_000_000;
  const r = transferRate ?? ONE_BILLION;
  const fee = (r / ONE_BILLION) - 1;
  return Math.max(0, fee * 100);
}

/**
 * Count trustlines to this account (as issuer). This is a simple popularity/dispersion proxy.
 */
export async function countTrustlines(issuer: string): Promise<number> {
  return withClient(async (c) => {
    let marker: unknown | undefined;
    let total = 0;
    do {
      const req: any = { command: "account_lines", account: issuer, ledger_index: "validated", limit: 400 };
      if (marker) req.marker = marker;
      const resp: any = await c.request(req);
      total += (resp.result?.lines?.length || 0);
      marker = resp.result?.marker;
    } while (marker);
    return total;
  });
}
