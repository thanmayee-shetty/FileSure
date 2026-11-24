import { describe, expect, it } from 'vitest';
import { validateIdentifier } from './validate';
import type { LlpinResult } from './types';

const llpin = (raw: string) => {
  const r = validateIdentifier(raw);
  expect(r.kind).toBe('LLPIN');
  return r as LlpinResult;
};
const messages = (r: LlpinResult) => r.issues.map((i) => i.message);
const codes = (r: LlpinResult) => r.issues.map((i) => i.code);

describe('LLPIN validation', () => {
  it('accepts the assignment example AAA-1234', () => {
    const r = llpin('AAA-1234');
    expect(r.validationStatus).toBe('valid_format');
    expect(r.entityType).toBe('LLP');
    expect(r.normalized).toBe(false);
    expect(r.decoded).toEqual({ listingStatus: null, state: null, yearOfIncorporation: null, companyType: null });
  });

  it('normalizes a hyphenless LLPIN and records the original', () => {
    const r = llpin(' aaa1234 ');
    expect(r.validationStatus).toBe('valid_format');
    expect(r.normalized).toBe(true);
    expect(r.normalizedInput).toBe('AAA-1234');
    expect(r.originalInput).toBe(' aaa1234 ');
    expect(r.notes).toEqual(['LLPIN normalized from AAA1234 to AAA-1234']);
  });

  it('reports a separator error for AAA 1234', () => {
    const r = llpin('AAA 1234');
    expect(r.validationStatus).toBe('invalid_format');
    expect(messages(r)).toEqual(['LLPIN must use a hyphen in the format AAA-1234.']);
  });

  it('reports a numeric suffix error for AAA-12X4', () => {
    expect(messages(llpin('AAA-12X4'))).toEqual(['LLPIN suffix must contain exactly 4 digits.']);
  });

  it('reports length and prefix errors for AA-1234', () => {
    expect(codes(llpin('AA-1234'))).toEqual(['LLPIN_LENGTH', 'LLPIN_LETTERS_FORMAT']);
  });

  it('reports a length error for AAA-12345 and AAA-123', () => {
    expect(codes(llpin('AAA-12345'))[0]).toBe('LLPIN_LENGTH');
    expect(codes(llpin('AAA-123'))[0]).toBe('LLPIN_LENGTH');
  });

  it('reports invalid characters first', () => {
    expect(codes(llpin('AAA-12#4'))).toEqual(['LLPIN_INVALID_CHARACTERS']);
  });

  it('does not accept other missing-punctuation forms', () => {
    const r = llpin('AA12345');
    expect(r.validationStatus).toBe('invalid_format');
    expect(codes(r)[0]).toBe('LLPIN_SEPARATOR_FORMAT');
  });
});
