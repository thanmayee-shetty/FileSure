import { useState } from 'react';
import { Icon } from './Icon';
import { IdentifierCell } from './IdentifierCell';
import { IssueList } from './IssueList';
import { ResultDetails } from './ResultDetails';
import { StatusBadge } from './StatusBadge';
import { NOT_ENCODED } from '../lib/display';
import type { ResultRow } from '../lib/types';

function Summary({ row }: { row: ResultRow }) {
  const { result } = row;
  if (result.validationStatus === 'invalid_format') return <IssueList issues={result.issues} compact />;
  if (result.kind === 'LLPIN') {
    return <p className="text-sm text-slate-500">{NOT_ENCODED}: listing, state, year and company type.</p>;
  }
  if (result.kind !== 'CIN') return null;
  const d = result.decoded;
  const items: [string, string][] = [
    ['Listed / unlisted', d.listedOrUnlisted ?? '—'],
    ['Year', d.yearOfIncorporation ? String(d.yearOfIncorporation) : '—'],
    ['State', d.state ?? (d.stateCode ? `${d.stateCode} not recognized` : '—')],
    ['Company type', d.companyType ? (d.companyTypeNote ? `${d.companyType} (${d.companyTypeNote.toLowerCase()})` : d.companyType) : '—'],
  ];
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {items.map(([label, value]) => (
          <div key={label} className={label === 'Company type' ? 'col-span-2' : undefined}>
            <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
            <dd className="text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <IssueList issues={result.issues} compact />
    </div>
  );
}

/** Mobile result: everything important visible, full breakdown on demand. */
export function ResultCard({ row }: { row: ResultRow }) {
  const [open, setOpen] = useState(false);
  const { result, lineNumber } = row;
  const detailsId = `card-details-${lineNumber}`;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs" data-testid="result-card">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="tabular shrink-0 pt-0.5 text-xs whitespace-nowrap text-slate-400">Line {lineNumber}</span>
        <StatusBadge result={result} />
      </div>
      <IdentifierCell result={result} large />
      <div className="mt-3">
        <Summary row={row} />
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="mt-3 -mb-1 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-brand-700"
      >
        {open ? 'Hide breakdown' : 'Show full breakdown'}
        <Icon name="chevronDown" className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={detailsId} className="mt-3 border-t border-slate-100 pt-4">
          <ResultDetails result={result} showIssues={false} />
        </div>
      )}
    </li>
  );
}

export function ResultCards({ rows }: { rows: ResultRow[] }) {
  return (
    <ul className="space-y-3" data-testid="results-cards" aria-label="Results in input order">
      {rows.map((row) => (
        <ResultCard key={row.lineNumber} row={row} />
      ))}
    </ul>
  );
}
