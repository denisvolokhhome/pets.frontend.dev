import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from 'src/app/services/modal.service';
import { CsvParserService } from 'src/app/services/csv-parser.service';
import { PetImportService } from 'src/app/services/pet-import.service';
import { BillingService } from 'src/app/services/billing.service';
import { ToastService } from 'src/app/services/toast.service';
import { IBreed } from 'src/app/models/breed';
import { ILocation } from 'src/app/models/location';
import {
  ParsedPetRow,
  PetImportRow,
  ImportResult,
} from 'src/app/models/pet-import.model';

export const IMPORT_WIZARD_MODAL_ID = 'importWizardModal';

@Component({
  standalone: false,
  selector: 'app-import-wizard',
  templateUrl: './import-wizard.component.html',
  styleUrls: ['./import-wizard.component.css'],
})
export class ImportWizardComponent implements OnInit, OnDestroy {
  @Output() importComplete = new EventEmitter<void>();

  /** Inputs set by parent before opening the modal */
  breeds: IBreed[] = [];
  locations: ILocation[] = [];
  currentPetCount = 0;
  maxPets = 0;

  /** Wizard state */
  currentStep = 1;
  isOpen = false;

  /** Step 2 state */
  parsedRows: ParsedPetRow[] = [];
  parseErrors: string[] = [];
  isDragOver = false;
  isParsing = false;
  selectedFile: File | null = null;
  billingLoaded = false;
  billingError = false;

  /** Step 3 state */
  importResult: ImportResult | null = null;
  isImporting = false;
  showErrorList = false;

  private modalSub: Subscription | null = null;

  constructor(
    private modalService: ModalService,
    private csvParser: CsvParserService,
    private petImportService: PetImportService,
    private billingService: BillingService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  ngOnInit(): void {
    this.modalSub = this.modalService
      .getModalState(IMPORT_WIZARD_MODAL_ID)
      .subscribe((isVisible) => {
        this.isOpen = isVisible;
        if (isVisible) {
          this.resetWizard();
        }
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.modalSub?.unsubscribe();
  }

  // ── Step navigation ──────────────────────────────────────────

  goToStep(step: number): void {
    this.currentStep = step;
    this.cdr.detectChanges();
  }

  // ── Step 1: Template ─────────────────────────────────────────

  downloadTemplate(): void {
    const csv = this.csvParser.generateTemplate(this.breeds, this.locations);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'breedly_pet_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Step 2: Upload & Validate ────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.parseErrors = ['Please upload a CSV file'];
      this.parsedRows = [];
      this.selectedFile = null;
      this.cdr.detectChanges();
      return;
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      this.parseErrors = ['File size exceeds 5MB limit'];
      this.parsedRows = [];
      this.selectedFile = null;
      this.cdr.detectChanges();
      return;
    }

    this.selectedFile = file;
    this.isParsing = true;
    this.parseErrors = [];
    this.parsedRows = [];
    this.cdr.detectChanges();

    this.csvParser.parseFile(file).then((result) => {
      this.isParsing = false;
      this.parseErrors = result.errors;
      this.parsedRows = result.rows;

      if (this.parsedRows.length > 0 && this.parseErrors.length === 0) {
        this.loadBillingInfo();
      } else {
        this.cdr.detectChanges();
      }
    });
  }

  private loadBillingInfo(): void {
    this.billingLoaded = false;
    this.billingError = false;

    this.billingService.getSubscription().subscribe({
      next: (sub) => {
        this.maxPets = sub.plan.max_pets;
        // We need the current pet count — it's passed in by the parent
        this.billingLoaded = true;
        this.applyBillingLimits();
        this.cdr.detectChanges();
      },
      error: () => {
        // If billing fails, allow import without limit warnings
        this.billingLoaded = true;
        this.billingError = true;
        this.applyBillingLimits();
        this.cdr.detectChanges();
      },
    });
  }

  private applyBillingLimits(): void {
    if (this.billingError) {
      // Can't determine limits — mark all valid rows as importable
      this.parsedRows.forEach((row) => {
        row.willBeImported = row.isValid;
      });
      return;
    }

    const allowed = Math.max(0, this.maxPets - this.currentPetCount);
    let validCount = 0;

    this.parsedRows.forEach((row) => {
      if (row.isValid) {
        validCount++;
        row.willBeImported = validCount <= allowed;
      } else {
        row.willBeImported = false;
      }
    });
  }

  get validRowCount(): number {
    return this.parsedRows.filter((r) => r.isValid).length;
  }

  get importableRowCount(): number {
    return this.parsedRows.filter((r) => r.willBeImported).length;
  }

  get allowedPets(): number {
    return Math.max(0, this.maxPets - this.currentPetCount);
  }

  get isOverLimit(): boolean {
    return (
      this.billingLoaded &&
      !this.billingError &&
      this.validRowCount > this.allowedPets
    );
  }

  get allFitWithinLimit(): boolean {
    return (
      this.billingLoaded &&
      !this.billingError &&
      this.validRowCount > 0 &&
      this.validRowCount <= this.allowedPets
    );
  }

  get canImport(): boolean {
    return this.importableRowCount > 0 && !this.isParsing && !this.isImporting;
  }

  // ── Import action ────────────────────────────────────────────

  startImport(): void {
    const rowsToImport = this.parsedRows.filter((r) => r.willBeImported);
    if (rowsToImport.length === 0) return;

    const payload: PetImportRow[] = rowsToImport.map((r) => ({
      row_number: r.rowNumber,
      name: r.name,
      breed: r.breed,
      gender: r.gender,
      date_of_birth: r.dateOfBirth,
      weight: r.weight,
      description: r.description,
      location: r.location,
      microchip: r.microchip,
      vaccination: r.vaccination,
      health_certificate: r.healthCertificate,
      deworming: r.deworming,
      birth_certificate: r.birthCertificate,
    }));

    this.isImporting = true;
    this.cdr.detectChanges();

    this.petImportService.importPets(payload).subscribe({
      next: (result) => {
        this.importResult = result;
        this.isImporting = false;
        this.currentStep = 3;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isImporting = false;
        this.toastr.error(
          err.message || 'Import failed. Please try again.',
          'Import Error'
        );
        this.cdr.detectChanges();
      },
    });
  }

  // ── Step 3: Results ──────────────────────────────────────────

  toggleErrorList(): void {
    this.showErrorList = !this.showErrorList;
  }

  // ── Close / Reset ────────────────────────────────────────────

  close(): void {
    const hadImport =
      this.importResult !== null && this.importResult.created_count > 0;
    this.modalService.close(IMPORT_WIZARD_MODAL_ID);
    if (hadImport) {
      this.importComplete.emit();
    }
  }

  private resetWizard(): void {
    this.currentStep = 1;
    this.parsedRows = [];
    this.parseErrors = [];
    this.isDragOver = false;
    this.isParsing = false;
    this.selectedFile = null;
    this.billingLoaded = false;
    this.billingError = false;
    this.importResult = null;
    this.isImporting = false;
    this.showErrorList = false;
  }
}
