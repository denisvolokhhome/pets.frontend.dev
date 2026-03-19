import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import { SearchService } from '../../services/search.service';
import { Breed } from '../../models/search';

@Component({
  standalone: false,
  selector: 'app-search-controls',
  templateUrl: './search-controls.component.html',
  styleUrls: ['./search-controls.component.css']
})
export class SearchControlsComponent implements OnInit {
  @Input() zipCode: string = '';
  @Output() zipCodeChange = new EventEmitter<string>();

  @Input() selectedBreed: Breed | null = null;
  @Output() selectedBreedChange = new EventEmitter<Breed | null>();

  @Input() radius: number = 40;
  @Output() radiusChange = new EventEmitter<number>();

  @Output() search = new EventEmitter<void>();

  @Input() selectedAnimalKind: string = '';
  @Output() animalKindChange = new EventEmitter<string>();

  breedSearch$ = new Subject<string>();
  breedSuggestions$: Observable<Breed[]> = of([]);
  showBreedDropdown = false;
  breedSearchTerm = '';
  breedSearchError: string | null = null;

  zipError: string | null = null;
  radiusError: string | null = null;

  quickSelectRadii = [10, 20, 40, 60];
  customRadiusInput: number | null = null;

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    // Set up breed autocomplete with debouncing
    // Requirement 4.2: Debounce breed search input
    // Requirement 11.4: Handle breed autocomplete errors
    this.breedSuggestions$ = this.breedSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          this.breedSearchError = null;
          return of([]);
        }
        
        return this.searchService.searchBreeds(term).pipe(
          map(breeds => {
            this.breedSearchError = null;
            return breeds;
          }),
          catchError(error => {
            this.breedSearchError = 'Failed to load breed suggestions';
            console.error('Breed search error:', error);
            return of([]);
          })
        );
      })
    );

    // Subscribe to breed suggestions to show/hide dropdown
    this.breedSuggestions$.subscribe(suggestions => {
      this.showBreedDropdown = suggestions.length > 0 || this.breedSearchError !== null;
    });
  }

  onZipCodeInput(value: string): void {
    // Validate ZIP code - numeric only
    if (value && !/^\d*$/.test(value)) {
      this.zipError = 'ZIP code must contain only numbers';
      return;
    }

    // Validate length
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
      this.showBreedDropdown = false;
      return;
    }

    this.breedSearch$.next(value);
  }

  selectBreed(breed: Breed): void {
    this.selectedBreed = breed;
    this.breedSearchTerm = breed.name;
    this.selectedBreedChange.emit(breed);
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

    // Validate positive number
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
    // Validate ZIP code before search
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
