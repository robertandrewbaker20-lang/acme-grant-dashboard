"use client";

import { Download, Printer } from "lucide-react";

export function ReportActions() {
  function handlePrint() {
    window.print();
  }

  function handleDownloadHtml() {
    // Print-friendly save: user can also use browser "Save as PDF"
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
      <button
        type="button"
        onClick={handleDownloadHtml}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <Download className="h-4 w-4" />
        Export PDF
      </button>
    </div>
  );
}
