interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  testId?: string;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange, testId }: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      data-testid={testId}
      className="inline-flex max-w-full overflow-x-auto rounded-lg bg-surface-100 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap transition-colors ${
              active ? 'bg-white font-medium text-ink shadow-xs ring-1 ring-surface-200' : 'text-body hover:text-ink'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className="tabular text-xs text-body">{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
