// app/scan/ScanClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ResultCard from "@/components/ResultCard";

export default function ScanClient() {
  const params = useSearchParams();
  const address = params.get("address") || "";
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setResult(null);
      return;
    }
    setLoading(true);
    fetch(`/api/check?address=${address}`)
      .then((r) => r.json())
      .then(setResult)
      .catch((e) => setResult({ status: "error", message: String(e) }))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <>
      {!address && <div className="opacity-70">Add <code>?address=...</code> to the URL.</div>}
      {loading && <div className="opacity-70">Loading…</div>}
      {result && <ResultCard result={result} />}
    </>
  );
}
