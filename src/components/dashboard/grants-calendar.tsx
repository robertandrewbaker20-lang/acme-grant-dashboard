"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { OpportunityWithScore } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type CalendarEvent = {
  id: string;
  title: string;
  agency: string | null;
  source: string | null;
  deadline: string;
  fit_score: number | null;
  status: string;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDeadline(deadline: string) {
  const parsed = new Date(deadline);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function urgencyClasses(deadline: Date, today: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.ceil((deadline.getTime() - today.getTime()) / msPerDay);

  if (days < 0) return "bg-red-100 text-red-800 border-red-200";
  if (days <= 7) return "bg-amber-100 text-amber-800 border-amber-200";
  if (days <= 30) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function urgencyLabel(deadline: Date, today: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.ceil((deadline.getTime() - today.getTime()) / msPerDay);

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days}d left`;
}

function scoreLabel(score: number | null) {
  if (score === null) return null;
  return `${(score / 10).toFixed(1)}/10`;
}

export function GrantsCalendar({
  opportunities,
}: {
  opportunities: OpportunityWithScore[];
}) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);

  const events = useMemo(() => {
    const items: CalendarEvent[] = [];
    for (const opp of opportunities) {
      if (!opp.response_deadline) continue;
      const deadline = parseDeadline(opp.response_deadline);
      if (!deadline) continue;
      items.push({
        id: opp.id,
        title: opp.title,
        agency: opp.agency,
        source: opp.source ?? "sam.gov",
        deadline: opp.response_deadline,
        fit_score: opp.fit_score,
        status: opp.status,
      });
    }
    return items.sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );
  }, [opportunities]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = toDateKey(parseDeadline(event.deadline)!);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const first = startOfMonth(cursor);
    const startOffset = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [cursor]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDay.get(toDateKey(selectedDay)) ?? [];
  }, [eventsByDay, selectedDay]);

  const upcoming = useMemo(() => {
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);
    return events.filter((event) => {
      const deadline = parseDeadline(event.deadline);
      if (!deadline) return false;
      return deadline >= today && deadline <= horizon;
    });
  }, [events, today]);

  const noDeadlineCount = opportunities.length - events.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-wider text-slate-700">
            GRANTS MASTER CALENDAR
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Application deadlines across all tracked sources. Click a day to see
            grants due that date.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="h-4 w-4" />
          {events.length} with deadlines
          {noDeadlineCount > 0 && (
            <span className="text-slate-400">
              · {noDeadlineCount} without dates
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor((current) => addMonths(current, -1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setCursor((current) => addMonths(current, 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const inMonth = date.getMonth() === cursor.getMonth();
              const key = toDateKey(date);
              const dayEvents = eventsByDay.get(key) ?? [];
              const isToday = sameDay(date, today);
              const isSelected = selectedDay ? sameDay(date, selectedDay) : false;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(date)}
                  className={`min-h-[72px] rounded-lg border p-2 text-left transition-colors ${
                    inMonth
                      ? "border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                      : "border-transparent bg-slate-50/60 text-slate-300"
                  } ${isSelected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"
                          : inMonth
                            ? "text-slate-700"
                            : "text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <p
                          key={event.id}
                          className="line-clamp-1 text-[10px] font-medium text-slate-600"
                        >
                          {event.title}
                        </p>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-slate-400">
                          +{dayEvents.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold tracking-wider text-slate-500">
              {selectedDay
                ? selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a day"}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No application deadlines on this date.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {selectedEvents.map((event) => {
                  const deadline = parseDeadline(event.deadline)!;
                  return (
                    <li
                      key={event.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyClasses(deadline, today)}`}
                        >
                          {urgencyLabel(deadline, today)}
                        </span>
                        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {(event.source ?? "sam.gov").toUpperCase()}
                        </span>
                        {scoreLabel(event.fit_score) && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            {scoreLabel(event.fit_score)}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/opportunities/${event.id}`}
                        className="mt-2 block text-sm font-semibold text-slate-900 hover:text-blue-700"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {event.agency ?? "Unknown agency"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold tracking-wider text-slate-500">
              NEXT 30 DAYS
            </h3>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No upcoming deadlines in the next month.
              </p>
            ) : (
              <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {upcoming.map((event) => {
                  const deadline = parseDeadline(event.deadline)!;
                  return (
                    <li key={event.id}>
                      <Link
                        href={`/opportunities/${event.id}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium text-slate-900">
                            {event.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {deadline.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {" · "}
                            {event.agency ?? "Unknown agency"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyClasses(deadline, today)}`}
                        >
                          {urgencyLabel(deadline, today)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}