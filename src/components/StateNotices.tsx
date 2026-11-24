import { CinSegments } from './CinSegments';
import { Icon } from './Icon';
import { MAX_IDENTIFIERS } from '../lib/bulk';
import { CIN_EXAMPLE, LLPIN_EXAMPLE } from '../lib/normalize';

/** First-visit state: teaches what a CIN encodes before anything is pasted. */
export function Onboarding() {
  return (
    <section
      aria-labelledby="how-to-read"
      className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 sm:p-6"
      data-testid="onboarding"
    >
      <h2 id="how-to-read" className="text-sm font-semibold text-ink">
        What a CIN tells you
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        A 21-character CIN encodes six facts about how a company was registered. Each result breaks it down like this.
      </p>
      <div className="mt-4">
        <CinSegments
          value={CIN_EXAMPLE}
          size="lg"
          captions={{
            listing: 'Listed',
            industry: 'Industry code',
            state: 'Maharashtra',
            year: 'Incorporated 1973',
            companyType: 'Public limited company',
            roc: 'ROC number',
          }}
        />
      </div>
      <div className="mt-5 flex gap-3 border-t border-slate-200 pt-4">
        <span className="h-fit rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-sm font-medium tracking-wider">
          {LLPIN_EXAMPLE}
        </span>
        <p className="text-sm text-slate-600">
          An <span className="font-medium text-ink">LLPIN</span> identifies a limited liability partnership. It
          does not encode listing, state, year or type, so only its format can be checked.
        </p>
      </div>
    </section>
  );
}

/** Shown when "Check" is pressed with nothing but blank lines. Neutral, not an error. */
export function EmptySubmission() {
  return (
    <div role="status" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="empty-state">
      <div className="flex gap-3">
        <Icon name="info" className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <h2 className="text-sm font-semibold text-ink">Paste identifiers to check</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter one CIN or LLPIN per line, for example{' '}
            <span className="font-mono text-ink">{CIN_EXAMPLE}</span> or{' '}
            <span className="font-mono text-ink">{LLPIN_EXAMPLE}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function OverLimit({ count, message, detail }: { count: number; message: string; detail: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6" data-testid="over-limit">
      <div className="flex gap-3">
        <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-rose-600" />
        <div>
          <h2 className="text-sm font-semibold text-rose-900">{message}</h2>
          <p className="mt-1 text-sm text-rose-900">{detail}</p>
          <p className="mt-2 text-xs text-rose-800/80">
            You pasted <span className="tabular font-medium">{count}</span> identifiers. Nothing has been checked yet,
            and your list is unchanged. Blank lines don’t count toward the {MAX_IDENTIFIERS} limit.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StaleNotice({ onRecheck }: { onRecheck: () => void }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm text-brand-900 sm:flex-row sm:items-center sm:justify-between"
      data-testid="stale-notice"
    >
      <span>The list has changed since these results were produced.</span>
      <button type="button" onClick={onRecheck} className="font-semibold text-brand-700 underline underline-offset-2">
        Check again
      </button>
    </div>
  );
}
