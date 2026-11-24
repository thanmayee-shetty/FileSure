import { Icon } from './Icon';
import { REFERENCE_PREPARED_ON, REFERENCE_VERSION } from '../lib/reference';

export function SiteHeader() {
  return (
    <header className="border-b border-surface-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2" aria-label="FileSure home">
          <span className="grid size-7 place-items-center rounded-md bg-brand-700 text-sm font-bold text-white">F</span>
          <span className="text-[17px] font-semibold tracking-tight text-ink">FileSure</span>
        </a>
        <span className="text-xs font-medium text-body">CIN &amp; LLPIN checker</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-surface-200 bg-white" data-testid="disclosure">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex gap-3">
          <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-slate-400" />
          <div className="max-w-3xl space-y-2 text-sm text-body">
            <p>
              <span className="font-semibold text-ink">Format check only.</span> This tool checks whether each
              identifier is correctly structured and decodes what the identifier itself contains. It is not verified
              against MCA records, so it cannot confirm that a company or LLP exists, is active, or is currently
              listed.
            </p>
            <p className="text-xs text-body">
              Checks run entirely in your browser; nothing you paste is sent anywhere. State and company-type
              reference data v{REFERENCE_VERSION} ({REFERENCE_PREPARED_ON}).
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
