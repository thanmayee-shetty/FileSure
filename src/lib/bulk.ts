import { isValidFormat, validateIdentifier } from './validate';
import type { IdentifierResult, ResultRow, ValidationOptions } from './types';

export const MAX_IDENTIFIERS = 500;

export interface ParsedLine {
  lineNumber: number;
  raw: string;
}

export interface ParsedInput {
  lines: ParsedLine[];
  blankCount: number;
}

/**
 * Split pasted text into lines, keeping original text and 1-based line numbers.
 * Whitespace-only lines are blank. A single trailing newline does not count
 * as an extra blank line.
 */
export function parseInput(text: string): ParsedInput {
  if (text === '') return { lines: [], blankCount: 0 };
  const rawLines = text.split(/\r\n|\n|\r/);
  if (rawLines.length > 1 && rawLines[rawLines.length - 1] === '') rawLines.pop();

  const lines: ParsedLine[] = [];
  let blankCount = 0;
  rawLines.forEach((raw, i) => {
    if (raw.trim() === '') blankCount += 1;
    else lines.push({ lineNumber: i + 1, raw });
  });
  return { lines, blankCount };
}

export function countIdentifiers(text: string): number {
  return parseInput(text).lines.length;
}

export interface Summary {
  total: number;
  validFormat: number;
  /** Valid layout with a component missing from the local reference. */
  needsReview: number;
  invalidFormat: number;
  cin: number;
  llp: number;
  unknown: number;
  blankIgnored: number;
}

export type BulkOutcome =
  | { status: 'empty'; blankCount: number }
  | { status: 'over_limit'; count: number; excess: number; message: string; detail: string }
  | { status: 'ok'; rows: ResultRow[]; summary: Summary };

export const OVER_LIMIT_MESSAGE = 'Too many identifiers';

export function overLimitDetail(excess: number): string {
  return `This checker accepts up to ${MAX_IDENTIFIERS} identifiers at a time. Remove ${excess} identifier${excess === 1 ? '' : 's'} and try again.`;
}

export function summarize(results: IdentifierResult[], blankIgnored: number): Summary {
  const summary: Summary = {
    total: results.length,
    validFormat: 0,
    needsReview: 0,
    invalidFormat: 0,
    cin: 0,
    llp: 0,
    unknown: 0,
    blankIgnored,
  };
  for (const r of results) {
    if (isValidFormat(r)) summary.validFormat += 1;
    else summary.invalidFormat += 1;
    if (r.validationStatus === 'unrecognized_component') summary.needsReview += 1;
    if (r.kind === 'CIN') summary.cin += 1;
    else if (r.kind === 'LLPIN') summary.llp += 1;
    else summary.unknown += 1;
  }
  return summary;
}

/**
 * Validate pasted bulk input. The 500-identifier limit is enforced before any
 * validation runs; nothing is truncated.
 */
export function checkBulk(text: string, options: ValidationOptions = {}): BulkOutcome {
  const { lines, blankCount } = parseInput(text);
  if (lines.length === 0) return { status: 'empty', blankCount };

  if (lines.length > MAX_IDENTIFIERS) {
    const excess = lines.length - MAX_IDENTIFIERS;
    return {
      status: 'over_limit',
      count: lines.length,
      excess,
      message: OVER_LIMIT_MESSAGE,
      detail: overLimitDetail(excess),
    };
  }

  const rows: ResultRow[] = lines.map(({ lineNumber, raw }) => ({
    lineNumber,
    result: validateIdentifier(raw, options),
  }));
  return { status: 'ok', rows, summary: summarize(rows.map((r) => r.result), blankCount) };
}

export function formatSummary(s: Summary): string {
  const parts = [
    `${s.total} identifier${s.total === 1 ? '' : 's'}`,
    `${s.validFormat} valid format`,
    `${s.invalidFormat} invalid format`,
    `${s.cin} CIN`,
    `${s.llp} LLP`,
  ];
  if (s.unknown > 0) parts.push(`${s.unknown} unknown`);
  return parts.join(' • ');
}
