import { useCallback } from 'react';
import { InputPanel } from './components/InputPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { SiteFooter, SiteHeader } from './components/SiteChrome';
import { EmptySubmission, Onboarding, OverLimit, StaleNotice } from './components/StateNotices';
import { useChecker } from './hooks/useChecker';
import { rowsToCsv } from './lib/csv';
import { SAMPLE_INPUT } from './lib/sample';
import type { ResultRow } from './lib/types';

function downloadCsv(rows: ResultRow[]) {
  const blob = new Blob(['﻿', rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filesure-cin-llpin-check-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const checker = useChecker();
  const { outcome, setText } = checker;

  const onSample = useCallback(() => setText(SAMPLE_INPUT), [setText]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Check CINs and LLPINs</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-body">
            Paste company or LLP identification numbers to see whether each one is correctly formatted and what it
            encodes: listing status, state, year of incorporation and company type.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <InputPanel
            value={checker.text}
            onChange={checker.setText}
            onCheck={checker.check}
            onClear={checker.clear}
            onSample={onSample}
            identifierCount={checker.identifierCount}
            blankCount={checker.blankCount}
            isPending={checker.isPending}
          />
        </div>

        <div className="mt-8 space-y-4" aria-busy={checker.isPending}>
          {outcome && checker.isStale && outcome.status !== 'empty' && <StaleNotice onRecheck={checker.check} />}

          {outcome === null && <Onboarding />}
          {outcome?.status === 'empty' && <EmptySubmission />}
          {outcome?.status === 'over_limit' && (
            <OverLimit count={outcome.count} message={outcome.message} detail={outcome.detail} />
          )}
          {outcome?.status === 'ok' && (
            <ResultsPanel
              summary={outcome.summary}
              rows={checker.visibleRows}
              filters={checker.filters}
              onFiltersChange={checker.setFilters}
              onDownload={() => downloadCsv(outcome.rows)}
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
