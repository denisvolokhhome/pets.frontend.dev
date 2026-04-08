/**
 * Frontend models for CSV Pet Import feature.
 */

/** Client-side parsed row from CSV file (camelCase for frontend use). */
export interface ParsedPetRow {
  rowNumber: number;
  name: string;
  breed?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: number;
  description?: string;
  location?: string;
  microchip?: string;
  vaccination?: string;
  healthCertificate?: string;
  deworming?: string;
  birthCertificate?: string;
  isValid: boolean;
  errors: string[];
  willBeImported: boolean;
}

/** API request shape for a single pet row (snake_case to match backend contract). */
export interface PetImportRow {
  row_number: number;
  name: string;
  breed?: string;
  gender?: string;
  date_of_birth?: string;
  weight?: number;
  description?: string;
  location?: string;
  microchip?: string;
  vaccination?: string;
  health_certificate?: string;
  deworming?: string;
  birth_certificate?: string;
}

/** Response from POST /api/pets/import. */
export interface ImportResult {
  created_count: number;
  skipped_count: number;
  errors: ImportError[];
  plan_limit_applied: boolean;
}

/** A single row-level error from the import. */
export interface ImportError {
  row: number;
  reason: string;
}
