import Link from "next/link";
import { FileBarChart2 } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ScanButton } from "./scan-button";

export function DashboardHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-8">
        <div className="min-w-0">
          <Wordmark />
          <h1 className="mt-1 text-base font-semibold tracking-tight text-slate-900 sm:text-lg lg:text-xl">
            Grant Opportunity Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Filter notices, compare fit scores, and move work through a pipeline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileBarChart2 className="h-4 w-4 text-teal-700" />
            Generate report
          </Link>
          <ScanButton />
        </div>
      </div>
    </header>
  );
}
