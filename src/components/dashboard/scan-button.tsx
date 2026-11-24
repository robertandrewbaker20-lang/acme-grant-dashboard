"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useScan } from "./scan-context";

function formatLastScan(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ScanButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const { isScanning, lastScanAt, startScan, finishScan } = useScan();

  async function handleScan() {
    setLoading(true);
    setResult(null);
    setToast(null);
    startScan();
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const sources = data.bySource
          ? Object.entries(data.bySource as Record<string, number>)
              .filter(([, n]) => (n as number) > 0)
              .map(([s, n]) => `${s}: ${n}`)
              .join(", ")
          : "";
        const skipped =
          data.skippedDismissed > 0
            ? `, skipped ${data.skippedDismissed} archived/pass`
            : "";
        const profileBit = data.profileName
          ? ` · profile “${data.profileName}”`
          : "";
        const summary = `Fetched ${data.fetched}, inserted ${data.inserted}, evaluated ${data.evaluated}${skipped}${profileBit}${sources ? ` · ${sources}` : ""}`;
        setResult(summary);
        finishScan(summary);
        setToast("Scan complete — dashboard refreshed");
        setTimeout(() => setToast(null), 5000);
        router.refresh();
      } else {
        const err = data.error ?? "Scan failed";
        setResult(err);
        finishScan(null);
      }
    } catch {
      setResult("Scan failed — check API keys and Supabase config");
      finishScan(null);
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || isScanning;

  return (
    <div className="flex flex-col items-end gap-1">
      {lastScanAt && (
        <p className="text-[11px] text-slate-500">
          Last scan: {formatLastScan(lastScanAt)}
        </p>
      )}
      <button
        onClick={handleScan}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Scanning…" : "Run Scan"}
      </button>
      {toast && (
        <p className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
          {toast}
        </p>
      )}
      {result && !toast && <p className="max-w-xs text-right text-xs text-slate-500">{result}</p>}
    </div>
  );
}
