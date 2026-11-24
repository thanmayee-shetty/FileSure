import { validateCin } from './cin';
import { validateLlpin } from './llpin';
import {
  CIN_EXAMPLE,
  CIN_LENGTH,
  CIN_PATTERN,
  LLPIN_EXAMPLE,
  LLPIN_HYPHENLESS_PATTERN,
  LLPIN_LENGTH,
  LLPIN_PATTERN,
  normalizeIdentifier,
} from './normalize';
import type { IdentifierResult, UnknownResult, ValidationIssue, ValidationOptions } from './types';

export type DetectedKind = 'CIN' | 'LLPIN' | 'UNKNOWN';

const count = (value: string, re: RegExp) => (value.match(re) ?? []).length;

/**
 * Close enough to a CIN that segment-level errors will be useful.
 * Uses composition (digits and letters) as well as length — never length alone.
 */
function looksLikeCin(value: string): boolean {
  return (
    value.length >= CIN_LENGTH - 4 &&
    value.length <= CIN_LENGTH + 4 &&
    /^[A-Z0-9]/.test(value) &&
    count(value, /[0-9]/g) >= 8 &&
    count(value, /[A-Z]/g) >= 3
  );
}

/** Short, letter-led value with a hyphen or a separator-like gap before a digit block. */
function looksLikeLlpin(value: string): boolean {
  if (value.length < 5 || value.length > LLPIN_LENGTH + 2) return false;
  if (!/^[A-Z]{2,4}/.test(value)) return false;
  if (value.includes('-')) return true;
  return /^[A-Z]{2,4}[\s_./:‐-―−]?[A-Z0-9]{3,6}$/.test(value) && /[0-9]/.test(value);
}

/** Identifier type detection (Validation Rules §3). */
export function detectKind(normalized: string): DetectedKind {
  if (CIN_PATTERN.test(normalized)) return 'CIN';
  if (LLPIN_PATTERN.test(normalized) || LLPIN_HYPHENLESS_PATTERN.test(normalized)) return 'LLPIN';
  if (looksLikeCin(normalized)) return 'CIN';
  if (looksLikeLlpin(normalized)) return 'LLPIN';
  return 'UNKNOWN';
}

export const UNKNOWN_MESSAGE = 'Could not identify this as a CIN or LLPIN.';
export const UNKNOWN_DETAIL = `Use a 21-character CIN such as ${CIN_EXAMPLE} or an LLPIN such as ${LLPIN_EXAMPLE}.`;

function describeChar(c: string): string {
  if (c === ' ') return 'space';
  if (c === '\t') return 'tab';
  if (/\s/.test(c)) return 'whitespace';
  const code = c.codePointAt(0) ?? 0;
  if (code < 0x20 || code === 0x7f) return `control character U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  return `“${c}”`;
}

function hint(code: string, message: string): ValidationIssue {
  return { code, message, severity: 'hint' };
}

/** Explain why an input fits neither format (Validation Rules §7). */
export function explainUnknown(normalized: string, original: string): UnknownResult {
  const issues: ValidationIssue[] = [{ code: 'UNKNOWN_FORMAT', message: UNKNOWN_MESSAGE, severity: 'error' }];
  const len = [...normalized].length;
  const letters = count(normalized, /[A-Z]/g);
  const digits = count(normalized, /[0-9]/g);

  issues.push(
    hint(
      'UNKNOWN_LENGTH',
      `Has ${len} character${len === 1 ? '' : 's'}. A CIN has ${CIN_LENGTH}; an LLPIN has ${LLPIN_LENGTH} (for example ${LLPIN_EXAMPLE}).`,
    ),
  );

  const bad = [...new Set([...normalized].filter((c) => !/[A-Z0-9-]/.test(c)))];
  if (bad.length > 0) {
    issues.push(
      hint(
        'UNKNOWN_CHARACTERS',
        `Contains characters that are not allowed: ${bad.map(describeChar).join(', ')}. Use only letters and digits, plus one hyphen in an LLPIN.`,
      ),
    );
  }
  if (letters === 0) {
    issues.push(hint('UNKNOWN_NO_LETTERS', 'Contains no letters. A CIN has 6 letters; an LLPIN starts with 3.'));
  }
  if (digits === 0) {
    issues.push(hint('UNKNOWN_NO_DIGITS', 'Contains no digits. A CIN has 15 digits; an LLPIN ends with 4.'));
  }
  if (normalized.includes('-')) {
    issues.push(
      hint('UNKNOWN_SEPARATOR', 'Contains a hyphen. Only an LLPIN uses one, between 3 letters and 4 digits.'),
    );
  }

  return {
    kind: 'UNKNOWN',
    entityType: null,
    originalInput: original,
    normalizedInput: normalized,
    validationStatus: 'invalid_format',
    issues,
    notes: [],
  };
}

/** Validate a single raw line. */
export function validateIdentifier(raw: string, options: ValidationOptions = {}): IdentifierResult {
  const normalized = normalizeIdentifier(raw);
  switch (detectKind(normalized)) {
    case 'CIN':
      return validateCin(normalized, raw, options);
    case 'LLPIN':
      return validateLlpin(normalized, raw);
    default:
      return explainUnknown(normalized, raw);
  }
}

export function isValidFormat(result: IdentifierResult): boolean {
  return result.validationStatus !== 'invalid_format';
}
