import { Fragment, useState } from 'react';
import { Icon } from './Icon';
import { IdentifierCell } from './IdentifierCell';
import { IssueList } from './IssueList';
import { ResultDetails } from './ResultDetails';
import { StatusBadge } from './StatusBadge';
import { NOT_ENCODED } from '../lib/display';
import type { CinResult, ResultRow } from '../lib/types';

function Dash() {
  return <span className="text-slate-400">—</span>;
}

function CinCells({ result }: { result: CinResult }) {
  const d = result.decoded;
  return (
    <>
      <td className="px-3 py-3 align-top text-sm">{d.listedOrUnlisted ?? <Dash />}</td>
      <td className="px-3 py-3 align-top text-sm">
        {d.state ?? (
          d.stateCode ? (
            <span className="text-amber-800">
              <span className="font-mono">{d.stateCode}</span> not recognized
            </span>
          ) : (
            <Dash />
          )
        )}
      </td>
      <td className="tabular px-3 py-3 align-top text-sm">{d.yearOfIncorporation ?? <Dash />}</td>
      <td className="px-3 py-3 align-top text-sm">
        {d.companyType ?? <Dash />}
        {d.companyTypeNote && <span className="block text-xs text-body">Observed code, pending confirmation</span>}
      </td>
    </>
  );
}

function Row({ row }: { row: ResultRow }) {
  const [open, setOpen] = useState(false);
  const { result, lineNumber } = row;
  const detailsId = `details-${lineNumber}`;
  const invalid = result.validationStatus === 'invalid_format';

  return (
    <Fragment>
      <tr className={`border-t border-surface-100 ${open ? 'bg-surface-50' : 'hover:bg-surface-50/60'}`} data-testid="result-row">
        <td className="tabular px-3 py-3 align-top text-xs text-slate-400">{lineNumber}</td>
        <td className="px-3 py-3 align-top">
          <IdentifierCell result={result} />
        </td>
        <td className="px-3 py-3 align-top">
          <StatusBadge result={result} />
        </td>
        {invalid ? (
          <td colSpan={4} className="px-3 py-3 align-top">
            <IssueList issues={result.issues} compact />
          </td>
        ) : result.kind === 'CIN' ? (
          <CinCells result={result} />
        ) : (
          <td colSpan={4} className="px-3 py-3 align-top text-sm text-body">
            {NOT_ENCODED}: listing, state, year and company type
          </td>
        )}
        <td className="px-3 py-2.5 text-right align-top">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailsId}
            aria-label={`${open ? 'Hide' : 'Show'} details for line ${lineNumber}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink hover:bg-brand-50"
          >
            Details
            <Icon name="chevronDown" className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>
      {open && (
        <tr id={detailsId} className="bg-surface-50">
          <td />
          <td colSpan={7} className="px-3 pt-1 pb-5">
            <ResultDetails result={result} showIssues={!invalid} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function ResultsTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="max-h-[70vh] overflow-auto" data-testid="results-table">
      <table className="w-full min-w-[56rem] border-collapse text-left">
        <caption className="sr-only">Results in input order</caption>
        <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
          <tr className="text-xs font-medium text-body shadow-[inset_0_-1px_0_var(--color-surface-200)]">
            <th scope="col" className="w-12 px-3 py-2.5 font-medium">
              Line
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Identifier
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Result
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Listing
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              State
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Year
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Company type
            </th>
            <th scope="col" className="px-3 py-2.5">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={row.lineNumber} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
