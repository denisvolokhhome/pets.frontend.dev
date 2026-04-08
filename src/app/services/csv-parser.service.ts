import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import { IBreed } from '../models/breed';
import { ILocation } from '../models/location';
import { ParsedPetRow } from '../models/pet-import.model';

/** Expected CSV column headers in order. */
export const CSV_HEADERS = [
  'name', 'breed', 'gender', 'date_of_birth', 'weight', 'description',
  'location', 'microchip', 'vaccination', 'health_certificate', 'deworming', 'birth_certificate'
] as const;

/** Maximum file size in bytes (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Result of parsing a CSV file. */
export interface ParseResult {
  rows: ParsedPetRow[];
  errors: string[];
}

/** Result of validating a single row. */
export interface RowValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Raw CSV row as string key-value pairs from PapaParse. */
export interface RawCsvRow {
  [key: string]: string;
}

@Injectable({ providedIn: 'root' })
export class CsvParserService {

  /**
   * Generate a CSV template string with headers, an example row,
   * and reference comments listing available breeds and locations.
   */
  generateTemplate(breeds: IBreed[], locations: ILocation[]): string {
    const headers = CSV_HEADERS.join(',');
    const exampleRow = 'Max,Golden Retriever,Male,2023-01-15,25.5,Friendly dog,Main Kennel,123456789012345,Up to date,Valid,Completed,Available';

    const breedNames = breeds.map(b => b.name).join(', ');
    const locationNames = locations.map(l => l.name).join(', ');

    const lines = [
      headers,
      exampleRow,
      '',
      `# Available breeds: ${breedNames}`,
      `# Available locations: ${locationNames}`
    ];

    return lines.join('\n');
  }

  /**
   * Parse a CSV file: validate size, parse with PapaParse, validate headers,
   * then validate each row. Empty rows are silently skipped.
   */
  parseFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
      // Validate file size (5 MB limit)
      if (file.size > MAX_FILE_SIZE) {
        resolve({ rows: [], errors: ['File size exceeds 5MB limit'] });
        return;
      }

      Papa.parse<RawCsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parseResult: ParseResult = { rows: [], errors: [] };

          // Check for PapaParse-level errors
          if (results.errors.length > 0) {
            const fatalErrors = results.errors.filter(e => e.type === 'Delimiter' || e.type === 'FieldMismatch');
            if (fatalErrors.length > 0 && results.data.length === 0) {
              parseResult.errors.push('The file is not a valid CSV');
              resolve(parseResult);
              return;
            }
          }

          // Validate headers
          const actualHeaders = results.meta.fields || [];
          const missingHeaders = CSV_HEADERS.filter(h => !actualHeaders.includes(h));
          if (missingHeaders.length > 0) {
            parseResult.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
            resolve(parseResult);
            return;
          }

          // Parse and validate each row
          let rowIndex = 0;
          for (const rawRow of results.data) {
            rowIndex++;

            // Skip empty rows (all values empty or whitespace)
            const values = Object.values(rawRow);
            if (values.every(v => !v || v.trim() === '')) {
              continue;
            }

            const validation = this.validateRow(rawRow, rowIndex);

            const row: ParsedPetRow = {
              rowNumber: rowIndex,
              name: this.sanitizeField(rawRow['name'] || '').trim(),
              breed: rawRow['breed'] ? this.sanitizeField(rawRow['breed']).trim() : undefined,
              gender: rawRow['gender'] ? this.sanitizeField(rawRow['gender']).trim() : undefined,
              dateOfBirth: rawRow['date_of_birth'] ? this.sanitizeField(rawRow['date_of_birth']).trim() : undefined,
              weight: rawRow['weight'] && rawRow['weight'].trim() !== ''
                ? parseFloat(rawRow['weight'].trim())
                : undefined,
              description: rawRow['description'] ? this.sanitizeField(rawRow['description']).trim() : undefined,
              location: rawRow['location'] ? this.sanitizeField(rawRow['location']).trim() : undefined,
              microchip: rawRow['microchip'] ? this.sanitizeField(rawRow['microchip']).trim() : undefined,
              vaccination: rawRow['vaccination'] ? this.sanitizeField(rawRow['vaccination']).trim() : undefined,
              healthCertificate: rawRow['health_certificate'] ? this.sanitizeField(rawRow['health_certificate']).trim() : undefined,
              deworming: rawRow['deworming'] ? this.sanitizeField(rawRow['deworming']).trim() : undefined,
              birthCertificate: rawRow['birth_certificate'] ? this.sanitizeField(rawRow['birth_certificate']).trim() : undefined,
              isValid: validation.isValid,
              errors: validation.errors,
              willBeImported: validation.isValid
            };

            // Ensure NaN weights are treated as undefined
            if (row.weight !== undefined && isNaN(row.weight)) {
              row.weight = undefined;
            }

            parseResult.rows.push(row);
          }

          resolve(parseResult);
        },
        error: () => {
          resolve({ rows: [], errors: ['Failed to parse the CSV file'] });
        }
      });
    });
  }

  /**
   * Validate a single raw CSV row. Returns whether the row is valid
   * and any error messages.
   */
  validateRow(row: RawCsvRow, rowIndex: number): RowValidationResult {
    const errors: string[] = [];

    // name: required, non-empty after trim
    const name = (row['name'] || '').trim();
    if (!name) {
      errors.push(`Row ${rowIndex}: Name is required`);
    }

    // gender: must be "Male" or "Female" (case-insensitive) if provided
    const gender = (row['gender'] || '').trim();
    if (gender && !['male', 'female'].includes(gender.toLowerCase())) {
      errors.push(`Row ${rowIndex}: Gender must be "Male" or "Female"`);
    }

    // date_of_birth: must be valid YYYY-MM-DD if provided
    const dob = (row['date_of_birth'] || '').trim();
    if (dob) {
      if (!this.isValidDate(dob)) {
        errors.push(`Row ${rowIndex}: Date of birth must be a valid date in YYYY-MM-DD format`);
      }
    }

    // weight: must be a non-negative number if provided
    const weightStr = (row['weight'] || '').trim();
    if (weightStr) {
      const weight = parseFloat(weightStr);
      if (isNaN(weight) || weight < 0) {
        errors.push(`Row ${rowIndex}: Weight must be a non-negative number`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize a string field to prevent injection attacks.
   * Mirrors the backend sanitize_string utility:
   * - Strip leading CSV injection characters (=, +, -, @, \t, \r)
   * - Remove HTML tags
   * - Remove null bytes
   */
  sanitizeField(value: string): string {
    if (!value) return value;

    let sanitized = value;

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Strip leading CSV injection characters in a loop
    const injectionChars = ['=', '+', '-', '@', '\t', '\r'];
    while (sanitized.length > 0 && injectionChars.includes(sanitized[0])) {
      sanitized = sanitized.substring(1);
    }

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    return sanitized;
  }

  /**
   * Validate a date string is in YYYY-MM-DD format and represents a real date.
   */
  private isValidDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }
}
