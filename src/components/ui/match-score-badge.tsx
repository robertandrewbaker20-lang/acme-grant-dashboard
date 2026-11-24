"use client";

import type { Recommendation } from "@/lib/types";
import {
  getMatchScoreStyle,
  type MatchScoreState,
  type MatchScoreStyle,
} from "@/lib/opportunity-ui";

const SIZE_CLASSES = {
  sm: {
    wrap: "h-8 w-8 text-[10px]",
    sub: "text-[7px]",
    wide: "h-8 min-w-[2.5rem] px-1.5 text-[9px]",
  },
  md: {
    wrap: "h-10 w-10 text-[11px]",
    sub: "text-[8px]",
    wide: "h-10 min-w-[3rem] px-2 text-[10px]",
  },
  lg: {
    wrap: "h-16 w-16 text-lg",
    sub: "text-[10px]",
    wide: "h-16 min-w-[4.5rem] px-3 text-sm",
  },
} as const;

export function MatchScoreBadge({
  score,
  recommendation,
  state = "not_scored",
  size = "md",
  className = "",
}: {
  score: number | null;
  recommendation?: Recommendation | null;
  state?: MatchScoreState;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const style: MatchScoreStyle = getMatchScoreStyle(score, recommendation, {
    state,
  });
  const sizes = SIZE_CLASSES[size];
  const isWide = style.state !== "scored";
  const boxClass = isWide ? sizes.wide : sizes.wrap;

  if (style.state === "scoring") {
    return (
      <div
        className={`flex shrink-0 flex-col items-center justify-center rounded-xl ring-2 ring-slate-200 bg-slate-100 ${boxClass} ${className}`}
        title={style.tooltip}
        aria-busy="true"
        aria-label="Scoring in progress"
      >
        <span className="h-3 w-3 animate-pulse rounded-full bg-slate-300" />
        <span className={`mt-0.5 font-medium text-slate-500 ${sizes.sub}`}>
          Scoring…
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl font-bold leading-none ring-2 ${style.ringClass} ${style.bgClass} ${style.textClass} ${boxClass} ${className}`}
      title={style.tooltip}
    >
      <span className={isWide ? "text-center leading-tight" : ""}>
        {style.scoreLabel}
      </span>
      <span className={`mt-0.5 font-medium opacity-80 ${sizes.sub}`}>
        {style.sublabel}
      </span>
    </div>
  );
}
