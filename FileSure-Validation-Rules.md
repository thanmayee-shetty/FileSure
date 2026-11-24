# FileSure CIN / LLPIN Validation Rules and Error Messages

**Project:** FileSure CIN / LLPIN Checker  
**Status:** Implementation specification  
**Prepared:** 24 November 2026  
**Related progress:** Checklist items 1 and 2 are complete

## 1. Scope

This specification defines application-level format validation. It does
not verify that an identifier exists in MCA records or that an entity is
currently active.

The display must use separate concepts:

- **Valid format:** The identifier has the expected structure.
- **Decoded details:** The fields that can be derived from recognized CIN segments.
- **MCA status:** Not applicable unless a reliable MCA lookup is implemented.

Do not show a green **Verified** badge for format validation alone.

## 2. Common input rules

1. Split input by line and preserve the original text for each row.
2. Trim leading and trailing whitespace before parsing.
3. Convert ASCII letters `A-Z` and `a-z` to uppercase.
4. Ignore blank lines in bulk input.
5. Keep duplicate identifiers as separate rows.
6. Preserve leading zeroes in CIN and LLPIN numeric segments.
7. Do not remove internal spaces, punctuation, or control characters.
8. Accept a maximum of 500 non-empty lines.
9. Process up to 500 lines locally; do not silently truncate a larger input.

### Bulk-line limit

When more than 500 non-empty lines are submitted:

**Message:** `Too many identifiers`

**Detail:** `This checker accepts up to 500 identifiers at a time. Remove 6 identifiers and try again.`

Rules:

- Do not run validation or partially show results.
- Calculate the over-limit count accurately.
- Preserve the submitted text.
- The detail may be updated dynamically with the exact number to remove.

### Empty input

**Title:** `Paste identifiers to check`

**Detail:** `Enter one CIN or LLPIN per line, for example L17110MH1973PLC019786 or AAA-1234.`

No error icon or red validation state should be shown before submission.

## 3. Identifier type detection

1. Normalize case and surrounding whitespace.
2. If the normalized value matches the CIN shape, pass it to the CIN validator.
3. If it matches the LLPIN shape, pass it to the LLPIN validator.
4. If a hyphenless 7-character LLPIN candidate matches `^[A-Z]{3}[0-9]{4}$`, normalize it to `AAA-1234` and pass it to the LLPIN validator.
5. Otherwise, return **Unknown format**.

Do not classify an identifier by length alone.

## 4. CIN validation

### 4.1 CIN structure

A CIN has exactly 21 characters:

| Position | Segment | Rule |
|---|---|---|
| 1 | Listing indicator | Exactly `L` or `U` |
| 2-6 | Industry code | Exactly five ASCII digits |
| 7-8 | State code | Exactly two ASCII letters |
| 9-12 | Incorporation year | Exactly four ASCII digits |
| 13-15 | Company classification | Exactly three ASCII letters |
| 16-21 | ROC registration number | Exactly six ASCII digits |

Structural regular expression:

```regex
^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$
```

This expression is the layout check only. Component allowlists are checked
separately.

### 4.2 Validation result model

Use this result shape:

```ts
type ValidationStatus =
  | "valid_format"
  | "invalid_format"
  | "unrecognized_component";

interface ValidationIssue {
  code: string;
  message: string;
  field?: "listing" | "industry" | "state" | "year" | "companyType" | "roc";
}

interface CinResult {
  originalInput: string;
  normalizedInput: string;
  entityType: "Company";
  validationStatus: ValidationStatus;
  issues: ValidationIssue[];
  decoded: {
    listedOrUnlisted: "Listed" | "Unlisted" | null;
    industryCode: string | null;
    state: string | null;
    yearOfIncorporation: number | null;
    companyType: string | null;
    rocRegistrationNumber: string | null;
  };
}
```

### 4.3 Segment rules

#### Listing indicator

| Value | Meaning |
|---|---|
| `L` | Listed |
| `U` | Unlisted |

The listing indicator and company classification are independent.
Do not interpret `L` as meaning public limited.

#### Industry code

- Must be five ASCII digits.
- Numeric industry code values do not need to be convertible to a number.
- Preserve the original five-character value.
- A complete authoritative industry allowlist is not yet confirmed.
- If the code is present in the maintained mapping, show the mapped
  industry description.
- If it is absent from the mapping, show `Industry code not in local reference`
  as an advisory, not a structural format failure.

Do not add an allowlist of every possible five-digit value.

#### State code

- Must be two ASCII letters.
- Compare against a versioned mapping of baseline state and territory codes.
- Current baseline mappings include `AN`, `AP`, `AR`, `AS`, `BR`, `CH`,
  `CG`, `DD`, `DL`, `DN`, `GA`, `GJ`, `HP`, `HR`, `JH`, `JK`, `KA`,
  `KL`, `LD`, `MH`, `ML`, `MN`, `MP`, `MZ`, `NL`, `OR`, `PB`, `PY`,
  `RJ`, `SK`, `TG`, `TN`, `TR`, `UP`, `UT`, and `WB`.
- Historical `DD`, `DN`, and `OR` retain historical status.
- Do not infer a state from reported ROC-office candidates such as `UW`,
  `PN`, `MR`, `DC`, `WR`, `ME`, or `TZ` until the mapping is confirmed.
- An unrecognized state code must be reported as an unrecognized
  component, not silently decoded or guessed.

#### Incorporation year

- Must be four ASCII digits.
- The decoded year must be no earlier than 1857 and no later than the
  current calendar year.
- The year is a decodable segment, not proof of the exact incorporation date.

The 1857 floor is a conservative historical lower bound and should remain
configurable. It must not be presented as an official MCA rule.

#### Company classification

- Must be three ASCII letters.
- Use the versioned mapping for recognized classifications.
- Known baseline mappings:

| Code | Display |
|---|---|
| `GOI` | Union Government company |
| `SGC` | State Government company |
| `PLC` | Public limited Indian non-government company |
| `PTC` | Private limited Indian non-government company |
| `FLC` | Public limited foreign company incorporated in India |
| `FTC` | Private limited foreign company incorporated in India |
| `ULL` | Unlimited liability — public |
| `ULT` | Unlimited liability — private |
| `GAP` | Guarantee and association — public |
| `GAT` | Guarantee and association — private |
| `NPL` | Section 25 company (historical terminology) |
| `OPC` | One Person Company — observed, pending broader MCA mapping confirmation |

Do not infer government ownership from the company name.
Do not expand `FLC` as any unrelated acronym.
Do not assume every Section 8 company has `NPL`.

#### ROC registration number

- Must be six ASCII digits.
- Store and display as a string.
- Preserve leading zeroes.
- This segment is a syntactic field only until an official lookup exists.

## 5. CIN error precedence

Report all segment errors that apply, but use this order:

1. Listing indicator
2. Industry code character type
3. State code
4. Incorporation year
5. Company classification
6. ROC registration number

For length or segment-layout failures, place the general length or layout
error first, then a list of segment errors where the segment boundaries
can be determined safely.

Do not report six separate errors for each character in a 21-character
CIN.

### CIN errors

| Error code | Condition | User-facing message |
|---|---|---|
| `CIN_LENGTH` | Trimmed value is not exactly 21 characters | `CIN must contain exactly 21 characters; found 18.` |
| `CIN_LISTING_INVALID` | Position 1 is not `L` or `U` | `Listing indicator must be L or U.` |
| `CIN_INDUSTRY_FORMAT` | Positions 2-6 are not five digits | `Industry code must contain exactly 5 digits.` |
| `CIN_STATE_FORMAT` | Positions 7-8 are not letters | `State code must contain exactly 2 letters.` |
| `CIN_STATE_UNRECOGNIZED` | State letters are syntactically valid but absent from the baseline mapping | `State code XX is not recognized in the local reference.` |
| `CIN_YEAR_FORMAT` | Positions 9-12 are not digits | `Incorporation year must contain exactly 4 digits.` |
| `CIN_YEAR_TOO_OLD` | Decoded year is earlier than 1857 | `Incorporation year 1849 is outside the supported range.` |
| `CIN_YEAR_IN_FUTURE` | Decoded year is later than the current year | `Incorporation year 2029 cannot be later than 2026.` |
| `CIN_TYPE_FORMAT` | Positions 13-15 are not letters | `Company classification code must contain exactly 3 letters.` |
| `CIN_TYPE_UNRECOGNIZED` | Classification letters are absent from the mapping | `Company type code ABC is not recognized.` |
| `CIN_ROC_FORMAT` | Positions 16-21 are not six digits | `ROC registration number must contain exactly 6 digits.` |
| `CIN_INDUSTRY_UNRECOGNIZED` | Industry code is absent from the maintained mapping | `Industry code 99999 is not recognized in the local reference.` |
| `CIN_INVALID_CHARACTERS` | Any characters outside the base layout are present | `CIN contains invalid characters. Use only letters and digits with no spaces or punctuation.` |

The `CIN_INDUSTRY_UNRECOGNIZED` and `CIN_STATE_UNRECOGNIZED` findings are
advisories during incomplete reference rollout. The identifier can retain
`valid_format: true` with `issues` and a visible "unrecognized component"
warning. `CIN_TYPE_UNRECOGNIZED` and structural errors set overall format
validation to invalid.

### CIN result copy

For a structurally valid CIN:

**Badge:** `Valid format`

**Detail:** `Decoded from the CIN structure. Not verified against MCA records.`

For a CIN with an unrecognized state or industry code:

**Badge:** `Valid structure — component not recognized`

**Detail:** `The layout is valid, but one or more reference components could not be decoded.`

For an invalid CIN:

**Badge:** `Invalid CIN`

## 6. LLPIN validation

### 6.1 Display format

A displayed LLPIN has exactly eight characters:

| Segment | Rule |
|---|---|
| Letters | Exactly three ASCII letters |
| Separator | Exactly one hyphen |
| Digits | Exactly four ASCII digits |

Regular expression:

```regex
^[A-Z]{3}-[0-9]{4}$
```

### 6.2 Optional normalization

An input matching `^[A-Z]{3}[0-9]{4}$` may be normalized to
`AAA-1234` and accepted.

- Preserve `originalInput`.
- Store `normalizedInput`.
- Show `LLPIN normalized from AAA1234 to AAA-1234` in the row details.
- Do not accept any other missing-punctuation form.

This behavior must be confirmed against the application's lookup source
if an MCA lookup is later added.

### 6.3 LLPIN result model

```ts
interface LlpinResult {
  originalInput: string;
  normalizedInput: string;
  entityType: "LLP";
  validationStatus: "valid_format" | "invalid_format";
  issues: ValidationIssue[];
  normalized: boolean;
  decoded: {
    listingStatus: null;
    state: null;
    yearOfIncorporation: null;
    companyType: null;
  };
}
```

The LLP fields `listingStatus`, `state`, `yearOfIncorporation`, and
`companyType` must be shown as **Not encoded in LLPIN**, not invented
or populated with guesses.

### 6.4 LLPIN errors

| Error code | Condition | User-facing message |
|---|---|---|
| `LLPIN_LENGTH` | Trimmed normalized candidate is not 7 or 8 characters | `LLPIN must contain 3 letters, a hyphen, and 4 digits, for example AAA-1234.` |
| `LLPIN_LETTERS_FORMAT` | Three-letter segment is missing or invalid | `LLPIN prefix must contain exactly 3 letters.` |
| `LLPIN_SEPARATOR_FORMAT` | Hyphen is missing or wrong | `LLPIN must use a hyphen in the format AAA-1234.` |
| `LLPIN_DIGITS_FORMAT` | Four-digit segment is missing or invalid | `LLPIN suffix must contain exactly 4 digits.` |
| `LLPIN_INVALID_CHARACTERS` | Characters outside letters, digits, and hyphen are present | `LLPIN contains invalid characters. Use letters, a hyphen, and digits only.` |

Error precedence:

1. Invalid characters
2. Hyphen/length layout
3. Prefix letters
4. Suffix digits

For `AAA-12X4`, return:
`LLPIN suffix must contain exactly 4 digits.`

For `AAA 1234`, return:
`LLPIN must use a hyphen in the format AAA-1234.`

For `ABC1234`, normalization is accepted as `ABC-1234`.

## 7. Unknown and malformed identifiers

When an input does not fit CIN or LLPIN layout:

**Badge:** `Unknown format`

**Message:** `Could not identify this as a CIN or LLPIN.`

**Detail:** `Use a 21-character CIN such as L17110MH1973PLC019786 or an LLPIN such as AAA-1234.`

Do not return only a generic "invalid" label. The row should explain
whether the likely issue is length, letters, digits, or separator.

## 8. Whitespace, case, and original input

Examples:

| User input | Normalized input | Result |
|---|---|---|
| ` l17110mh1973plc019786 ` | `L17110MH1973PLC019786` | Valid CIN format |
| `aaa1234` | `AAA-1234` | Valid LLPIN format; normalization shown |
| `AAA 1234` | `AAA 1234` | Invalid LLPIN separator |
| `AAA-123` | `AAA-123` | Invalid LLPIN length |

Display both original and normalized values when normalization occurs.
For whitespace-only input, treat the line as blank and ignore it.

## 9. Duplicate and 500-line behavior

- Blank lines do not count toward the 500-line limit.
- Duplicates count independently and remain in the results.
- Results retain original input line order.
- Display a compact summary:
  - Total lines
  - Valid format count
  - Invalid format count
  - LLP count
  - CIN count
- Do not re-sort rows by status.
- Long lists should remain readable with sticky table headers or clearly
  separated result cards on mobile.

Example summary:

```text
500 identifiers • 412 valid format • 88 invalid format • 325 CIN • 175 LLP
```

## 10. MCA verification boundary

No format-validation result may be described as:

- MCA verified
- Entity exists
- Active
- Listed status confirmed
- Official incorporation year
- Official state

Before MCA lookup is integrated, all CIN and LLPIN details derived only
from the identifier must include:

**Not verified against MCA records**

When MCA lookup is implemented, return separate statuses:

- `MCA_RECORD_MATCHED`
- `NO_MCA_RECORD_FOUND`
- `MCA_VERIFICATION_UNAVAILABLE`

The MCA lookup status must never overwrite format-validation status.
For example, a valid-format CIN with no matching MCA record should remain
`Valid format` and additionally show `No MCA record found`.

## 11. Implementation acceptance criteria

The validator is complete when:

- [ ] Every input line is validated independently.
- [ ] Original input and normalized input are preserved.
- [ ] CIN length and every CIN segment are checked in the specified precedence.
- [ ] LLPIN hyphenated format is checked.
- [ ] Unhyphenated LLPIN normalization is implemented if approved.
- [ ] Leading zeroes are preserved.
- [ ] State, classification, and other mappings are versioned separately.
- [ ] Unknown industry and state mappings are warnings, not invented data.
- [ ] Unknown classification codes invalidate component decoding.
- [ ] The UI handles empty input, unknown identifiers, and more than 500 lines.
- [ ] The UI is explicit that format validation is not MCA verification.

## 12. Test vectors

### CIN

| Input | Expected result |
|---|---|
| `L17110MH1973PLC019786` | Valid format; listed; Maharashtra; 1973; public limited Indian non-government company |
| `U17110KA2024PTC000001` | Valid format; unlisted; Karnataka; 2024; private limited Indian non-government company |
| `l17110mh1973plc019786` | Valid format after uppercase normalization |
| `L17110MH1849PLC019786` | Invalid year; earlier than supported range |
| `L17110XX1973PLC019786` | Valid layout but unknown state component |
| `L17110MH1973ABC019786` | Invalid/unknown company classification |
| `L17110MH1973PLC01978` | CIN length error |
| `X17110MH1973PLC019786` | Invalid listing indicator |
| `L1711!MH1973PLC019786` | Invalid industry format / invalid characters |

### LLPIN

| Input | Expected result |
|---|---|
| `AAA-1234` | Valid LLPIN format |
| `aaa1234` | Valid after normalization to `AAA-1234` |
| `AAA 1234` | Invalid separator |
| `AAA-12X4` | Invalid numeric suffix |
| `AA-1234` | Invalid prefix and length |
| `AAA-12345` | Invalid LLPIN length |

