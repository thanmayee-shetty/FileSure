/**
 * Trim surrounding whitespace and uppercase ASCII letters only.
 * Internal spaces, punctuation and non-ASCII characters are left untouched
 * so that validation can report them precisely.
 */
export function normalizeIdentifier(raw: string): string {
  return raw.trim().replace(/[a-z]/g, (c) => c.toUpperCase());
}

export const CIN_PATTERN = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
export const LLPIN_PATTERN = /^[A-Z]{3}-[0-9]{4}$/;
export const LLPIN_HYPHENLESS_PATTERN = /^[A-Z]{3}[0-9]{4}$/;

export const CIN_LENGTH = 21;
export const LLPIN_LENGTH = 8;

export const CIN_EXAMPLE = 'L17110MH1973PLC019786';
export const LLPIN_EXAMPLE = 'AAA-1234';
