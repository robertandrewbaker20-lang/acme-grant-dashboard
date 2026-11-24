"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { sortByAlignment } from "@/lib/alignment";
import {
  PIPELINE_COLUMNS,
  statusToColumn,
  type PipelineColumnId,
} from "@/lib/pipeline";
import type { OpportunityCardData } from "@/lib/opportunity-ui";
import type { KanbanCard, OpportunityStatus } from "@/lib/types";

function toCardData(card: KanbanCard): OpportunityCardData {
  return {
    id: card.id,
    title: card.title,
    agency: card.agency,
    response_deadline: card.response_deadline,
    fit_score: card.fit_score,
    recommendation: card.recommendation,
    fitFactors: card.fitFactors,
    source: card.source,
    description: card.description,
    fundingLabel: card.fundingLabel,
    tags: card.tags,
    status: card.status,
    officialUrl: card.officialUrl,
  };
}

export function KanbanBoard({ initialCards }: { initialCards: KanbanCard[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<PipelineColumnId | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pendingMoves = useRef(new Set<string>());

  useEffect(() => {
    setCards((current) =>
      initialCards.map((serverCard) => {
        if (pendingMoves.current.has(serverCard.id)) {
          const local = current.find((c) => c.id === serverCard.id);
          return local ?? serverCard;
        }
        return serverCard;
      }),
    );
  }, [initialCards]);

  async function moveCard(
    cardId: string,
    column: PipelineColumnId,
    statusOverride?: OpportunityStatus,
  ) {
    const previousCards = cards;
    pendingMoves.current.add(cardId);
    setLoadingId(cardId);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, column } : c)),
    );

    try {
      const res = await fetch(`/api/opportunities/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          statusOverride ? { status: statusOverride } : { column },
        ),
      });
      const data = (await res.json()) as {
        success?: boolean;
        opportunity?: { status: OpportunityStatus };
        error?: string;
      };

      if (!res.ok || !data.opportunity) {
        setCards(previousCards);
        setNotice(data.error ?? "Could not update that card.");
        return;
      }
      setNotice(null);

      const confirmedColumn = statusToColumn(data.opportunity.status);
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, column: confirmedColumn, status: data.opportunity!.status }
            : c,
        ),
      );
      router.refresh();
    } catch {
      setCards(previousCards);
    } finally {
      pendingMoves.current.delete(cardId);
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Decision pipeline
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            New → Under Review → High Potential → Decision Made · ranked by profile
            alignment (best match at top). Sample cards reset when you reload.
          </p>
        </div>
        <p className="hidden text-xs text-slate-400 sm:block">
          Drag cards or use quick actions on each card
        </p>
      </div>
      {notice && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PIPELINE_COLUMNS.map((column) => {
          const columnCards = sortByAlignment(
            cards.filter((c) => c.column === column.id),
          );
          const isDropTarget = dropTarget === column.id;

          return (
            <div
              key={column.id}
              className={`flex flex-col rounded-2xl border border-[var(--border)] border-t-[3px] ${column.borderAccent} ${column.headerBg} p-3 transition-all duration-200 ${
                isDropTarget ? "animate-lane-drop-target ring-2 ring-teal-300/50" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(column.id);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData("text/plain");
                if (cardId) moveCard(cardId, column.id);
                setDraggingId(null);
                setDropTarget(null);
              }}
            >
              <div className="mb-3 flex items-start gap-2 px-0.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${column.dotColor}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {column.label}
                    </span>
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600 shadow-sm">
                      {columnCards.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{column.subtitle}</p>
                </div>
              </div>

              <div className="min-h-[160px] flex-1 space-y-2.5">
                {columnCards.length === 0 ? (
                  <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/60 bg-white/40 px-4 py-6 text-center">
                    <p className="text-xs font-medium text-slate-600">
                      {column.emptyTitle}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                      {column.emptyBody}
                    </p>
                  </div>
                ) : (
                  columnCards.map((card, index) => (
                    <OpportunityCard
                      key={card.id}
                      rank={column.id === "new" ? index + 1 : undefined}
                      data={toCardData(card)}
                      variant="kanban"
                      draggable
                      isDragging={draggingId === card.id}
                      isLoading={loadingId === card.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", card.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(card.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                      onColumnChange={(col) => moveCard(card.id, col)}
                      onPass={() => moveCard(card.id, "decision", "archived")}
                      onWatch={() => moveCard(card.id, "review")}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}