# Indian CIN and LLPIN Format Reference

**Project:** FileSure CIN / LLPIN Checker\
**Document type:** Research and implementation reference\
**Status:** Draft for review\
**Last reviewed:** 24 November 2026

------------------------------------------------------------------------

## 1. Purpose

This document describes the structure of an Indian Corporate Identity
Number (CIN) and a Limited Liability Partnership Identification Number
(LLPIN). It is intended to guide the format-validation component of the
FileSure checker.

The checker must distinguish between:

1.  **Format validation** --- whether an input follows the expected
    identifier structure and uses recognized component values.
2.  **Official-record verification** --- whether the identifier matches
    an actual company or LLP record held by the Ministry of Corporate
    Affairs (MCA).

A structurally valid identifier is **not proof that the company or LLP
exists, is active, or has the decoded details shown by the identifier**.
Those claims require an official-record lookup.

This document records the general structures supported by the references
listed in [Section 8](#8-sources-and-research-notes). It does not claim
to be an exhaustive MCA technical specification for every historical
identifier or code.

## 2. Corporate Identity Number (CIN)

A CIN is a 21-character alphanumeric identifier assigned to a company
registered in India.

### 2.1 Overall structure

The general structure is:

``` text
L NNNNN SS YYYY CCC NNNNNN
```

Where:

  ---------------------------------------------------------------------------
  Component                   Positions               Length Meaning
  ---------------- -------------------- -------------------- ----------------
  Listing                             1                    1 Listed or
  indicator                                                  unlisted
                                                             indicator

  Industry code                    2--6                    5 Industry /
                                                             economic
                                                             activity code

  State code                       7--8                    2 State associated
                                                             with the
                                                             company's
                                                             registered
                                                             office

  Incorporation                   9--12                    4 Calendar year of
  year                                                       incorporation

  Ownership /                    13--15                    3 Company
  company                                                    classification
  classification                                             code
  code                                                       

  ROC registration               16--21                    6 Registrar of
  number                                                     Companies
                                                             registration
                                                             number
  ---------------------------------------------------------------------------

Total: **21 characters**.

Example supplied in the assignment:

``` text
L17110MH1973PLC019786
```

Breakdown:

  Value      Interpretation
  ---------- -------------------------------------------------------------
  `L`        Listed indicator
  `17110`    Industry code
  `MH`       Maharashtra state code
  `1973`     Year of incorporation
  `PLC`      Public limited Indian non-government company classification
  `019786`   Six-character ROC registration number

The example illustrates the structure. A format check alone does not
establish that this particular identifier is currently registered or
that its master-data record is active.

### 2.2 Component rules

#### A. Listing indicator --- position 1

The general CIN convention documented in the references is:

  Character   Meaning
  ----------- ----------
  `L`         Listed
  `U`         Unlisted

Format rule: - Exactly one character. - The character must be `L` or `U`
for this standard CIN pattern.

The listing indicator and the company classification code are separate
fields. For example, `L` does not mean "public limited"; that
information is represented separately in the three-character
classification segment.

#### B. Industry code --- positions 2--6

Format rule: - Exactly five numeric digits. - The CIN industry segment
is described in the cited references as being based on NIC-2004.

Validation note: - A five-digit numeric value is only a **syntactic**
match. - To validate whether a code is recognized, use a maintained
industry-code reference dataset with its source and version recorded. -
Do not assume that every possible five-digit number is an assigned
industry code. - Do not silently substitute a newer NIC classification
for the historical classification referenced by the CIN material.

#### C. State code --- positions 7--8

Format rule: - Exactly two alphabetic characters. - The code identifies
the state associated with the company's registered office in the CIN
structure. - Store and compare codes in uppercase.

Examples commonly encountered include:

  Code   State / territory
  ------ -------------------
  `MH`   Maharashtra
  `KA`   Karnataka
  `DL`   Delhi
  `TN`   Tamil Nadu
  `GJ`   Gujarat
  `AP`   Andhra Pradesh
  `TS`   Telangana
  `KL`   Kerala
  `UP`   Uttar Pradesh
  `WB`   West Bengal

This is an illustrative list, **not a complete authoritative mapping**.
Before enforcing a state-code allowlist, compile and verify a complete
mapping against MCA records and account for historical state and
territory names/codes. Do not reject a historical identifier solely
because a simplified current-state list does not contain its code.

#### D. Incorporation year --- positions 9--12

Format rule: - Exactly four numeric digits. - Represents the calendar
year of incorporation.

Validation note: - A four-digit value can pass the character check
without being a plausible or correct incorporation year. - A production
validator should check plausibility and, where possible, compare the
year with the official MCA record. - Do not treat a year extracted from
a CIN as proof of the exact incorporation date.

#### E. Ownership / company classification code --- positions 13--15

This three-character segment represents the company's classification /
ownership category.

The cited government survey manual documents the following codes:

  -----------------------------------------------------------------------
  Code                                Meaning in the cited reference
  ----------------------------------- -----------------------------------
  `GOI`                               Union Government company

  `SGC`                               State Government company

  `PLC`                               Public limited Indian
                                      non-government company

  `PTC`                               Private limited Indian
                                      non-government company

  `FLC`                               Public limited foreign company
                                      incorporated in India

  `FTC`                               Private limited foreign company
                                      incorporated in India

  `ULL`                               Unlimited liability --- public

  `ULT`                               Unlimited liability --- private

  `GAP`                               Guarantee and association ---
                                      public

  `GAT`                               Guarantee and association ---
                                      private

  `NPL`                               Section 25 company (historical
                                      terminology in the cited reference)
  -----------------------------------------------------------------------

Important notes: - This is a documented list from the cited reference,
not a guarantee that it covers every code used in all periods. - `PLC`
and `PTC` are not the only possible classification values. - `GOI` and
`SGC` describe government-company categories in the cited table. - Do
not infer government ownership from the company name. - One Person
Company (OPC) is a company category under the Companies Act, 2013.
Confirm the exact CIN representation and its applicability against
current MCA examples/master data before adding an `OPC` code to a strict
allowlist. - Keep the source, meaning, effective period (if known), and
verification status for each code in the project's reference data.

#### F. ROC registration number --- positions 16--21

Format rule: - Exactly six numeric digits. - Preserve leading zeroes. -
Treat this segment as a string, not a number.

The cited references describe this as the ROC-wise registration number /
number assigned by the Registrar of Companies.

Example:

``` text
019786
```

Do not convert this value to the integer `19786`, because doing so loses
the original six-character representation.

### 2.3 CIN regular expression

The following regular expression checks the **basic character layout
only**:

``` regex
^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$
```

It checks: - `L` or `U` in position 1; - five digits in positions
2--6; - two uppercase letters in positions 7--8; - four digits in
positions 9--12; - three uppercase letters in positions 13--15; - six
digits in positions 16--21.

It does **not** check: - whether the industry code is assigned; -
whether the state code is recognized or historically applicable; -
whether the year is plausible; - whether the classification code is
valid for the relevant period; - whether the ROC registration number
exists; - whether the CIN belongs to a real company; - whether the
company is active or currently listed.

A successful regular-expression match must therefore be reported as a
**structural format match**, not as confirmation of company existence.

## 3. Limited Liability Partnership Identification Number (LLPIN)

An LLPIN identifies a Limited Liability Partnership registered under the
LLP framework.

The assignment gives this example:

``` text
AAA-1234
```

The common displayed pattern used for the assignment is:

``` text
LLL-NNNN
```

Where: - `LLL` is a three-letter alphabetic segment; - `-` is a hyphen
separator; - `NNNN` is a four-digit numeric segment.

### 3.1 Basic format rule

  Component            Expected form        Length
  -------------------- ------------------ --------
  Alphabetic segment   Letters `A`--`Z`          3
  Separator            Hyphen `-`                1
  Numeric segment      Digits `0`--`9`           4
  Total                `AAA-1234`                8

Example:

``` text
AAB-4321
```

### 3.2 LLPIN regular expression

For the hyphenated representation:

``` regex
^[A-Z]{3}-[0-9]{4}$
```

This checks the three-letter, hyphen, four-digit layout. It does not
establish that the LLPIN has actually been allotted by MCA.

### 3.3 Input without a hyphen

Some systems or datasets may present an LLPIN without its display
hyphen. If the project chooses to support this input form, treat it as
an explicit input-normalization feature rather than silently changing
the definition of the standard displayed format.

Suggested optional normalization:

``` text
Input:      AAA1234
Normalized: AAA-1234
```

Only normalize when the input contains exactly three letters followed by
four digits and no other characters. Preserve the original input so the
result can show what the user supplied.

The hyphenated pattern is the default display format for this project.
Confirm accepted variants against the intended MCA lookup/data source
before treating unhyphenated values as officially equivalent.

### 3.4 What can be decoded from an LLPIN?

Do not apply the CIN parser to an LLPIN.

The LLPIN format described above does not provide the CIN-style segments
for listing status, state, incorporation year, industry code, or company
classification.

For a format-only result, use:

  Requested field      LLPIN-only result
  -------------------- -----------------------------------------
  Entity type          LLP
  Listing status       Not encoded / not applicable
  State                Not encoded in the LLPIN
  Incorporation year   Not encoded in the LLPIN
  Company type         Not applicable --- the entity is an LLP
  Identifier           The complete LLPIN

To show the LLP's registered office, incorporation date, current status,
or other master-data fields, perform an official MCA LLP master-data
lookup. Do not infer those fields from the letters or digits in the
LLPIN.

The Limited Liability Partnership Rules, 2009 describe LLPIN allocation
as a consecutive series. The cited rule does not provide a public
decoding table equivalent to the CIN's component structure.

## 4. Input handling recommendations

These are application-level recommendations, not additional official
identifier rules.

1.  Preserve the original line entered by the user.
2.  Trim leading and trailing whitespace before parsing.
3.  Convert alphabetic characters to uppercase for case-insensitive
    input handling.
4.  Ignore blank lines when splitting bulk input.
5.  Do not remove internal characters or punctuation indiscriminately.
6.  Preserve leading zeroes in numeric segments.
7.  Keep each input line as an independent result.
8.  Decide and document how duplicate identifiers are handled; do not
    silently discard them.
9.  Place a documented limit on bulk input and handle the assignment's
    500-line test case.
10. Never label a format-only result as an official MCA verification.

## 5. Recommended validation stages

Use separate stages so the application can explain precisely what
failed.

### Stage 1 --- Identify the identifier type

-   If the input matches the basic CIN character layout, send it to the
    CIN component validator.
-   If it matches the LLPIN pattern, send it to the LLPIN validator.
-   Otherwise, return an unknown / malformed identifier result.

Do not decide that an identifier is a CIN merely because it has 21
characters.

### Stage 2 --- Check structural layout

For CIN: - Check total length. - Check each segment's character type and
position.

For LLPIN: - Check the three-letter segment. - Check the hyphen. - Check
the four-digit segment.

### Stage 3 --- Validate reference values

For CIN: - Check the state code against a versioned state-code
reference. - Check the industry code against a versioned industry-code
reference. - Check the classification code against a versioned
classification reference. - Apply historical compatibility rules only
when supported by evidence.

For LLPIN: - Check the format. - Do not invent state, year, or
classification decoding rules.

### Stage 4 --- Official record verification (separate feature)

If an official and reliable MCA lookup/data source is integrated: -
Check whether the identifier returns a matching record. - Display
record-derived fields separately from identifier-decoded fields. - Show
the source and, where available, the date of retrieval. - Handle
no-match, unavailable service, CAPTCHA, and lookup errors separately.

If no official lookup is integrated, clearly label the result as format
validation only.

## 6. Suggested result terminology

Use precise labels in the user interface.

  -----------------------------------------------------------------------
  Situation                           Suggested label
  ----------------------------------- -----------------------------------
  Correct character layout and        Format valid
  recognized components               

  Character layout is incorrect       Invalid format

  Layout is correct but a component   Unrecognized component
  is unrecognized                     

  Format passes but no official       Not verified against MCA
  lookup was performed                

  Official lookup finds a matching    MCA record matched
  record                              

  Official lookup returns no matching No matching MCA record found
  record                              

  Official lookup cannot be completed MCA verification unavailable
  -----------------------------------------------------------------------

Avoid a single ambiguous green "Verified" badge for a regular-expression
match.

## 7. Items requiring confirmation before strict implementation

The following should be treated as research tasks rather than assumed
facts:

-   A complete CIN state-code mapping, including historical codes and
    changes.
-   A complete NIC-2004 industry-code list appropriate to the CIN data.
-   A complete and time-aware list of three-character company
    classification codes.
-   The exact representation and historical applicability of OPC-related
    CIN codes.
-   Whether the chosen MCA source accepts LLPINs with and without a
    hyphen.
-   The exact semantics of any historical or unusual CIN values.
-   The availability, access conditions, and permitted use of an
    official MCA lookup or dataset.

For each reference mapping in code, record its source, retrieval date,
version/effective period if known, and any limitations. Do not create an
allowlist from examples alone.

## 8. Sources and research notes

The following sources were consulted to prepare this reference. Prefer
MCA records and government publications when validating actual
identifiers. Some sources explain the structure; they should not all be
treated as current technical specifications.

### Primary / government sources

1.  **Ministry of Corporate Affairs --- Corporate Data Management
    portal**\
    https://www.mcacdm.nic.in/company-master-details\
    Provides Company Master Details and LLP Master Data sections. Useful
    for checking actual records and comparing decoded fields with MCA
    data.

2.  **MCA21 Application --- Online Help, Master Data Services**\
    https://www.mca.gov.in/MCA21/dca/WebHelp/Help_MCA21_English.pdf\
    Explains that company or LLP master data can be searched using
    CIN/FCRN/LLPIN/FLLPIN and describes MCA master data as information
    stored in the MCA database based on filed e-forms.

3.  **MCA --- LLP e-Filing**\
    https://www.mca.gov.in/content/mca/global/en/mca/llp-e-filling.html\
    Official portal for LLP filing services and forms.

4.  **MCA --- LLP Form 11 / FiLLiP FAQ**\
    https://www.mca.gov.in/content/dam/mca/pdf/Updated_FAQ_FORM11_Fillip_Login.pdf\
    Shows LLPIN as an identification field used to retrieve/pre-fill LLP
    details in the filing process.

5.  **Government of India --- Annual Survey of Industries Instruction
    Manual, 2016--17**\
    https://descg.gov.in/pdf/asi/manual/ASI_Instruction_Manual_2016-17.PDF\
    Contains a CIN structure table: listing status, five-digit NIC-2004
    industry code, two-character state code, four-digit incorporation
    year, three-character ownership code, and six-digit ROC registration
    number. It also lists several ownership codes. This is a government
    survey manual and should be read with its historical context.

6.  **Reserve Bank of India --- Report on Trend and Progress of Banking
    in India / publication material**\
    https://www.rbi.org.in/scripts/PublicationReportDetails.aspx?ID=542\
    Describes the 21-digit CIN and its listing, industry, state,
    incorporation-year, classification, and ROC registration components.
    It refers to NIC-2004.

7.  **India Code --- Central legislation portal**\
    https://www.indiacode.nic.in/\
    Use this to consult the Limited Liability Partnership Act, 2008, the
    Companies Act, 2013, and related legislation/rules.

### Additional format reference

8.  **National Single Window System (NSWS) user guidance**\
    https://www.nsws.gov.in/\
    Consult the relevant user guide for examples of registration
    identifiers. Treat examples as corroboration, not as a substitute
    for MCA master data or legislation.

### Research caution

The CIN segment structure is documented by the government and RBI
sources above. The LLPIN hyphenated pattern is used in the assignment
example and in registration-identifier guidance, but the LLP rules'
consecutive-series provision does not itself define a
character-by-character semantic breakdown. Do not infer hidden LLPIN
fields.

------------------------------------------------------------------------

## 9. Implementation summary

### CIN

``` regex
^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$
```

21 characters: - 1 listing indicator - 5 industry digits - 2 state
letters - 4 year digits - 3 classification letters - 6 ROC registration
digits

### LLPIN

``` regex
^[A-Z]{3}-[0-9]{4}$
```

8 characters in the displayed format: - 3 letters - 1 hyphen - 4 digits

**Final principle:** Parse only what the identifier actually encodes.
Use official MCA data to verify existence and retrieve facts that are
not encoded in the identifier.
