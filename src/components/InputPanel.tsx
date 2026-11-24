import { useId, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { MAX_IDENTIFIERS } from '../lib/bulk';
import { CIN_EXAMPLE, LLPIN_EXAMPLE } from '../lib/normalize';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onCheck: () => void;
  onClear: () => void;
  onSample: () => void;
  identifierCount: number;
  blankCount: number;
  isPending: boolean;
}

export function InputPanel({
  value,
  onChange,
  onCheck,
  onClear,
  onSample,
  identifierCount,
  blankCount,
  isPending,
}: InputPanelProps) {
  const inputId = useId();
  const hintId = useId();
  const counterId = useId();
  const over = identifierCount - MAX_IDENTIFIERS;
  const isOver = over > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onCheck();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onCheck();
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white shadow-xs" aria-label="Check identifiers">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4 sm:px-5">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          CINs and LLPINs
        </label>
        <span id={hintId} className="text-xs text-slate-500">
          One per line · up to {MAX_IDENTIFIERS}
        </span>
      </div>

      <div className="px-4 pt-2 sm:px-5">
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={8}
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          aria-describedby={`${hintId} ${counterId}`}
          aria-invalid={isOver || undefined}
          data-testid="identifier-input"
          placeholder={`${CIN_EXAMPLE}\n${LLPIN_EXAMPLE}`}
          className={`block min-h-44 w-full resize-y rounded-lg border bg-slate-50/50 px-3 py-2.5 font-mono text-sm leading-6 tracking-wide text-ink placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:outline-none ${
            isOver
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
          }`}
        />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p id={counterId} aria-live="polite" className="text-sm" data-testid="input-counter">
          {identifierCount === 0 ? (
            <span className="text-slate-500">
              Nothing pasted yet.{' '}
              <button
                type="button"
                onClick={onSample}
                className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
                data-testid="sample-button"
              >
                Try an example
              </button>
            </span>
          ) : isOver ? (
            <span className="font-medium text-rose-700">
              <span className="tabular">{identifierCount}</span> of {MAX_IDENTIFIERS} — remove {over} to check
            </span>
          ) : (
            <span className="text-slate-600">
              <span className="tabular font-medium text-ink">{identifierCount}</span> of {MAX_IDENTIFIERS}{' '}
              {identifierCount === 1 ? 'identifier' : 'identifiers'}
              {blankCount > 0 && (
                <span className="text-slate-500">
                  {' '}
                  · {blankCount} blank {blankCount === 1 ? 'line' : 'lines'} ignored
                </span>
              )}
            </span>
          )}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={value === ''}
            className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            data-testid="clear-button"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 flex-[2] items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white shadow-xs hover:bg-brand-800 disabled:opacity-70 sm:flex-none"
            data-testid="check-button"
          >
            {isPending ? (
              <>
                <Icon name="refresh" className="size-4 animate-spin" />
                Checking…
              </>
            ) : (
              'Check identifiers'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
