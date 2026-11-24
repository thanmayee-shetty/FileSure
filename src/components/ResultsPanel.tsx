import { ResultCards } from './ResultCard';
import { ResultsSummary } from './ResultsSummary';
import { ResultsTable } from './ResultsTable';
import { ResultsToolbar } from './ResultsToolbar';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DEFAULT_FILTERS, type Filters } from '../lib/display';
import type { Summary } from '../lib/bulk';
import type { ResultRow } from '../lib/types';

interface ResultsPanelProps {
  summary: Summary;
  rows: ResultRow[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onDownload: () => void;
}

export function ResultsPanel({ summary, rows, filters, onFiltersChange, onDownload }: ResultsPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <section aria-labelledby="results-heading" className="space-y-4" data-testid="results-panel">
      <div className="space-y-2">
        <h2 id="results-heading" className="text-base font-semibold text-ink">
          Results
        </h2>
        <ResultsSummary summary={summary} />
      </div>

      <ResultsToolbar summary={summary} filters={filters} onChange={onFiltersChange} onDownload={onDownload} />

      <p className="sr-only" aria-live="polite">
        Showing {rows.length} of {summary.total} results.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center" data-testid="no-matches">
          <p className="text-sm font-medium text-ink">No results match these filters.</p>
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="mt-2 text-sm font-medium text-brand-700 underline underline-offset-2"
          >
            Show all results
          </button>
        </div>
      ) : isDesktop ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <ResultsTable rows={rows} />
        </div>
      ) : (
        <ResultCards rows={rows} />
      )}

      {rows.length > 0 && rows.length < summary.total && (
        <p className="text-xs text-slate-500">
          Showing {rows.length} of {summary.total}. Results stay in the order you pasted them.
        </p>
      )}
    </section>
  );
}
