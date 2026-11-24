import Link from "next/link";
import { Clock } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";

export function PortalHeader() {
  return (
    <header className="bg-slate-950 text-white">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div>
            <Wordmark light />
            <p className="text-xs text-slate-300">Grant pipeline demo</p>
          </div>
        </Link>
        <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
          <Clock className="h-3.5 w-3.5" />
          Sample notice
        </span>
      </div>
    </header>
  );
}
