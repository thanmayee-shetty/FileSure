import { Icon, type IconName } from './Icon';
import { presentStatus, type Tone } from '../lib/display';
import type { IdentifierResult } from '../lib/types';

const toneStyles: Record<Tone, { className: string; icon: IconName }> = {
  valid: { className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', icon: 'check' },
  review: { className: 'bg-amber-50 text-amber-900 ring-amber-600/25', icon: 'alert' },
  invalid: { className: 'bg-rose-50 text-rose-800 ring-rose-600/20', icon: 'xCircle' },
  unknown: { className: 'bg-slate-100 text-slate-700 ring-slate-500/20', icon: 'help' },
};

export function StatusBadge({ result }: { result: IdentifierResult }) {
  const { badge, tone } = presentStatus(result);
  const style = toneStyles[tone];
  return (
    <span
      data-testid="status-badge"
      data-tone={tone}
      className={`inline-flex max-w-full items-start gap-1.5 rounded-md px-2 py-0.5 text-xs leading-5 font-medium ring-1 ring-inset ${style.className}`}
    >
      <Icon name={style.icon} className="mt-[3px] size-3.5 shrink-0" />
      <span>{badge}</span>
    </span>
  );
}
