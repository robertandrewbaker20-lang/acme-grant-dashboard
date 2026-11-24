import { SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { CriteriaEditor } from "@/components/criteria/criteria-editor";
import { loadSearchProfiles } from "@/lib/search-profiles";

export const dynamic = "force-dynamic";

export default async function CriteriaPage() {
  const { data, source } = await loadSearchProfiles();

  return (
    <AppShell>
      <main className="flex-1 overflow-auto">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-teal-700">
              <SlidersHorizontal className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-widest">
                Search criteria
              </p>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Profiles, websites & domains
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Three boxes: the sample profile, websites, and topic areas. Edits
              save on this machine when the filesystem is writable. A live scan
              uses them only after API keys are set.
            </p>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <CriteriaEditor initialData={data} initialSource={source} />
        </div>
      </main>
    </AppShell>
  );
}
