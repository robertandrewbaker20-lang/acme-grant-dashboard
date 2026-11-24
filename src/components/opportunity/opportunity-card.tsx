"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Calendar,
  DollarSign,
  Eye,
  GripVertical,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { MatchScoreBadge } from "@/components/ui/match-score-badge";
import { useScan } from "@/components/dashboard/scan-context";
import type { PipelineColumnId } from "@/lib/pipeline";
import {
  formatShortDate,
  getCardAccentClass,
  getDeadlineUrgency,
  resolveMatchScoreState,
  sourceBadge,
  STATUS_LABELS,
  type OpportunityCardData,
} from "@/lib/opportunity-ui";

export function OpportunityCard({
  data,
  rank,
  variant = "kanban",
  draggable = false,
  isDragging = false,
  isLoading = false,
  onDragStart,
  onDragEnd,
  onColumnChange,
  onPass,
  onWatch,
}: {
  data: OpportunityCardData;
  rank?: number;
  variant?: "kanban" | "grid";
  draggable?: boolean;
  isDragging?: boolean;
  isLoading?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onColumnChange?: (column: PipelineColumnId) => Promise<void> | void;
  onPass?: () => Promise<void> | void;
  onWatch?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const { isScanning } = useScan();
  const source = sourceBadge(data.source);
  const urgency = getDeadlineUrgency(data.response_deadline);
  const scoreState = resolveMatchScoreState(data.fit_score, isScanning);
  const accent = getCardAccentClass(data.fit_score, data.response_deadline);
  const isCompact = variant === "kanban";

  async function quickMove(column: PipelineColumnId) {
    if (!onColumnChange) return;
    await onColumnChange(column);
    router.refresh();
  }

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${accent} ${
        rank === 1 ? "ring-1 ring-teal-200" : ""
      } ${
        isDragging ? "scale-[0.98] opacity-40" : ""
      } ${isLoading ? "animate-pulse" : "animate-card-drop"} ${
        isCompact ? "p-3" : "p-4"
      }`}
    >
      {rank !== undefined && rank <= 3 && (
        <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm">
          {rank}
        </span>
      )}
      <div className="flex items-start gap-1.5">
        {draggable && (
          <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-slate-300 active:cursor-grabbing group-hover:text-slate-400" />
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${source.className}`}
              >
                {source.label}
              </span>
              {data.status === "archived" && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Passed
                </span>
              )}
              {data.status === "applied" && (
                <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  Applying
                </span>
              )}
              {data.tags.slice(0, isCompact ? 1 : 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>

            <MatchScoreBadge
              score={data.fit_score}
              recommendation={data.recommendation}
              state={scoreState}
              size="md"
            />
          </div>

          <Link
            href={`/opportunities/${data.id}`}
            className={`block font-semibold leading-snug text-slate-900 transition-colors hover:text-[var(--accent)] ${
              isCompact ? "line-clamp-2 text-[13px]" : "line-clamp-2 text-[15px]"
            }`}
          >
            {data.title}
          </Link>

          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {data.agency ?? "Agency not specified"}
          </p>

          {data.fitFactors.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {data.fitFactors.slice(0, 2).map((factor) => (
                <li
                  key={factor}
                  className="line-clamp-1 text-[11px] text-slate-600 before:mr-1 before:text-teal-600 before:content-['•']"
                >
                  {factor}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${urgency.bgClass} ${urgency.textClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${urgency.dotClass}`} />
              <Calendar className="h-3 w-3 opacity-60" />
              {formatShortDate(data.response_deadline)}
              <span className="font-medium opacity-90">{urgency.label}</span>
            </span>

            {data.fundingLabel && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-100">
                <DollarSign className="h-3 w-3 text-emerald-300" />
                {data.fundingLabel}
              </span>
            )}
          </div>

          {!isCompact && data.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
              {data.description}
            </p>
          )}

          <div
            className={`mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2.5 ${
              isCompact ? "" : "sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
            }`}
          >
            <button
              type="button"
              onClick={() => quickMove("high_potential")}
              disabled={!onColumnChange || isLoading}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              High potential
            </button>
            <button
              type="button"
              onClick={() => quickMove("decision")}
              disabled={!onColumnChange || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 disabled:opacity-50"
            >
              <ThumbsUp className="h-3 w-3" />
              Apply
            </button>
            {onWatch && (
              <button
                type="button"
                onClick={() => onWatch()}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-amber-200 hover:bg-amber-50 disabled:opacity-50"
              >
                <Eye className="h-3 w-3" />
                Watch
              </button>
            )}
            <button
              type="button"
              onClick={() => (onPass ? onPass() : quickMove("decision"))}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50/50 px-2 py-1.5 text-[11px] font-semibold text-red-700 transition-colors hover:border-red-200 hover:bg-red-100 disabled:opacity-50"
            >
              <ThumbsDown className="h-3 w-3" />
              Pass
            </button>
            <Link
              href={`/opportunities/${data.id}`}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
            >
              Details
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {isCompact && (
            <p className="mt-2 text-[10px] text-slate-400">
              {STATUS_LABELS[data.status]}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}