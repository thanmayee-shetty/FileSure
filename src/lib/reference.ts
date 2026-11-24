/**
 * Versioned reference data for decoding CIN components.
 *
 * The canonical data lives in `/cin-reference-mappings.json` at the project
 * root. This module only adapts it into typed lookups — it never adds
 * mappings of its own. Unverified state-segment candidates are kept apart
 * and are never used to decode a state.
 */
import rawMappings from '../../cin-reference-mappings.json';

export interface StateMapping {
  code: string;
  name: string;
  kind: string;
  status: string;
  /** True for codes retained for historical/legacy reasons (DD, DN, OR). */
  historical: boolean;
  displayNote?: string;
}

export interface CompanyTypeMapping {
  code: string;
  label: string;
  category: string;
  status: string;
  /** True when the code is observed but not yet broadly confirmed (OPC). */
  pendingConfirmation: boolean;
  note?: string;
}

export interface UnverifiedStateCandidate {
  code: string;
  reportedMeaning: string;
  status: string;
  note: string;
}

export interface IndustryMapping {
  code: string;
  description: string;
}

interface RawState {
  name: string;
  kind: string;
  status: string;
  displayNote?: string;
}
interface RawCompanyType {
  label: string;
  category: string;
  status: string;
  note?: string;
}
interface RawCandidate {
  reportedMeaning: string;
  status: string;
  note: string;
}
interface RawMappings {
  _metadata: { version: string; preparedOn: string; status: string };
  stateCodes: Record<string, RawState>;
  companyTypes: Record<string, RawCompanyType>;
  unverifiedStateSegmentCandidates: Record<string, RawCandidate>;
  industryCodes?: Record<string, { description: string }>;
}

const data = rawMappings as RawMappings;

export const REFERENCE_VERSION = data._metadata.version;
export const REFERENCE_PREPARED_ON = data._metadata.preparedOn;

const stateCodes = new Map<string, StateMapping>(
  Object.entries(data.stateCodes).map(([code, s]) => [
    code,
    {
      code,
      name: s.name,
      kind: s.kind,
      status: s.status,
      historical: s.status !== 'baseline',
      displayNote: s.displayNote,
    },
  ]),
);

const companyTypes = new Map<string, CompanyTypeMapping>(
  Object.entries(data.companyTypes).map(([code, t]) => [
    code,
    {
      code,
      label: t.label,
      category: t.category,
      status: t.status,
      pendingConfirmation: t.status.startsWith('observed'),
      note: t.note,
    },
  ]),
);

const unverifiedCandidates = new Map<string, UnverifiedStateCandidate>(
  Object.entries(data.unverifiedStateSegmentCandidates).map(([code, c]) => [code, { code, ...c }]),
);

/**
 * No authoritative industry (NIC-2004) dataset has been sourced yet, so this
 * map is empty unless the reference file gains an `industryCodes` section.
 * While it is empty, the industry-recognition advisory is disabled rather
 * than flagging every CIN.
 */
const industryCodes = new Map<string, IndustryMapping>(
  Object.entries(data.industryCodes ?? {}).map(([code, i]) => [code, { code, description: i.description }]),
);

export function lookupState(code: string): StateMapping | undefined {
  return stateCodes.get(code);
}

export function lookupCompanyType(code: string): CompanyTypeMapping | undefined {
  return companyTypes.get(code);
}

export function lookupUnverifiedStateCandidate(code: string): UnverifiedStateCandidate | undefined {
  return unverifiedCandidates.get(code);
}

export function lookupIndustry(code: string): IndustryMapping | undefined {
  return industryCodes.get(code);
}

export function hasIndustryReference(): boolean {
  return industryCodes.size > 0;
}

export function allStateCodes(): string[] {
  return [...stateCodes.keys()];
}

export function allCompanyTypeCodes(): string[] {
  return [...companyTypes.keys()];
}
