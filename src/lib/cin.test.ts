import { describe, expect, it } from 'vitest';
import { validateIdentifier } from './validate';
import type { CinResult } from './types';

const opts = { currentYear: 2026 };
const cin = (raw: string) => {
  const r = validateIdentifier(raw, opts);
  expect(r.kind).toBe('CIN');
  return r as CinResult;
};
const codes = (r: CinResult) => r.issues.map((i) => i.code);

describe('CIN validation', () => {
  it('decodes the assignment example L17110MH1973PLC019786', () => {
    const r = cin('L17110MH1973PLC019786');
    expect(r.validationStatus).toBe('valid_format');
    expect(r.entityType).toBe('Company');
    expect(r.issues).toEqual([]);
    expect(r.decoded).toMatchObject({
      listedOrUnlisted: 'Listed',
      industryCode: '17110',
      stateCode: 'MH',
      state: 'Maharashtra',
      yearOfIncorporation: 1973,
      companyTypeCode: 'PLC',
      companyType: 'Public limited Indian non-government company',
      rocRegistrationNumber: '019786',
    });
  });

  it('decodes every segment of an unlisted private company CIN', () => {
    const r = cin('U17110KA2024PTC000001');
    expect(r.validationStatus).toBe('valid_format');
    expect(r.decoded).toMatchObject({
      listedOrUnlisted: 'Unlisted',
      industryCode: '17110',
      state: 'Karnataka',
      yearOfIncorporation: 2024,
      companyType: 'Private limited Indian non-government company',
      rocRegistrationNumber: '000001',
    });
  });

  it('normalizes lowercase input and surrounding whitespace, preserving the original', () => {
    const r = cin('  l17110mh1973plc019786 ');
    expect(r.validationStatus).toBe('valid_format');
    expect(r.normalizedInput).toBe('L17110MH1973PLC019786');
    expect(r.originalInput).toBe('  l17110mh1973plc019786 ');
  });

  it('preserves ROC leading zeroes as a string', () => {
    const r = cin('L17110MH1973PLC000786');
    expect(r.decoded.rocRegistrationNumber).toBe('000786');
    expect(typeof r.decoded.rocRegistrationNumber).toBe('string');
  });

  it('preserves industry-code leading zeroes', () => {
    expect(cin('U01110MH2010PTC123456').decoded.industryCode).toBe('01110');
  });

  it('rejects an invalid listing indicator', () => {
    const r = cin('X17110MH1973PLC019786');
    expect(r.validationStatus).toBe('invalid_format');
    expect(r.issues[0]).toMatchObject({
      code: 'CIN_LISTING_INVALID',
      message: 'Listing indicator must be L or U.',
      field: 'listing',
    });
    expect(r.decoded.listedOrUnlisted).toBeNull();
    expect(r.decoded.state).toBe('Maharashtra');
  });

  it('rejects a year before 1857', () => {
    const r = cin('L17110MH1849PLC019786');
    expect(r.validationStatus).toBe('invalid_format');
    expect(r.issues).toContainEqual(
      expect.objectContaining({
        code: 'CIN_YEAR_TOO_OLD',
        message: 'Incorporation year 1849 is outside the supported range.',
      }),
    );
    expect(r.decoded.yearOfIncorporation).toBeNull();
  });

  it('rejects a year in the future', () => {
    const r = cin('L17110MH2029PLC019786');
    expect(r.issues).toContainEqual(
      expect.objectContaining({
        code: 'CIN_YEAR_IN_FUTURE',
        message: 'Incorporation year 2029 cannot be later than 2026.',
      }),
    );
  });

  it('accepts the 1857 floor and the current year', () => {
    expect(cin('L17110MH1857PLC019786').validationStatus).toBe('valid_format');
    expect(cin('L17110MH2026PLC019786').validationStatus).toBe('valid_format');
  });

  it('rejects a non-numeric year', () => {
    expect(codes(cin('L17110MH19A3PLC019786'))).toEqual(['CIN_YEAR_FORMAT']);
  });

  it('flags an unknown state code as an unrecognized component, not invalid', () => {
    const r = cin('L17110XX1973PLC019786');
    expect(r.validationStatus).toBe('unrecognized_component');
    expect(r.issues).toEqual([
      expect.objectContaining({
        code: 'CIN_STATE_UNRECOGNIZED',
        severity: 'advisory',
        message: 'State code XX is not recognized in the local reference.',
      }),
    ]);
    expect(r.decoded.state).toBeNull();
    expect(r.decoded.stateCode).toBe('XX');
  });

  it('does not decode unverified ROC-office candidates as states', () => {
    const r = cin('U72900UW2024PTC000123');
    expect(r.validationStatus).toBe('unrecognized_component');
    expect(r.decoded.state).toBeNull();
    expect(r.issues[0]?.note).toMatch(/unconfirmed/);
  });

  it('keeps historical state codes DD, DN and OR', () => {
    expect(cin('U17110DD1990PTC000001').decoded.state).toBe('Daman and Diu');
    expect(cin('U17110DN1990PTC000001').decoded.state).toBe('Dadra and Nagar Haveli');
    const or = cin('U17110OR1990PTC000001');
    expect(or.decoded.state).toBe('Odisha');
    expect(or.decoded.stateNote).toMatch(/Orissa/);
  });

  it('rejects an unknown company classification', () => {
    const r = cin('L17110MH1973ABC019786');
    expect(r.validationStatus).toBe('invalid_format');
    expect(r.issues).toEqual([
      expect.objectContaining({
        code: 'CIN_TYPE_UNRECOGNIZED',
        message: 'Company type code ABC is not recognized.',
      }),
    ]);
  });

  it('labels OPC as observed and pending confirmation', () => {
    const r = cin('U74999MH2020OPC123456');
    expect(r.validationStatus).toBe('valid_format');
    expect(r.decoded.companyType).toBe('One Person Company');
    expect(r.decoded.companyTypeNote).toMatch(/pending/i);
  });

  it('recognizes every documented company code', () => {
    for (const code of ['GOI', 'SGC', 'PLC', 'PTC', 'FLC', 'FTC', 'ULL', 'ULT', 'GAP', 'GAT', 'NPL', 'OPC']) {
      expect(cin(`U17110MH2000${code}000001`).decoded.companyType).not.toBeNull();
    }
  });

  it('reports a length error first, then the first failing segment', () => {
    const r = cin('L17110MH1973PLC01978');
    expect(r.validationStatus).toBe('invalid_format');
    expect(r.issues.map((i) => i.message)).toEqual([
      'CIN must contain exactly 21 characters; found 20.',
      'ROC registration number must contain exactly 6 digits.',
    ]);
  });

  it('reports invalid characters together with the affected segment', () => {
    expect(codes(cin('L1711!MH1973PLC019786'))).toEqual(['CIN_INVALID_CHARACTERS', 'CIN_INDUSTRY_FORMAT']);
  });

  it('reports multiple segment errors in precedence order', () => {
    expect(codes(cin('X1711AMH1973ABC01978A'))).toEqual([
      'CIN_LISTING_INVALID',
      'CIN_INDUSTRY_FORMAT',
      'CIN_TYPE_UNRECOGNIZED',
      'CIN_ROC_FORMAT',
    ]);
  });

  it('rejects a state segment that is not letters', () => {
    expect(codes(cin('L17110M11973PLC019786'))).toEqual(['CIN_STATE_FORMAT']);
  });

  it('rejects a classification segment that is not letters', () => {
    expect(codes(cin('L17110MH1973P1C019786'))).toEqual(['CIN_TYPE_FORMAT']);
  });

  it('rejects internal spaces', () => {
    expect(codes(cin('L17110 MH1973PLC019786'))).toEqual([
      'CIN_LENGTH',
      'CIN_INVALID_CHARACTERS',
      'CIN_STATE_FORMAT',
    ]);
  });
});
