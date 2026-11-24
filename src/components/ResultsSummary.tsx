import type { Summary } from '../lib/bulk';

type StatTone = 'valid' | 'invalid';

function Stat({ value, label, tone }: { value: number; label: string; tone?: StatTone }) {
  const color = tone === 'valid' ? 'text-emerald-700' : tone === 'invalid' ? 'text-rose-700' : 'text-ink';
  return (
    <span className="whitespace-nowrap">
      <span className={`tabular text-lg font-semibold ${color}`}>{value}</span>{' '}
      <span className="text-sm text-slate-600">{label}</span>
    </span>
  );
}

/** Compact one-line summary of the whole batch, readable as a sentence. */
export function ResultsSummary({ summary }: { summary: Summary }) {
  const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
  return (
    <div className="space-y-1">
      <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1" data-testid="results-summary">
        <Stat value={summary.total} label={plural(summary.total, 'identifier')} />
        <Stat value={summary.validFormat} label="valid format" tone="valid" />
        <Stat value={summary.invalidFormat} label="invalid format" tone="invalid" />
        <span className="hidden h-4 w-px self-center bg-slate-200 sm:block" aria-hidden="true" />
        <Stat value={summary.cin} label="CIN" />
        <Stat value={summary.llp} label="LLP" />
        {summary.unknown > 0 && <Stat value={summary.unknown} label="unknown" />}
        {summary.blankIgnored > 0 && (
          <Stat value={summary.blankIgnored} label={`blank ${plural(summary.blankIgnored, 'line')} ignored`} />
        )}
      </p>
      {summary.needsReview > 0 && (
        <p className="text-xs text-amber-800">
          {summary.needsReview} valid-format {plural(summary.needsReview, 'CIN')}{' '}
          {summary.needsReview === 1 ? 'has' : 'have'} a component that is not in the local reference.
        </p>
      )}
    </div>
  );
}
