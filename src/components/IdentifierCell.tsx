import { kindLabel } from '../lib/display';
import type { IdentifierResult } from '../lib/types';

/** Identifier in monospace with its detected type and, if it changed, the original input. */
export function IdentifierCell({ result, large = false }: { result: IdentifierResult; large?: boolean }) {
  const showOriginal = result.originalInput.trim() !== result.normalizedInput;
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={`font-mono font-medium tracking-wide text-ink ${large ? 'break-all text-base' : result.kind === 'UNKNOWN' ? 'break-all text-sm' : 'whitespace-nowrap text-sm'}`}
          data-testid="identifier"
        >
          {result.normalizedInput || '—'}
        </span>
        {result.kind !== 'UNKNOWN' && (
          <span className="shrink-0 rounded border border-slate-200 px-1.5 text-[10px] font-semibold tracking-wider text-slate-500">
            {kindLabel(result)}
          </span>
        )}
      </div>
      {showOriginal && (
        <div className="mt-0.5 text-xs text-slate-500">
          entered as <span className="font-mono break-all whitespace-pre-wrap text-slate-600">{result.originalInput.trim()}</span>
        </div>
      )}
    </div>
  );
}
