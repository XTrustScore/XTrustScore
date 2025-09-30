export type Signal = { key: string; ok: boolean; weight: number; detail?: string };
export type Score = { level: "green" | "orange" | "red"; percent: number; signals: Signal[] };

export function computeScore(signals: Signal[]): Score {
  const total = signals.reduce((a, s) => a + s.weight, 0);
  const pos = signals.filter(s => s.ok).reduce((a, s) => a + s.weight, 0);
  const pct = total ? pos / total : 0;
  let level: Score["level"] = "orange";
  if (pct >= 0.75) level = "green";
  else if (pct < 0.4) level = "red";
  return { level, percent: Math.round(pct * 100), signals };
}
