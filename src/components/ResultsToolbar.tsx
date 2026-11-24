import { Icon } from './Icon';
import { SegmentedControl } from './SegmentedControl';
import type { Summary } from '../lib/bulk';
import type { EntityFilter, Filters, ValidityFilter } from '../lib/display';

interface ResultsToolbarProps {
  summary: Summary;
  filters: Filters;
  onChange: (filters: Filters) => void;
  onDownload: () => void;
}

export function ResultsToolbar({ summary, filters, onChange, onDownload }: ResultsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <SegmentedControl<ValidityFilter>
          label="Filter by result"
          testId="filter-validity"
          value={filters.validity}
          onChange={(validity) => onChange({ ...filters, validity })}
          options={[
            { value: 'all', label: 'All', count: summary.total },
            { value: 'valid', label: 'Valid format', count: summary.validFormat },
            { value: 'invalid', label: 'Invalid format', count: summary.invalidFormat },
          ]}
        />
        <SegmentedControl<EntityFilter>
          label="Filter by identifier type"
          testId="filter-entity"
          value={filters.entity}
          onChange={(entity) => onChange({ ...filters, entity })}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'CIN', label: 'CIN', count: summary.cin },
            { value: 'LLPIN', label: 'LLPIN', count: summary.llp },
          ]}
        />
      </div>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
          <span className="sr-only">Search results by identifier or error</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search identifier or error"
            data-testid="results-search"
            className="h-9 w-full rounded-lg border border-surface-300 bg-white pr-3 pl-8 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 text-sm font-medium text-body hover:bg-surface-50"
          data-testid="download-csv"
        >
          <Icon name="download" className="size-4" />
          <span>CSV</span>
          <span className="sr-only">Download results as CSV</span>
        </button>
      </div>
    </div>
  );
}
