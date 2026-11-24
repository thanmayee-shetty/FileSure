import { Icon } from './Icon';
import type { ValidationIssue } from '../lib/types';

/**
 * Exact validation messages. Errors and advisories are listed as written in
 * the spec; unknown-format hints follow as explanatory bullet points.
 */
export function IssueList({ issues, compact = false }: { issues: ValidationIssue[]; compact?: boolean }) {
  if (issues.length === 0) return null;
  const primary = issues.filter((i) => i.severity !== 'hint');
  const hints = issues.filter((i) => i.severity === 'hint');

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <ul className="space-y-1.5" aria-label="Validation messages">
        {primary.map((issue) => (
          <li key={issue.code + issue.message} className="flex gap-2 text-sm leading-snug">
            <Icon
              name={issue.severity === 'advisory' ? 'alert' : 'xCircle'}
              className={`mt-0.5 size-4 shrink-0 ${issue.severity === 'advisory' ? 'text-amber-600' : 'text-rose-600'}`}
            />
            <span>
              <span className={issue.severity === 'advisory' ? 'text-amber-950' : 'text-rose-950'}>
                {issue.message}
              </span>
              {issue.note && <span className="mt-0.5 block text-xs text-body">{issue.note}</span>}
            </span>
          </li>
        ))}
      </ul>
      {hints.length > 0 && (
        <ul className="ml-6 list-disc space-y-1 text-sm leading-snug text-body marker:text-surface-300">
          {hints.map((hint) => (
            <li key={hint.code}>{hint.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
