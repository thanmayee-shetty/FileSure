import { isValidFormat } from './validate';
import type { IdentifierResult, ResultRow } from './types';

/** User-facing copy for each result state (Validation Rules §5, §6, §7). */
export const MCA_DISCLAIMER = 'Not verified against MCA records';
export const NOT_ENCODED = 'Not encoded in LLPIN';

export type Tone = 'valid' | 'review' | 'invalid' | 'unknown';

export interface StatusPresentation {
  badge: string;
  tone: Tone;
  detail: string | null;
}

export function presentStatus(result: IdentifierResult): StatusPresentation {
  if (result.kind === 'CIN') {
    if (result.validationStatus === 'valid_format') {
      return {
        badge: 'Valid format',
        tone: 'valid',
        detail: 'Decoded from the CIN structure. Not verified against MCA records.',
      };
    }
    if (result.validationStatus === 'unrecognized_component') {
      return {
        badge: 'Valid structure — component not recognized',
        tone: 'review',
        detail: 'The layout is valid, but one or more reference components could not be decoded.',
      };
    }
    return { badge: 'Invalid CIN', tone: 'invalid', detail: null };
  }
  if (result.kind === 'LLPIN') {
    if (result.validationStatus === 'valid_format') {
      return {
        badge: 'Valid format',
        tone: 'valid',
        detail: 'Matches the LLPIN format. Not verified against MCA records.',
      };
    }
    return { badge: 'Invalid LLPIN', tone: 'invalid', detail: null };
  }
  return { badge: 'Unknown format', tone: 'unknown', detail: null };
}

export function entityLabel(result: IdentifierResult): string {
  if (result.kind === 'CIN') return 'Company';
  if (result.kind === 'LLPIN') return 'LLP';
  return 'Unknown';
}

export function kindLabel(result: IdentifierResult): string {
  if (result.kind === 'CIN') return 'CIN';
  if (result.kind === 'LLPIN') return 'LLPIN';
  return '—';
}

export type ValidityFilter = 'all' | 'valid' | 'invalid';
export type EntityFilter = 'all' | 'CIN' | 'LLPIN';

export interface Filters {
  validity: ValidityFilter;
  entity: EntityFilter;
  query: string;
}

export const DEFAULT_FILTERS: Filters = { validity: 'all', entity: 'all', query: '' };

/** Filter rows without re-sorting them; input order is always preserved. */
export function filterRows(rows: ResultRow[], filters: Filters): ResultRow[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter(({ result }) => {
    if (filters.validity === 'valid' && !isValidFormat(result)) return false;
    if (filters.validity === 'invalid' && isValidFormat(result)) return false;
    if (filters.entity !== 'all' && result.kind !== filters.entity) return false;
    if (q) {
      const haystack = [
        result.originalInput,
        result.normalizedInput,
        ...result.issues.map((i) => i.message),
        presentStatus(result).badge,
      ]
        .join('\n')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
