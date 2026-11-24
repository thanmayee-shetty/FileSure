import {
  hasIndustryReference,
  lookupCompanyType,
  lookupIndustry,
  lookupState,
  lookupUnverifiedStateCandidate,
} from './reference';
import { CIN_LENGTH } from './normalize';
import type { CinDecoded, CinResult, IssueField, ValidationIssue, ValidationOptions, ValidationStatus } from './types';

export const DEFAULT_MIN_YEAR = 1857;

interface Segment {
  field: IssueField;
  start: number;
  length: number;
  pattern: RegExp;
  formatIssue: () => ValidationIssue;
}

/** CIN segments in validation-precedence order (Validation Rules §5). */
export const CIN_SEGMENTS: readonly Segment[] = [
  {
    field: 'listing',
    start: 0,
    length: 1,
    pattern: /^[LU]$/,
    formatIssue: () => error('CIN_LISTING_INVALID', 'Listing indicator must be L or U.', 'listing'),
  },
  {
    field: 'industry',
    start: 1,
    length: 5,
    pattern: /^[0-9]{5}$/,
    formatIssue: () => error('CIN_INDUSTRY_FORMAT', 'Industry code must contain exactly 5 digits.', 'industry'),
  },
  {
    field: 'state',
    start: 6,
    length: 2,
    pattern: /^[A-Z]{2}$/,
    formatIssue: () => error('CIN_STATE_FORMAT', 'State code must contain exactly 2 letters.', 'state'),
  },
  {
    field: 'year',
    start: 8,
    length: 4,
    pattern: /^[0-9]{4}$/,
    formatIssue: () => error('CIN_YEAR_FORMAT', 'Incorporation year must contain exactly 4 digits.', 'year'),
  },
  {
    field: 'companyType',
    start: 12,
    length: 3,
    pattern: /^[A-Z]{3}$/,
    formatIssue: () =>
      error('CIN_TYPE_FORMAT', 'Company classification code must contain exactly 3 letters.', 'companyType'),
  },
  {
    field: 'roc',
    start: 15,
    length: 6,
    pattern: /^[0-9]{6}$/,
    formatIssue: () => error('CIN_ROC_FORMAT', 'ROC registration number must contain exactly 6 digits.', 'roc'),
  },
];

function error(code: string, message: string, field?: IssueField): ValidationIssue {
  return { code, message, severity: 'error', field };
}

function advisory(code: string, message: string, field: IssueField, note?: string): ValidationIssue {
  return { code, message, severity: 'advisory', field, note };
}

function emptyDecoded(): CinDecoded {
  return {
    listedOrUnlisted: null,
    industryCode: null,
    industryDescription: null,
    stateCode: null,
    state: null,
    stateNote: null,
    yearOfIncorporation: null,
    companyTypeCode: null,
    companyType: null,
    companyTypeNote: null,
    rocRegistrationNumber: null,
  };
}

export function sliceSegment(value: string, field: IssueField): string {
  const seg = CIN_SEGMENTS.find((s) => s.field === field);
  if (!seg) return '';
  return value.slice(seg.start, seg.start + seg.length);
}

/**
 * Validate a normalized CIN candidate.
 *
 * - Length and invalid-character errors come first.
 * - For a 21-character value, every segment is checked independently and all
 *   failures are reported in precedence order.
 * - For any other length, segment boundaries are only trustworthy up to the
 *   first failing segment, so the walk stops there.
 */
export function validateCin(normalized: string, original: string, options: ValidationOptions = {}): CinResult {
  const currentYear = options.currentYear ?? new Date().getFullYear();
  const minYear = options.minYear ?? DEFAULT_MIN_YEAR;
  const issues: ValidationIssue[] = [];
  const decoded = emptyDecoded();

  const lengthOk = normalized.length === CIN_LENGTH;
  if (!lengthOk) {
    issues.push(
      error('CIN_LENGTH', `CIN must contain exactly ${CIN_LENGTH} characters; found ${normalized.length}.`),
    );
  }
  if (/[^A-Z0-9]/.test(normalized)) {
    issues.push(
      error(
        'CIN_INVALID_CHARACTERS',
        'CIN contains invalid characters. Use only letters and digits with no spaces or punctuation.',
      ),
    );
  }

  if (!lengthOk) {
    for (const seg of CIN_SEGMENTS) {
      const part = normalized.slice(seg.start, seg.start + seg.length);
      if (!seg.pattern.test(part)) {
        issues.push(seg.formatIssue());
        break;
      }
    }
    return finish(normalized, original, issues, decoded);
  }

  for (const seg of CIN_SEGMENTS) {
    const part = normalized.slice(seg.start, seg.start + seg.length);
    if (!seg.pattern.test(part)) {
      issues.push(seg.formatIssue());
      continue;
    }
    switch (seg.field) {
      case 'listing':
        decoded.listedOrUnlisted = part === 'L' ? 'Listed' : 'Unlisted';
        break;
      case 'industry': {
        decoded.industryCode = part;
        const industry = lookupIndustry(part);
        if (industry) {
          decoded.industryDescription = industry.description;
        } else if (hasIndustryReference()) {
          issues.push(
            advisory(
              'CIN_INDUSTRY_UNRECOGNIZED',
              `Industry code ${part} is not recognized in the local reference.`,
              'industry',
            ),
          );
        }
        break;
      }
      case 'state': {
        decoded.stateCode = part;
        const state = lookupState(part);
        if (state) {
          decoded.state = state.name;
          decoded.stateNote =
            state.displayNote ?? (state.historical ? `${part} is a historical code retained in older CINs.` : null);
        } else {
          const candidate = lookupUnverifiedStateCandidate(part);
          issues.push(
            advisory(
              'CIN_STATE_UNRECOGNIZED',
              `State code ${part} is not recognized in the local reference.`,
              'state',
              candidate
                ? `Some secondary sources associate ${part} with “${candidate.reportedMeaning}”. This is unconfirmed, so no state is decoded.`
                : undefined,
            ),
          );
        }
        break;
      }
      case 'year': {
        const year = Number(part);
        if (year < minYear) {
          issues.push(error('CIN_YEAR_TOO_OLD', `Incorporation year ${part} is outside the supported range.`, 'year'));
        } else if (year > currentYear) {
          issues.push(
            error(
              'CIN_YEAR_IN_FUTURE',
              `Incorporation year ${part} cannot be later than ${currentYear}.`,
              'year',
            ),
          );
        } else {
          decoded.yearOfIncorporation = year;
        }
        break;
      }
      case 'companyType': {
        decoded.companyTypeCode = part;
        const type = lookupCompanyType(part);
        if (type) {
          decoded.companyType = type.label;
          decoded.companyTypeNote = type.pendingConfirmation
            ? 'Observed code, pending broader MCA mapping confirmation.'
            : null;
        } else {
          issues.push(error('CIN_TYPE_UNRECOGNIZED', `Company type code ${part} is not recognized.`, 'companyType'));
        }
        break;
      }
      case 'roc':
        decoded.rocRegistrationNumber = part;
        break;
    }
  }

  return finish(normalized, original, issues, decoded);
}

function finish(
  normalized: string,
  original: string,
  issues: ValidationIssue[],
  decoded: CinDecoded,
): CinResult {
  let validationStatus: ValidationStatus = 'valid_format';
  if (issues.some((i) => i.severity === 'error')) validationStatus = 'invalid_format';
  else if (issues.some((i) => i.severity === 'advisory')) validationStatus = 'unrecognized_component';

  return {
    kind: 'CIN',
    entityType: 'Company',
    originalInput: original,
    normalizedInput: normalized,
    validationStatus,
    issues,
    notes: [],
    decoded,
  };
}
