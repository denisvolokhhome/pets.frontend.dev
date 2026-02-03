import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { IBreeding, IPuppyInput } from '../../models/breeding';
import { IPet } from '../../models/pet';
import { DataService } from '../../services/data.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-puppy-table',
  templateUrl: './puppy-table.component.html',
  styleUrls: ['./puppy-table.component.css']
})
export class PuppyTableComponent implements OnInit {
  @Input() litter!: IBreeding;
  @Output() puppiesAdded = new EventEmitter<IPet[]>();

  puppies: IPuppyInput[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private dataService: DataService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Start with one empty puppy row
    this.addPuppyRow();
  }

  addPuppyRow(): void {
    this.puppies.push({
      name: '',
      gender: 'Male',
      birth_date: ''
    });
  }

  removePuppy(index: number): void {
    if (this.puppies.length > 1) {
      this.puppies.splice(index, 1);
    }
  }

  isValid(): boolean {
    // Check if at least one puppy exists
    if (this.puppies.length === 0) {
      return false;
    }

    // Check if all puppies have required fields filled
    return this.puppies.every(puppy => {
      return puppy.name.trim() !== '' && 
             (puppy.gender === 'Male' || puppy.gender === 'Female') && 
             puppy.birth_date !== '';
    });
  }

  savePuppies(): void {
    if (!this.isValid()) {
      this.errorMessage = 'Please fill in all required fields (Name, Gender, Birth Date)';
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Clean up puppies data
    const cleanedPuppies: IPuppyInput[] = this.puppies.map(puppy => ({
      name: puppy.name.trim(),
      gender: puppy.gender,
      birth_date: puppy.birth_date
    }));

    this.dataService.addPuppies(this.litter.id, cleanedPuppies).subscribe({
      next: (updatedLitter) => {
        this.isLoading = false;
        this.toastr.success('Puppies added successfully', 'Success');
        this.puppiesAdded.emit(updatedLitter.puppies || []);
        this.errorMessage = '';
      },
      error: (error) => {
        this.isLoading = false;
        // Extract error message from the error response
        let errorMsg = 'Failed to add puppies. Please try again.';
        if (error.message) {
          errorMsg = error.message;
        } else if (error.error?.detail) {
          errorMsg = error.error.detail;
        }
        this.errorMessage = errorMsg;
        this.toastr.error(errorMsg, 'Error');
        console.error('Error adding puppies:', error);
      }
    });
  }
}
