import { describe, expect, it } from 'vitest';
import { UNKNOWN_MESSAGE, detectKind, validateIdentifier } from './validate';

describe('identifier detection', () => {
  it('routes by shape, not length alone', () => {
    expect(detectKind('L17110MH1973PLC019786')).toBe('CIN');
    expect(detectKind('AAA-1234')).toBe('LLPIN');
    expect(detectKind('AAA1234')).toBe('LLPIN');
    expect(detectKind('ABCDEFGHIJKLMNOPQRSTU')).toBe('UNKNOWN');
    expect(detectKind('HELLO WORLD')).toBe('UNKNOWN');
  });
});

describe('unknown-format input', () => {
  it('explains length, letters and digits instead of a generic invalid label', () => {
    const r = validateIdentifier('12345');
    expect(r.kind).toBe('UNKNOWN');
    expect(r.validationStatus).toBe('invalid_format');
    expect(r.issues[0]?.message).toBe(UNKNOWN_MESSAGE);
    const codes = r.issues.map((i) => i.code);
    expect(codes).toContain('UNKNOWN_LENGTH');
    expect(codes).toContain('UNKNOWN_NO_LETTERS');
    expect(r.issues.find((i) => i.code === 'UNKNOWN_LENGTH')?.message).toMatch(/Has 5 characters/);
  });

  it('names disallowed characters', () => {
    const r = validateIdentifier('company name pvt ltd');
    expect(r.issues.find((i) => i.code === 'UNKNOWN_CHARACTERS')?.message).toMatch(/space/);
    expect(r.issues.map((i) => i.code)).toContain('UNKNOWN_NO_DIGITS');
  });
});
