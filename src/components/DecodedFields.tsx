import type { ReactNode } from 'react';
import { NOT_ENCODED } from '../lib/display';
import type { CinResult, IdentifierResult, LlpinResult } from '../lib/types';

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-slate-500">{children}</span>;
}

function Code({ children }: { children: ReactNode }) {
  return <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-px font-mono text-xs text-slate-600">{children}</span>;
}

function Note({ children }: { children: ReactNode }) {
  return <span className="mt-0.5 block text-xs leading-snug text-slate-500">{children}</span>;
}

interface Field {
  label: string;
  value: ReactNode;
}

function cinFields(r: CinResult): Field[] {
  const d = r.decoded;
  const notDecoded = <Muted>Could not be decoded</Muted>;
  return [
    { label: 'Entity', value: 'Company' },
    { label: 'Listed / unlisted', value: d.listedOrUnlisted ?? notDecoded },
    {
      label: 'State',
      value: d.state ? (
        <>
          {d.state}
          <Code>{d.stateCode}</Code>
          {d.stateNote && <Note>{d.stateNote}</Note>}
        </>
      ) : d.stateCode ? (
        <>
          <Muted>Not in local reference</Muted>
          <Code>{d.stateCode}</Code>
        </>
      ) : (
        notDecoded
      ),
    },
    { label: 'Year of incorporation', value: d.yearOfIncorporation ?? notDecoded },
    {
      label: 'Company type',
      value: d.companyType ? (
        <>
          {d.companyType}
          <Code>{d.companyTypeCode}</Code>
          {d.companyTypeNote && <Note>{d.companyTypeNote}</Note>}
        </>
      ) : (
        notDecoded
      ),
    },
    {
      label: 'Industry code',
      value: d.industryCode ? (
        <>
          <span className="font-mono">{d.industryCode}</span>
          <Note>{d.industryDescription ?? 'Description not in local reference.'}</Note>
        </>
      ) : (
        notDecoded
      ),
    },
    {
      label: 'ROC registration no.',
      value: d.rocRegistrationNumber ? <span className="font-mono">{d.rocRegistrationNumber}</span> : notDecoded,
    },
  ];
}

function llpinFields(r: LlpinResult): Field[] {
  const notEncoded = <Muted>{NOT_ENCODED}</Muted>;
  return [
    { label: 'Entity', value: 'LLP' },
    { label: 'LLPIN', value: <span className="font-mono">{r.normalizedInput}</span> },
    { label: 'Listed / unlisted', value: notEncoded },
    { label: 'State', value: notEncoded },
    { label: 'Year of incorporation', value: notEncoded },
    { label: 'Company type', value: notEncoded },
  ];
}

/** Definition list of everything the identifier itself encodes. */
export function DecodedFields({ result }: { result: IdentifierResult }) {
  if (result.kind === 'UNKNOWN') return null;
  const fields = result.kind === 'CIN' ? cinFields(result) : llpinFields(result);
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="decoded-fields">
      {fields.map((f) => (
        <div key={f.label}>
          <dt className="text-xs font-medium text-slate-500">{f.label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
