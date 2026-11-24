export function Wordmark({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <span className={light ? "text-white" : "text-slate-900"}>
      <span className="text-base font-semibold tracking-tight">Acme</span>
      {!compact && (
        <span className={`ml-1.5 text-sm font-medium ${light ? "text-slate-300" : "text-slate-500"}`}>
          Community Fund
        </span>
      )}
    </span>
  );
}
