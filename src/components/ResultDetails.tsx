import { CinSegments } from './CinSegments';
import { DecodedFields } from './DecodedFields';
import { Icon } from './Icon';
import { IssueList } from './IssueList';
import { CIN_LENGTH } from '../lib/normalize';
import { MCA_DISCLAIMER, presentStatus } from '../lib/display';
import { UNKNOWN_DETAIL } from '../lib/validate';
import type { IdentifierResult } from '../lib/types';

/** Full breakdown for one identifier, shared by the desktop table and mobile cards. */
export function ResultDetails({ result, showIssues = true }: { result: IdentifierResult; showIssues?: boolean }) {
  const { detail } = presentStatus(result);
  const showSegments = result.kind === 'CIN' && result.normalizedInput.length === CIN_LENGTH;
  const inputChanged = result.originalInput !== result.normalizedInput;

  return (
    <div className="space-y-4">
      {showSegments && <CinSegments value={result.normalizedInput} issues={result.issues} />}

      {showIssues && <IssueList issues={result.issues} />}

      {result.kind === 'UNKNOWN' && <p className="text-sm text-body">{UNKNOWN_DETAIL}</p>}

      <DecodedFields result={result} />

      {(inputChanged || result.notes.length > 0) && (
        <div className="space-y-1 text-xs text-body">
          {inputChanged && (
            <p>
              You entered <span className="font-mono break-all whitespace-pre-wrap text-body">“{result.originalInput}”</span>;
              checked as <span className="font-mono text-body">{result.normalizedInput}</span>.
            </p>
          )}
          {result.notes.map((n) => (
            <p key={n}>{n}.</p>
          ))}
        </div>
      )}

      {result.kind !== 'UNKNOWN' && (
        <p className="flex items-start gap-1.5 text-xs text-body">
          <Icon name="info" className="mt-px size-3.5 shrink-0" />
          <span>{detail ?? `Format check only. ${MCA_DISCLAIMER}.`}</span>
        </p>
      )}
    </div>
  );
}
