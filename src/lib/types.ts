/** Shared result model for CIN / LLPIN format validation (see FileSure-Validation-Rules.md §4.2, §6.3). */

export type ValidationStatus = 'valid_format' | 'invalid_format' | 'unrecognized_component';

export type IssueField = 'listing' | 'industry' | 'state' | 'year' | 'companyType' | 'roc';

/**
 * `error` makes the identifier's format invalid.
 * `advisory` keeps the layout valid but flags a component that the local
 * reference could not decode (unknown state / industry).
 * `hint` explains an unknown-format input.
 */
export type IssueSeverity = 'error' | 'advisory' | 'hint';

export interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
  field?: IssueField;
  /** Optional extra context, never a decoded value. */
  note?: string;
}

export interface CinDecoded {
  listedOrUnlisted: 'Listed' | 'Unlisted' | null;
  industryCode: string | null;
  /** Only set when the industry code exists in the maintained reference. */
  industryDescription: string | null;
  stateCode: string | null;
  state: string | null;
  stateNote: string | null;
  yearOfIncorporation: number | null;
  companyTypeCode: string | null;
  companyType: string | null;
  companyTypeNote: string | null;
  /** Always a string so leading zeroes are preserved. */
  rocRegistrationNumber: string | null;
}

interface BaseResult {
  originalInput: string;
  normalizedInput: string;
  issues: ValidationIssue[];
  /** Informational notes such as normalization performed. */
  notes: string[];
}

export interface CinResult extends BaseResult {
  kind: 'CIN';
  entityType: 'Company';
  validationStatus: ValidationStatus;
  decoded: CinDecoded;
}

export interface LlpinResult extends BaseResult {
  kind: 'LLPIN';
  entityType: 'LLP';
  validationStatus: 'valid_format' | 'invalid_format';
  /** True when a hyphen was inserted (AAA1234 → AAA-1234). */
  normalized: boolean;
  decoded: {
    listingStatus: null;
    state: null;
    yearOfIncorporation: null;
    companyType: null;
  };
}

export interface UnknownResult extends BaseResult {
  kind: 'UNKNOWN';
  entityType: null;
  validationStatus: 'invalid_format';
}

export type IdentifierResult = CinResult | LlpinResult | UnknownResult;

export interface ResultRow {
  /** Stable key: the 1-based source line number. */
  lineNumber: number;
  result: IdentifierResult;
}

export interface ValidationOptions {
  /** Defaults to the current calendar year. */
  currentYear?: number;
  /** Conservative historical lower bound; not an official MCA rule. */
  minYear?: number;
}
