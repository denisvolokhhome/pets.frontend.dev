import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';
import * as Papa from 'papaparse';
import { CsvParserService, CSV_HEADERS, RawCsvRow, ParseResult } from '../src/app/services/csv-parser.service';

/**
 * Property-based tests for CsvParserService using Playwright + fast-check.
 *
 * Since PapaParse's File-based parsing requires browser FileReader (unavailable in Node.js),
 * we replicate the parseFile logic using PapaParse's string parsing for round-trip and
 * row-count tests. The validation, sanitization, and template methods are tested directly.
 */

const service = new CsvParserService();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replicates CsvParserService.parseFile logic but accepts a CSV string instead
 * of a File object. Uses the same PapaParse config and validation pipeline.
 */
function parseString(csv: string): ParseResult {
  const results = Papa.parse<RawCsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const parseResult: ParseResult = { rows: [], errors: [] };

  if (results.errors.length > 0) {
    const fatalErrors = results.errors.filter(
      (e: any) => e.type === 'Delimiter' || e.type === 'FieldMismatch'
    );
    if (fatalErrors.length > 0 && results.data.length === 0) {
      parseResult.errors.push('The file is not a valid CSV');
      return parseResult;
    }
  }

  const actualHeaders = results.meta.fields || [];
  const missingHeaders = CSV_HEADERS.filter((h) => !actualHeaders.includes(h));
  if (missingHeaders.length > 0) {
    parseResult.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    return parseResult;
  }

  let rowIndex = 0;
  for (const rawRow of results.data) {
    rowIndex++;
    const values = Object.values(rawRow);
    if (values.every((v) => !v || (v as string).trim() === '')) continue;

    const validation = service.validateRow(rawRow, rowIndex);

    const row: any = {
      rowNumber: rowIndex,
      name: service.sanitizeField(rawRow['name'] || '').trim(),
      breed: rawRow['breed'] ? service.sanitizeField(rawRow['breed']).trim() : undefined,
      gender: rawRow['gender'] ? service.sanitizeField(rawRow['gender']).trim() : undefined,
      dateOfBirth: rawRow['date_of_birth'] ? service.sanitizeField(rawRow['date_of_birth']).trim() : undefined,
      weight:
        rawRow['weight'] && rawRow['weight'].trim() !== ''
          ? parseFloat(rawRow['weight'].trim())
          : undefined,
      description: rawRow['description'] ? service.sanitizeField(rawRow['description']).trim() : undefined,
      location: rawRow['location'] ? service.sanitizeField(rawRow['location']).trim() : undefined,
      microchip: rawRow['microchip'] ? service.sanitizeField(rawRow['microchip']).trim() : undefined,
      vaccination: rawRow['vaccination'] ? service.sanitizeField(rawRow['vaccination']).trim() : undefined,
      healthCertificate: rawRow['health_certificate']
        ? service.sanitizeField(rawRow['health_certificate']).trim()
        : undefined,
      deworming: rawRow['deworming'] ? service.sanitizeField(rawRow['deworming']).trim() : undefined,
      birthCertificate: rawRow['birth_certificate']
        ? service.sanitizeField(rawRow['birth_certificate']).trim()
        : undefined,
      isValid: validation.isValid,
      errors: validation.errors,
      willBeImported: validation.isValid,
    };

    if (row.weight !== undefined && isNaN(row.weight)) {
      row.weight = undefined;
    }

    parseResult.rows.push(row);
  }

  return parseResult;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Safe CSV string that won't break parsing or get stripped by sanitizeField. */
const safeCsvString = (minLen = 1, maxLen = 40): fc.Arbitrary<string> =>
  fc
    .stringMatching(new RegExp(`^[A-Za-z0-9 .!?:;_/()]{${minLen},${maxLen}}$`))
    .filter((s) => s.trim().length > 0);

/** Valid YYYY-MM-DD date string (day capped at 28 to avoid invalid combos). */
const validDateArb = fc
  .record({
    year: fc.integer({ min: 2000, max: 2025 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(({ year, month, day }) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

/** Non-negative weight with up to 2 decimal places. */
const weightArb = fc
  .float({ min: Math.fround(0.01), max: Math.fround(999), noNaN: true })
  .filter((w) => isFinite(w) && w > 0)
  .map((w) => Math.round(w * 100) / 100);

const genderArb = fc.constantFrom('Male', 'Female');

/** A complete valid pet record (all fields populated with safe values). */
type PetRecord = Record<(typeof CSV_HEADERS)[number], string>;

const petRecordArb: fc.Arbitrary<PetRecord> = fc.record({
  name: safeCsvString(1, 25),
  breed: safeCsvString(1, 25),
  gender: genderArb,
  date_of_birth: validDateArb,
  weight: weightArb.map(String),
  description: safeCsvString(1, 40),
  location: safeCsvString(1, 25),
  microchip: safeCsvString(1, 15),
  vaccination: safeCsvString(1, 25),
  health_certificate: safeCsvString(1, 25),
  deworming: safeCsvString(1, 25),
  birth_certificate: safeCsvString(1, 25),
}) as fc.Arbitrary<PetRecord>;

/** Serialize pet records to a CSV string with the standard headers. */
function serializeToCsv(records: PetRecord[]): string {
  const header = CSV_HEADERS.join(',');
  const rows = records.map((r) => CSV_HEADERS.map((h) => r[h]).join(','));
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Property 1: CSV serialization round-trip
// ---------------------------------------------------------------------------

test.describe('Feature: csv-pet-import, Property 1: CSV serialization round-trip', () => {
  /**
   * **Validates: Requirements 7.1, 7.3**
   *
   * For any valid set of pet data objects, serializing them to CSV format
   * using the template columns and then parsing the resulting CSV string back
   * should produce an equivalent set of pet data objects (field values preserved,
   * field count preserved).
   */
  test('should preserve field values when serializing to CSV and parsing back', () => {
    fc.assert(
      fc.property(
        fc.array(petRecordArb, { minLength: 1, maxLength: 10 }),
        (records) => {
          const csvString = serializeToCsv(records);
          const result = parseString(csvString);

          // No parse-level errors
          expect(result.errors).toHaveLength(0);

          // Row count preserved
          expect(result.rows).toHaveLength(records.length);

          // Field values preserved for each row
          for (let i = 0; i < records.length; i++) {
            const original = records[i];
            const parsed = result.rows[i];

            expect(parsed.name).toBe(original.name.trim());
            expect(parsed.breed).toBe(original.breed.trim());
            expect(parsed.gender).toBe(original.gender.trim());
            expect(parsed.dateOfBirth).toBe(original.date_of_birth.trim());
            expect(parsed.weight).toBe(parseFloat(original.weight));
            expect(parsed.description).toBe(original.description.trim());
            expect(parsed.location).toBe(original.location.trim());
            expect(parsed.microchip).toBe(original.microchip.trim());
            expect(parsed.vaccination).toBe(original.vaccination.trim());
            expect(parsed.healthCertificate).toBe(original.health_certificate.trim());
            expect(parsed.deworming).toBe(original.deworming.trim());
            expect(parsed.birthCertificate).toBe(original.birth_certificate.trim());
          }

          // Field count: CSV_HEADERS has 12 columns
          expect(CSV_HEADERS).toHaveLength(12);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Row count invariant
// ---------------------------------------------------------------------------

test.describe('Feature: csv-pet-import, Property 2: Row count invariant', () => {
  /**
   * **Validates: Requirements 7.2, 3.8**
   *
   * For any CSV string with valid headers and N non-empty data rows
   * (possibly interspersed with empty rows), the CSV parser shall produce
   * exactly N parsed pet objects.
   */
  test('should produce exactly N parsed objects for N non-empty data rows', () => {
    /** Generate a single non-empty CSV data row as a string. */
    const nonEmptyRowArb = petRecordArb.map((r) => CSV_HEADERS.map((h) => r[h]).join(','));

    /** An empty row (all commas, no values). */
    const emptyRow = CSV_HEADERS.map(() => '').join(',');

    fc.assert(
      fc.property(
        fc.array(nonEmptyRowArb, { minLength: 1, maxLength: 15 }),
        fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 0, maxLength: 5 }),
        (dataRows, emptyInsertPositions) => {
          // Build CSV: header + data rows with some empty rows interspersed
          const header = CSV_HEADERS.join(',');
          const allRows = [...dataRows];

          // Insert empty rows at random positions
          for (const pos of emptyInsertPositions) {
            const insertAt = Math.min(pos, allRows.length);
            allRows.splice(insertAt, 0, emptyRow);
          }

          const csvString = [header, ...allRows].join('\n');
          const result = parseString(csvString);

          // No parse-level errors
          expect(result.errors).toHaveLength(0);

          // Exactly N non-empty rows parsed
          expect(result.rows).toHaveLength(dataRows.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ---------------------------------------------------------------------------
// Property 3: Field validation correctness
// ---------------------------------------------------------------------------

test.describe('Feature: csv-pet-import, Property 3: Field validation correctness', () => {
  /**
   * **Validates: Requirements 3.4, 3.5, 3.6, 3.7**
   *
   * For any CSV row, the validator shall flag the row as invalid if and only if:
   * - the name field is empty/missing, OR
   * - the gender value is not "Male"/"Female" (case-insensitive) when provided, OR
   * - the date_of_birth is not a valid YYYY-MM-DD date when provided, OR
   * - the weight is not a non-negative number when provided.
   */

  test('valid rows should produce no validation errors', () => {
    const validRowArb = fc.record({
      name: safeCsvString(1, 25),
      breed: safeCsvString(1, 25),
      gender: genderArb,
      date_of_birth: validDateArb,
      weight: weightArb.map(String),
      description: safeCsvString(1, 30),
      location: safeCsvString(1, 25),
      microchip: safeCsvString(1, 15),
      vaccination: safeCsvString(1, 25),
      health_certificate: safeCsvString(1, 25),
      deworming: safeCsvString(1, 25),
      birth_certificate: safeCsvString(1, 25),
    });

    fc.assert(
      fc.property(validRowArb, fc.integer({ min: 1, max: 500 }), (row, rowIndex) => {
        const result = service.validateRow(row as RawCsvRow, rowIndex);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  test('rows with empty name should be flagged as invalid', () => {
    const emptyNameArb = fc.constantFrom('', '   ', '\t');

    fc.assert(
      fc.property(emptyNameArb, fc.integer({ min: 1, max: 500 }), (emptyName, rowIndex) => {
        const row: RawCsvRow = {
          name: emptyName,
          breed: 'Labrador',
          gender: 'Male',
          date_of_birth: '2023-01-15',
          weight: '10',
          description: 'A dog',
          location: 'Kennel',
          microchip: '123',
          vaccination: 'Done',
          health_certificate: 'Valid',
          deworming: 'Done',
          birth_certificate: 'Available',
        };
        const result = service.validateRow(row, rowIndex);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('Name is required'))).toBe(true);
        expect(result.errors.some((e) => e.includes(`Row ${rowIndex}`))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('rows with invalid gender should be flagged', () => {
    const invalidGenderArb = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => !['male', 'female', ''].includes(s.trim().toLowerCase()));

    fc.assert(
      fc.property(invalidGenderArb, fc.integer({ min: 1, max: 500 }), (badGender, rowIndex) => {
        const row: RawCsvRow = {
          name: 'Buddy',
          breed: 'Labrador',
          gender: badGender,
          date_of_birth: '2023-01-15',
          weight: '10',
          description: 'A dog',
          location: 'Kennel',
          microchip: '123',
          vaccination: 'Done',
          health_certificate: 'Valid',
          deworming: 'Done',
          birth_certificate: 'Available',
        };
        const result = service.validateRow(row, rowIndex);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('Gender must be'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('rows with invalid date_of_birth should be flagged', () => {
    const invalidDateArb = fc.oneof(
      // Wrong format
      fc.constantFrom('2023/01/15', '01-15-2023', '15-01-2023', 'not-a-date', '2023-13-01', '2023-02-30'),
      // Random non-date strings
      fc
        .string({ minLength: 1, maxLength: 15 })
        .filter((s) => s.trim().length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(s.trim()))
    );

    fc.assert(
      fc.property(invalidDateArb, fc.integer({ min: 1, max: 500 }), (badDate, rowIndex) => {
        const row: RawCsvRow = {
          name: 'Buddy',
          breed: 'Labrador',
          gender: 'Male',
          date_of_birth: badDate,
          weight: '10',
          description: 'A dog',
          location: 'Kennel',
          microchip: '123',
          vaccination: 'Done',
          health_certificate: 'Valid',
          deworming: 'Done',
          birth_certificate: 'Available',
        };
        const result = service.validateRow(row, rowIndex);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('Date of birth must be'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  test('rows with invalid weight should be flagged', () => {
    const invalidWeightArb = fc.oneof(
      // Strings that parseFloat returns NaN for
      fc.constantFrom('abc', 'NaN', 'not_a_number', 'xyz', '!@#'),
      // Negative numbers
      fc
        .float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true })
        .filter((w) => isFinite(w))
        .map(String)
    );

    fc.assert(
      fc.property(invalidWeightArb, fc.integer({ min: 1, max: 500 }), (badWeight, rowIndex) => {
        const row: RawCsvRow = {
          name: 'Buddy',
          breed: 'Labrador',
          gender: 'Male',
          date_of_birth: '2023-01-15',
          weight: badWeight,
          description: 'A dog',
          location: 'Kennel',
          microchip: '123',
          vaccination: 'Done',
          health_certificate: 'Valid',
          deworming: 'Done',
          birth_certificate: 'Available',
        };
        const result = service.validateRow(row, rowIndex);
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('Weight must be'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Header validation
// ---------------------------------------------------------------------------

test.describe('Feature: csv-pet-import, Property 4: Header validation', () => {
  /**
   * **Validates: Requirements 3.3**
   *
   * For any CSV string where one or more required column headers are missing,
   * the parser shall produce a descriptive error message identifying the missing
   * columns, and shall not produce any parsed rows.
   */
  test('CSV with missing headers should produce error and no parsed rows', () => {
    // Generate a non-empty subset of headers to remove
    const headerSubsetArb = fc
      .subarray([...CSV_HEADERS], { minLength: 1, maxLength: CSV_HEADERS.length })
      .filter((arr) => arr.length > 0 && arr.length < CSV_HEADERS.length);

    fc.assert(
      fc.property(headerSubsetArb, (headersToRemove) => {
        const remainingHeaders = CSV_HEADERS.filter((h) => !headersToRemove.includes(h));
        const headerLine = remainingHeaders.join(',');
        const dataRow = remainingHeaders.map(() => 'value').join(',');
        const csvString = `${headerLine}\n${dataRow}`;

        const result = parseString(csvString);

        // Should have error about missing columns
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('Missing required columns');

        // Each missing header should be mentioned in the error
        for (const missing of headersToRemove) {
          expect(result.errors[0]).toContain(missing);
        }

        // No parsed rows
        expect(result.rows).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Template contains breeder reference data
// ---------------------------------------------------------------------------

test.describe('Feature: csv-pet-import, Property 9: Template contains breeder reference data', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * For any non-empty list of breed names and location names, the generated
   * CSV template output shall contain every breed name and every location name
   * from the input lists.
   */
  test('generated template should contain all breed and location names', () => {
    const breedArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: safeCsvString(2, 30),
      kind: fc.constantFrom('dog' as const, 'cat' as const, 'cow' as const, 'horse' as const),
      created_at: fc.constant('2024-01-01T00:00:00Z'),
    });

    const locationArb = fc.record({
      name: safeCsvString(2, 30),
      address1: fc.constant('123 Main St'),
      city: fc.constant('Anytown'),
      state: fc.constant('CA'),
      country: fc.constant('US'),
      zipcode: fc.constant('90210'),
      location_type: fc.constant('kennel'),
      created_at: fc.constant('2024-01-01T00:00:00Z'),
    });

    fc.assert(
      fc.property(
        fc.array(breedArb, { minLength: 1, maxLength: 10 }),
        fc.array(locationArb, { minLength: 1, maxLength: 10 }),
        (breeds, locations) => {
          const template = service.generateTemplate(breeds as any[], locations as any[]);

          // Every breed name should appear in the template
          for (const breed of breeds) {
            expect(template).toContain(breed.name);
          }

          // Every location name should appear in the template
          for (const loc of locations) {
            expect(template).toContain(loc.name);
          }

          // Template should contain the standard headers
          for (const header of CSV_HEADERS) {
            expect(template).toContain(header);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
