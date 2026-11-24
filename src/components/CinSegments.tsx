import { CIN_SEGMENTS } from '../lib/cin';
import type { IssueField, ValidationIssue } from '../lib/types';

const SEGMENT_LABELS: Record<IssueField, string> = {
  listing: 'Listing',
  industry: 'Industry',
  state: 'State',
  year: 'Year',
  companyType: 'Type',
  roc: 'Reg. no.',
};

interface CinSegmentsProps {
  value: string;
  issues?: ValidationIssue[];
  /** Optional caption under each segment, e.g. the decoded meaning. */
  captions?: Partial<Record<IssueField, string>>;
  size?: 'sm' | 'lg';
}

/**
 * The CIN split into its six segments. Segments with an error are marked in
 * red, advisories in amber. Only meaningful for 21-character values, where
 * segment boundaries are known.
 */
export function CinSegments({ value, issues = [], captions, size = 'sm' }: CinSegmentsProps) {
  const big = size === 'lg';
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="CIN segments">
      {CIN_SEGMENTS.map((seg) => {
        const part = value.slice(seg.start, seg.start + seg.length);
        const issue = issues.find((i) => i.field === seg.field);
        const tone = !issue
          ? 'border-slate-200 bg-white text-ink'
          : issue.severity === 'advisory'
            ? 'border-amber-300 bg-amber-50 text-amber-950'
            : 'border-rose-300 bg-rose-50 text-rose-900';
        return (
          <li key={seg.field} className="flex flex-col items-start" data-segment={seg.field} data-flagged={!!issue}>
            <span
              className={`rounded-md border font-mono font-medium tracking-wider ${tone} ${
                big ? 'px-2.5 py-1.5 text-base sm:text-lg' : 'px-2 py-1 text-sm'
              }`}
            >
              {part}
            </span>
            <span className={`mt-1 font-medium uppercase tracking-wide text-slate-500 ${big ? 'text-[11px]' : 'text-[10px]'}`}>
              {SEGMENT_LABELS[seg.field]}
            </span>
            {captions?.[seg.field] && (
              <span className="max-w-[9rem] text-xs leading-tight text-slate-600">{captions[seg.field]}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
