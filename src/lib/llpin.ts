import { LLPIN_HYPHENLESS_PATTERN, LLPIN_LENGTH, LLPIN_PATTERN } from './normalize';
import type { LlpinResult, ValidationIssue } from './types';

/** Characters a user may have typed in place of the hyphen. */
const SEPARATOR_LIKE = /^[\s_./:‐-―−]$/;

const MESSAGES = {
  length: 'LLPIN must contain 3 letters, a hyphen, and 4 digits, for example AAA-1234.',
  letters: 'LLPIN prefix must contain exactly 3 letters.',
  separator: 'LLPIN must use a hyphen in the format AAA-1234.',
  digits: 'LLPIN suffix must contain exactly 4 digits.',
  invalidChars: 'LLPIN contains invalid characters. Use letters, a hyphen, and digits only.',
} as const;

function err(code: string, message: string): ValidationIssue {
  return { code, message, severity: 'error' };
}

function build(
  original: string,
  normalizedInput: string,
  issues: ValidationIssue[],
  normalized = false,
  notes: string[] = [],
): LlpinResult {
  return {
    kind: 'LLPIN',
    entityType: 'LLP',
    originalInput: original,
    normalizedInput,
    validationStatus: issues.length === 0 ? 'valid_format' : 'invalid_format',
    issues,
    notes,
    normalized,
    decoded: { listingStatus: null, state: null, yearOfIncorporation: null, companyType: null },
  };
}

/**
 * Validate a normalized LLPIN candidate.
 * Error precedence (Validation Rules §6.4): invalid characters → hyphen/length
 * layout → prefix letters → suffix digits.
 */
export function validateLlpin(normalized: string, original: string): LlpinResult {
  if (LLPIN_PATTERN.test(normalized)) {
    return build(original, normalized, []);
  }

  if (LLPIN_HYPHENLESS_PATTERN.test(normalized)) {
    const withHyphen = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    return build(original, withHyphen, [], true, [`LLPIN normalized from ${normalized} to ${withHyphen}`]);
  }

  const chars = [...normalized];
  const hyphens: number[] = [];
  const others: number[] = [];
  chars.forEach((c, i) => {
    if (c === '-') hyphens.push(i);
    else if (!/[A-Z0-9]/.test(c)) others.push(i);
  });

  const issues: ValidationIssue[] = [];
  let sepIndex = -1;
  let segmentsDeterminable = true;

  if (others.length === 0) {
    if (hyphens.length === 1) {
      sepIndex = hyphens[0]!;
    } else if (hyphens.length > 1) {
      issues.push(err('LLPIN_SEPARATOR_FORMAT', MESSAGES.separator));
      segmentsDeterminable = false;
    } else {
      issues.push(err('LLPIN_SEPARATOR_FORMAT', MESSAGES.separator));
    }
  } else {
    const only = others[0]!;
    const isSeparatorSlot =
      others.length === 1 && hyphens.length === 0 && only > 0 && only < chars.length - 1;
    if (isSeparatorSlot && SEPARATOR_LIKE.test(chars[only]!)) {
      sepIndex = only;
      issues.push(err('LLPIN_SEPARATOR_FORMAT', MESSAGES.separator));
    } else {
      issues.push(err('LLPIN_INVALID_CHARACTERS', MESSAGES.invalidChars));
      return build(original, normalized, issues);
    }
  }

  const expectedLength = sepIndex >= 0 ? LLPIN_LENGTH : LLPIN_LENGTH - 1;
  if (chars.length !== expectedLength) {
    issues.push(err('LLPIN_LENGTH', MESSAGES.length));
  }

  if (segmentsDeterminable) {
    let prefix: string;
    let suffix: string;
    if (sepIndex >= 0) {
      prefix = chars.slice(0, sepIndex).join('');
      suffix = chars.slice(sepIndex + 1).join('');
    } else {
      const lead = /^[A-Z]*/.exec(normalized)?.[0] ?? '';
      prefix = lead;
      suffix = normalized.slice(lead.length);
    }
    if (!/^[A-Z]{3}$/.test(prefix)) issues.push(err('LLPIN_LETTERS_FORMAT', MESSAGES.letters));
    if (!/^[0-9]{4}$/.test(suffix)) issues.push(err('LLPIN_DIGITS_FORMAT', MESSAGES.digits));
  }

  return build(original, normalized, issues);
}
