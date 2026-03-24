import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SearchService } from '../../services/search.service';
import { Breed } from '../../models/search';

@Component({
  standalone: false,
  selector: 'app-search-controls',
  templateUrl: './search-controls.component.html',
  styleUrls: ['./search-controls.component.css']
})
export class SearchControlsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() zipCode: string = '';
  @Output() zipCodeChange = new EventEmitter<string>();

  @Input() selectedBreed: Breed | null = null;
  @Output() selectedBreedChange = new EventEmitter<Breed | null>();

  @Input() radius: number = 40;
  @Output() radiusChange = new EventEmitter<number>();

  @Output() search = new EventEmitter<void>();

  @Input() selectedAnimalKind: string = '';
  @Output() animalKindChange = new EventEmitter<string>();

  private breedSearch$ = new Subject<string>();
  private searchSub!: Subscription;

  breedSuggestions: Breed[] = [];
  showBreedDropdown = false;
  breedSearchTerm = '';
  breedSearchError: string | null = null;

  zipError: string | null = null;
  radiusError: string | null = null;

  quickSelectRadii = [10, 20, 40, 60];
  customRadiusInput: number | null = null;

  constructor(private searchService: SearchService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.searchSub = this.breedSearch$.pipe(
      debounceTime(400),
      switchMap(term => {
        if (term.length < 2) {
          this.breedSearchError = null;
          return of([]);
        }
        return this.searchService.searchBreeds(term, this.selectedAnimalKind || undefined).pipe(
          catchError(error => {
            this.breedSearchError = 'Failed to load breed suggestions';
            console.error('Breed search error:', error);
            return of([]);
          })
        );
      })
    ).subscribe(breeds => {
      this.breedSearchError = null;
      this.breedSuggestions = breeds;
      this.showBreedDropdown = breeds.length > 0 || this.breedSearchError !== null;
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedAnimalKind'] && !changes['selectedAnimalKind'].firstChange) {
      this.breedSearchTerm = '';
      this.selectedBreed = null;
      this.selectedBreedChange.emit(null);
      this.breedSuggestions = [];
      this.showBreedDropdown = false;
    }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onZipCodeInput(value: string): void {
    if (value && !/^\d*$/.test(value)) {
      this.zipError = 'ZIP code must contain only numbers';
      return;
    }
    if (value && value.length > 5) {
      this.zipError = 'ZIP code must be 5 digits';
      return;
    }
    this.zipError = null;
    this.zipCode = value;
    this.zipCodeChange.emit(value);
  }

  onBreedSearchInput(value: string): void {
    this.breedSearchTerm = value;
    if (!value) {
      this.selectedBreed = null;
      this.selectedBreedChange.emit(null);
      this.breedSuggestions = [];
      this.showBreedDropdown = false;
      return;
    }
    this.breedSearch$.next(value);
  }

  onBreedFocus(): void {
    if (this.breedSuggestions.length > 0) {
      this.showBreedDropdown = true;
    }
  }

  onBreedBlur(): void {
    // Delay to allow click on dropdown option to register
    setTimeout(() => {
      this.showBreedDropdown = false;
    }, 200);
  }

  selectBreed(breed: Breed): void {
    this.selectedBreed = breed;
    this.breedSearchTerm = breed.name;
    this.selectedBreedChange.emit(breed);
    this.breedSuggestions = [];
    this.showBreedDropdown = false;
  }

  selectQuickRadius(miles: number): void {
    this.radius = miles;
    this.customRadiusInput = null;
    this.radiusError = null;
    this.radiusChange.emit(miles);
  }

  onCustomRadiusInput(value: string): void {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      this.radiusError = 'Radius must be a positive number';
      return;
    }
    if (numValue > 100) {
      this.radiusError = 'Radius cannot exceed 100 miles';
      return;
    }
    this.radiusError = null;
    this.customRadiusInput = numValue;
    this.radius = numValue;
    this.radiusChange.emit(numValue);
  }

  onSearch(): void {
    if (!this.zipCode || this.zipCode.length !== 5) {
      this.zipError = 'Please enter a valid 5-digit ZIP code';
      return;
    }
    if (this.zipError || this.radiusError) {
      return;
    }
    this.search.emit();
  }

  isQuickRadiusSelected(miles: number): boolean {
    return this.radius === miles && this.customRadiusInput === null;
  }
}
