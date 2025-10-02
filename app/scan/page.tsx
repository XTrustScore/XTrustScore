// app/scan/page.tsx
export const dynamic = "force-dynamic"; // disable SSG for this page

import { Suspense } from "react";
import ScanClient from "./ScanClient";

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Scan Result
      </h1>
      <Suspense fallback={<div className="opacity-70">Loading…</div>}>
        <ScanClient />
      </Suspense>
    </div>
  );
}
