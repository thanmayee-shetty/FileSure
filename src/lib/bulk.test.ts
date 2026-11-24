import { describe, expect, it } from 'vitest';
import { MAX_IDENTIFIERS, checkBulk, formatSummary, parseInput } from './bulk';

const repeat = (value: string, n: number) => Array.from({ length: n }, () => value).join('\n');

describe('bulk input', () => {
  it('treats empty and whitespace-only input as empty', () => {
    expect(checkBulk('').status).toBe('empty');
    expect(checkBulk('   \n\t\n').status).toBe('empty');
  });

  it('ignores blank lines and keeps source line numbers', () => {
    const out = checkBulk('L17110MH1973PLC019786\n\n   \nAAA-1234\n');
    if (out.status !== 'ok') throw new Error('expected ok');
    expect(out.rows.map((r) => r.lineNumber)).toEqual([1, 4]);
    expect(out.summary.blankIgnored).toBe(2);
  });

  it('keeps duplicates as separate rows in input order', () => {
    const out = checkBulk('AAA-1234\nL17110MH1973PLC019786\nAAA-1234\naaa-1234');
    if (out.status !== 'ok') throw new Error('expected ok');
    expect(out.rows.map((r) => r.result.normalizedInput)).toEqual([
      'AAA-1234',
      'L17110MH1973PLC019786',
      'AAA-1234',
      'AAA-1234',
    ]);
    expect(out.summary.total).toBe(4);
  });

  it('accepts exactly 500 identifiers', () => {
    const out = checkBulk(repeat('AAA-1234', MAX_IDENTIFIERS));
    if (out.status !== 'ok') throw new Error('expected ok');
    expect(out.rows).toHaveLength(500);
  });

  it('refuses more than 500 identifiers without partial results', () => {
    expect(checkBulk(repeat('AAA-1234', 506))).toEqual({
      status: 'over_limit',
      count: 506,
      excess: 6,
      message: 'Too many identifiers',
      detail: 'This checker accepts up to 500 identifiers at a time. Remove 6 identifiers and try again.',
    });
  });

  it('does not count blank lines toward the limit', () => {
    const text = repeat('AAA-1234\n', 500);
    expect(parseInput(text).lines).toHaveLength(500);
    expect(checkBulk(text).status).toBe('ok');
  });

  it('uses the singular for one excess identifier', () => {
    const out = checkBulk(repeat('X', 501));
    if (out.status !== 'over_limit') throw new Error('expected over_limit');
    expect(out.detail).toMatch(/Remove 1 identifier and/);
  });

  it('summarizes counts', () => {
    const out = checkBulk('L17110MH1973PLC019786\nAAA-1234\nAAA 1234\nhello\nL17110XX1973PLC019786', {
      currentYear: 2026,
    });
    if (out.status !== 'ok') throw new Error('expected ok');
    expect(out.summary).toMatchObject({
      total: 5,
      validFormat: 3,
      needsReview: 1,
      invalidFormat: 2,
      cin: 2,
      llp: 2,
      unknown: 1,
    });
    expect(formatSummary(out.summary)).toBe(
      '5 identifiers • 3 valid format • 2 invalid format • 2 CIN • 2 LLP • 1 unknown',
    );
  });
});
