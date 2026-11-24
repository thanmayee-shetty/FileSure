import { MCA_DISCLAIMER, NOT_ENCODED, entityLabel, presentStatus } from './display';
import type { ResultRow } from './types';

function cell(value: string | number | null): string {
  const s = value === null ? '' : String(value);
  // Quote everything; also neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function rowsToCsv(rows: ResultRow[]): string {
  const header = [
    'Line',
    'Original input',
    'Normalized input',
    'Entity',
    'Result',
    'Listed / unlisted',
    'Industry code',
    'State',
    'Year of incorporation',
    'Company type',
    'ROC registration number',
    'Issues',
    'MCA status',
  ];
  const lines = rows.map(({ lineNumber, result }) => {
    const base = [lineNumber, result.originalInput, result.normalizedInput, entityLabel(result), presentStatus(result).badge];
    let decoded: (string | number | null)[];
    if (result.kind === 'CIN') {
      const d = result.decoded;
      decoded = [d.listedOrUnlisted, d.industryCode, d.state, d.yearOfIncorporation, d.companyType, d.rocRegistrationNumber];
    } else if (result.kind === 'LLPIN') {
      decoded = [NOT_ENCODED, null, NOT_ENCODED, NOT_ENCODED, NOT_ENCODED, null];
    } else {
      decoded = [null, null, null, null, null, null];
    }
    const issues = result.issues.map((i) => i.message).join(' | ');
    return [...base, ...decoded, issues, MCA_DISCLAIMER].map(cell).join(',');
  });
  return [header.map(cell).join(','), ...lines].join('\r\n');
}
