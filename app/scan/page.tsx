// app/scan/page.tsx
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ResultCard from "@/components/ResultCard";

export default function ScanPage() {
  const params = useSearchParams();
  const address = params.get("address") || "";
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/check?address=${address}`)
      .then((r) => r.json())
      .then(setResult)
      .catch((e) => setResult({ status: "error", message: String(e) }))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Scan Result
      </h1>

      {!address && <div className="opacity-70">Add <code>?address=...</code> to the URL.</div>}
      {loading && <div className="opacity-70">Loading…</div>}
      {result && <ResultCard result={result} />}
    </div>
  );
}
