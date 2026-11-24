import { useCallback, useMemo, useState, useTransition } from 'react';
import { checkBulk, parseInput, type BulkOutcome } from '../lib/bulk';
import { DEFAULT_FILTERS, filterRows, type Filters } from '../lib/display';

/** All checker state: input text, the last submitted outcome, and result filters. */
export function useChecker() {
  const [text, setText] = useState('');
  const [outcome, setOutcome] = useState<BulkOutcome | null>(null);
  const [checkedText, setCheckedText] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isPending, startTransition] = useTransition();

  const parsed = useMemo(() => parseInput(text), [text]);

  const check = useCallback(() => {
    const submitted = text;
    startTransition(() => {
      setOutcome(checkBulk(submitted));
      setCheckedText(submitted);
      setFilters(DEFAULT_FILTERS);
    });
  }, [text]);

  const clear = useCallback(() => {
    setText('');
    setOutcome(null);
    setCheckedText(null);
    setFilters(DEFAULT_FILTERS);
  }, []);

  const visibleRows = useMemo(
    () => (outcome?.status === 'ok' ? filterRows(outcome.rows, filters) : []),
    [outcome, filters],
  );

  return {
    text,
    setText,
    identifierCount: parsed.lines.length,
    blankCount: parsed.blankCount,
    outcome,
    /** True when the textarea no longer matches what produced the results. */
    isStale: outcome !== null && checkedText !== text,
    isPending,
    check,
    clear,
    filters,
    setFilters,
    visibleRows,
  };
}
