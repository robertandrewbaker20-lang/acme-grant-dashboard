import { AppShell } from "@/components/dashboard/app-shell";
import { FoundationBoard } from "@/components/foundations/foundations-client";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Foundations — Acme Grant Dashboard",
  description:
    "Fictional foundation opportunities used as sample data in the Acme grant dashboard",
};

export default function FoundationsPage() {
  return (
    <AppShell activeNav="foundations">
      <main className="flex-1 overflow-auto">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-teal-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5">
                <HeartHandshake className="h-6 w-6 text-violet-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Family & Private Foundation Funding
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  A fictional list of family funds, with invitation rules and sample contacts.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <FoundationBoard />
        </div>
      </main>
    </AppShell>
  );
}
