"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Globe2,
  Layers,
  Loader2,
  Plus,
  Save,
  Search,
  Star,
} from "lucide-react";
import {
  ALL_DOMAIN_ID,
  ALL_WEBSITE_ID,
  SEARCH_DOMAINS,
  SEARCH_WEBSITES,
} from "@/lib/search-catalog";
import {
  keywordsToText,
  parseKeywordList,
  slugifyId,
  type SearchProfile,
  type SearchProfilesFile,
} from "@/lib/search-profiles-types";

type LoadSource = "github" | "local" | "default";

const PROFILE_META: Record<
  string,
  { icon: typeof Globe2; blurb: string }
> = {
  default: {
    icon: Star,
    blurb: "Full profile, keywords, and match rules",
  },
  website: {
    icon: Globe2,
    blurb: "Choose which grant websites to search",
  },
  domain: {
    icon: Layers,
    blurb: "Choose topic domains to focus on",
  },
};

export function CriteriaEditor({
  initialData,
  initialSource,
}: {
  initialData: SearchProfilesFile;
  initialSource: LoadSource;
}) {
  const [data, setData] = useState<SearchProfilesFile>(initialData);
  const [selectedId, setSelectedId] = useState(initialData.activeProfileId);
  const [source, setSource] = useState<LoadSource>(initialSource);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add-new form state for website / domain
  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainKeywords, setNewDomainKeywords] = useState("");

  const selected = useMemo(
    () => data.profiles.find((p) => p.id === selectedId) ?? data.profiles[0],
    [data.profiles, selectedId],
  );

  function updateSelected(patch: Partial<SearchProfile>) {
    if (!selected) return;
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === selected.id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p,
      ),
    }));
    setDirty(true);
    setStatus(null);
    setError(null);
  }

  function toggleWebsite(id: string) {
    if (!selected) return;
    const current = selected.selectedWebsites ?? [];

    if (id === ALL_WEBSITE_ID) {
      updateSelected({ selectedWebsites: [ALL_WEBSITE_ID] });
      return;
    }

    const withoutAll = current.filter((x) => x !== ALL_WEBSITE_ID);
    const next = withoutAll.includes(id)
      ? withoutAll.filter((x) => x !== id)
      : [...withoutAll, id];

    updateSelected({
      selectedWebsites: next.length === 0 ? [ALL_WEBSITE_ID] : next,
    });
  }

  function toggleDomain(id: string) {
    if (!selected) return;
    const current = selected.selectedDomains ?? [];

    if (id === ALL_DOMAIN_ID) {
      updateSelected({ selectedDomains: [ALL_DOMAIN_ID] });
      return;
    }

    const withoutAll = current.filter((x) => x !== ALL_DOMAIN_ID);
    const next = withoutAll.includes(id)
      ? withoutAll.filter((x) => x !== id)
      : [...withoutAll, id];

    updateSelected({
      selectedDomains: next.length === 0 ? [ALL_DOMAIN_ID] : next,
    });
  }

  function addCustomWebsite() {
    if (!selected) return;
    const name = newWebsiteName.trim();
    if (!name) {
      setError("Enter a website name to add.");
      return;
    }
    const id = `custom:${slugifyId(name)}`;
    if (
      selected.customWebsites.some((c) => c.id === id) ||
      SEARCH_WEBSITES.some((w) => w.id === id)
    ) {
      setError("That website is already in the list.");
      return;
    }
    const customWebsites = [
      ...selected.customWebsites,
      { id, name, url: newWebsiteUrl.trim() },
    ];
    const selectedWebsites = (
      selected.selectedWebsites.includes(ALL_WEBSITE_ID)
        ? [id]
        : [...selected.selectedWebsites, id]
    ).filter((x) => x !== ALL_WEBSITE_ID);

    updateSelected({ customWebsites, selectedWebsites });
    setNewWebsiteName("");
    setNewWebsiteUrl("");
  }

  function addCustomDomain() {
    if (!selected) return;
    const name = newDomainName.trim();
    if (!name) {
      setError("Enter a domain name to add.");
      return;
    }
    const id = `custom:${slugifyId(name)}`;
    if (
      selected.customDomains.some((c) => c.id === id) ||
      SEARCH_DOMAINS.some((d) => d.id === id)
    ) {
      setError("That domain is already in the list.");
      return;
    }
    const keywords = parseKeywordList(newDomainKeywords);
    const customDomains = [
      ...selected.customDomains,
      {
        id,
        name,
        keywords: keywords.length ? keywords : [name],
        agencyQueries: [name],
      },
    ];
    const selectedDomains = (
      selected.selectedDomains.includes(ALL_DOMAIN_ID)
        ? [id]
        : [...selected.selectedDomains, id]
    ).filter((x) => x !== ALL_DOMAIN_ID);

    updateSelected({ customDomains, selectedDomains });
    setNewDomainName("");
    setNewDomainKeywords("");
  }

  async function save(activateId?: string) {
    setSaving(true);
    setError(null);
    setStatus(null);

    const payload: SearchProfilesFile = {
      ...data,
      activeProfileId: activateId ?? data.activeProfileId,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/search-profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: payload,
          commitMessage: activateId
            ? `Update search profiles · activate “${payload.profiles.find((p) => p.id === activateId)?.name ?? activateId}”`
            : `Update search profiles via dashboard`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Save failed");
        if (json.data) setData(json.data);
        return;
      }
      setData(json.data);
      setSource(json.source);
      setDirty(false);
      setStatus(json.message ?? "Saved");
      if (activateId) setSelectedId(activateId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function setActive() {
    if (!selected) return;
    if (dirty) {
      await save(selected.id);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/search-profiles/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not set active profile");
        return;
      }
      setData(json.data);
      setStatus(json.message ?? "Active profile updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAndScan() {
    if (!selected) return;
    setScanning(true);
    setError(null);
    setStatus(null);

    try {
      const payload: SearchProfilesFile = {
        ...data,
        activeProfileId: selected.id,
        updatedAt: new Date().toISOString(),
      };
      const saveRes = await fetch("/api/search-profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: payload,
          commitMessage: `Activate “${selected.name}” and prepare scan`,
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        setError(saveJson.error ?? "Save failed before scan");
        return;
      }
      setData(saveJson.data);
      setDirty(false);
      setSource(saveJson.source);

      const scanRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selected.id }),
      });
      const scanJson = await scanRes.json();
      if (!scanRes.ok) {
        setError("Scan failed");
        return;
      }

      setStatus(
        `Scan complete with “${scanJson.profileName ?? selected.name}”: fetched ${scanJson.fetched}, inserted ${scanJson.inserted}, evaluated ${scanJson.evaluated}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  if (!selected) {
    return <p className="text-sm text-slate-500">No profiles configured.</p>;
  }

  const isActive = data.activeProfileId === selected.id;
  const websiteAll = selected.selectedWebsites.includes(ALL_WEBSITE_ID);
  const domainAll = selected.selectedDomains.includes(ALL_DOMAIN_ID);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Exactly three boxes */}
      <aside className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Profiles
        </p>

        <ul className="space-y-2">
          {data.profiles.map((p) => {
            const active = p.id === selectedId;
            const isCurrent = p.id === data.activeProfileId;
            const meta = PROFILE_META[p.id] ?? PROFILE_META.default;
            const Icon = meta.icon;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-left transition ${
                    active
                      ? "border-teal-300 bg-teal-50 shadow-sm ring-1 ring-teal-200"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-lg p-1.5 ${
                          active
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {p.name}
                      </span>
                    </div>
                    {isCurrent && (
                      <span title="Active for scans">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                    {meta.blurb}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-[11px] leading-relaxed text-slate-400">
          Storage:{" "}
          <span className="font-medium text-slate-600">{source}</span>
          {dirty && (
            <span className="mt-1 block font-medium text-amber-700">
              Unsaved changes
            </span>
          )}
        </p>
      </aside>

      {/* Editor */}
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {selected.name}
            </h2>
            {isActive && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                Active for scans
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {selected.kind === "website"
              ? "Pick which organization websites to search. Choose All, select specific sites, or add a new one."
              : selected.kind === "domain"
                ? "Pick topic domains to focus matching and keywords. Choose All, select domains, or add a new one."
                : "Edit the full Acme profile, keywords, and match rules used for scoring."}{" "}
            Saves to{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">
              data/search-profiles.json
            </code>
            .
          </p>
        </div>

        {(status || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-teal-200 bg-teal-50 text-teal-900"
            }`}
          >
            {error ?? status}
          </div>
        )}

        {/* ── Website profile ── */}
        {selected.kind === "website" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Websites we search
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Multi-select. “All” searches every connected and tracked site.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Dropdown
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    toggleWebsite(v);
                    e.target.value = "";
                  }}
                >
                  <option value="">Select a website to toggle…</option>
                  <option value={ALL_WEBSITE_ID}>All websites</option>
                  {SEARCH_WEBSITES.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                      {selected.selectedWebsites.includes(w.id) ? " ✓" : ""}
                    </option>
                  ))}
                  {selected.customWebsites.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (custom)
                      {selected.selectedWebsites.includes(w.id) ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip
                  active={websiteAll}
                  onClick={() => toggleWebsite(ALL_WEBSITE_ID)}
                  label="All"
                />
                {SEARCH_WEBSITES.map((w) => (
                  <Chip
                    key={w.id}
                    active={!websiteAll && selected.selectedWebsites.includes(w.id)}
                    onClick={() => toggleWebsite(w.id)}
                    label={w.name}
                    title={w.url}
                  />
                ))}
                {selected.customWebsites.map((w) => (
                  <Chip
                    key={w.id}
                    active={!websiteAll && selected.selectedWebsites.includes(w.id)}
                    onClick={() => toggleWebsite(w.id)}
                    label={`${w.name} · custom`}
                    title={w.url}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Add a new website
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={newWebsiteName}
                    onChange={(e) => setNewWebsiteName(e.target.value)}
                    placeholder="Name (e.g. Challenge.gov)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                  <input
                    value={newWebsiteUrl}
                    onChange={(e) => setNewWebsiteUrl(e.target.value)}
                    placeholder="URL (optional)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                  <button
                    type="button"
                    onClick={addCustomWebsite}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            </section>

            <SharedAboutAndMatch
              selected={selected}
              updateSelected={updateSelected}
            />
          </div>
        )}

        {/* ── Domain profile ── */}
        {selected.kind === "domain" && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Domains we use
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Multi-select topic areas used for keywords and match scoring.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Dropdown
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    toggleDomain(v);
                    e.target.value = "";
                  }}
                >
                  <option value="">Select a domain to toggle…</option>
                  <option value={ALL_DOMAIN_ID}>All domains</option>
                  {SEARCH_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {selected.selectedDomains.includes(d.id) ? " ✓" : ""}
                    </option>
                  ))}
                  {selected.customDomains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (custom)
                      {selected.selectedDomains.includes(d.id) ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip
                  active={domainAll}
                  onClick={() => toggleDomain(ALL_DOMAIN_ID)}
                  label="All"
                />
                {SEARCH_DOMAINS.map((d) => (
                  <Chip
                    key={d.id}
                    active={!domainAll && selected.selectedDomains.includes(d.id)}
                    onClick={() => toggleDomain(d.id)}
                    label={d.name}
                    title={d.description}
                  />
                ))}
                {selected.customDomains.map((d) => (
                  <Chip
                    key={d.id}
                    active={!domainAll && selected.selectedDomains.includes(d.id)}
                    onClick={() => toggleDomain(d.id)}
                    label={`${d.name} · custom`}
                  />
                ))}
              </div>

              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {SEARCH_DOMAINS.map((d) => {
                  const on =
                    domainAll || selected.selectedDomains.includes(d.id);
                  return (
                    <li
                      key={d.id}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2 text-sm ${
                        on ? "bg-teal-50/60" : "bg-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on && !domainAll ? true : domainAll}
                        onChange={() => toggleDomain(d.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{d.name}</p>
                        <p className="text-xs text-slate-500">{d.description}</p>
                      </div>
                    </li>
                  );
                })}
                {selected.customDomains.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start gap-3 rounded-xl bg-violet-50/50 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={
                        domainAll || selected.selectedDomains.includes(d.id)
                      }
                      onChange={() => toggleDomain(d.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        {d.name}{" "}
                        <span className="text-[10px] font-semibold uppercase text-violet-700">
                          custom
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Keywords: {d.keywords.join(", ") || "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Add a new domain
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="Domain name (e.g. Quantum)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                  <input
                    value={newDomainKeywords}
                    onChange={(e) => setNewDomainKeywords(e.target.value)}
                    placeholder="Keywords (comma or space separated)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                  <button
                    type="button"
                    onClick={addCustomDomain}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            </section>

            <SharedAboutAndMatch
              selected={selected}
              updateSelected={updateSelected}
            />
          </div>
        )}

        {/* ── Default / Full profile ── */}
        {selected.kind === "default" && (
          <div className="grid gap-4">
            <Field
              label="About Acme"
              hint="Who we are. Used when scoring grants."
            >
              <textarea
                value={selected.aboutOrg}
                onChange={(e) => updateSelected({ aboutOrg: e.target.value })}
                rows={10}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Search keywords"
                hint="One per line. Used for Grants.gov keyword scans."
              >
                <textarea
                  value={keywordsToText(selected.searchKeywords)}
                  onChange={(e) =>
                    updateSelected({
                      searchKeywords: parseKeywordList(e.target.value),
                    })
                  }
                  rows={12}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-[13px] text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </Field>

              <Field
                label="Agency / SAM queries"
                hint="One per line. Used for SAM.gov agency and title searches."
              >
                <textarea
                  value={keywordsToText(selected.agencyQueries)}
                  onChange={(e) =>
                    updateSelected({
                      agencyQueries: parseKeywordList(e.target.value),
                    })
                  }
                  rows={12}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-[13px] text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </Field>
            </div>

            <SharedAboutAndMatch
              selected={selected}
              updateSelected={updateSelected}
              hideAbout
            />
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-[var(--background)]/95 py-4 backdrop-blur">
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => save()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save criteria
          </button>

          <button
            type="button"
            disabled={saving || isActive}
            onClick={() => void setActive()}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Set as active
          </button>

          <button
            type="button"
            disabled={saving || scanning}
            onClick={() => void saveAndScan()}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-600 disabled:opacity-50"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Save & run scan
          </button>
        </div>
      </div>
    </div>
  );
}

function SharedAboutAndMatch({
  selected,
  updateSelected,
  hideAbout,
}: {
  selected: SearchProfile;
  updateSelected: (patch: Partial<SearchProfile>) => void;
  hideAbout?: boolean;
}) {
  return (
    <>
      {!hideAbout && (
        <Field label="About Acme" hint="Optional profile text for this focus.">
          <textarea
            value={selected.aboutOrg}
            onChange={(e) => updateSelected({ aboutOrg: e.target.value })}
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
          />
        </Field>
      )}
      <Field label="What we are looking for">
        <textarea
          value={selected.lookingFor}
          onChange={(e) => updateSelected({ lookingFor: e.target.value })}
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        />
      </Field>
      <Field label="Match / scoring criteria">
        <textarea
          value={selected.matchCriteria}
          onChange={(e) => updateSelected({ matchCriteria: e.target.value })}
          rows={5}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        />
      </Field>
      <Field label="Poor fit (pass on these)">
        <textarea
          value={selected.poorFit}
          onChange={(e) => updateSelected({ poorFit: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        />
      </Field>
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-teal-700 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      {children}
    </label>
  );
}
