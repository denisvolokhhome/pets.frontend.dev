import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { environment } from 'src/environments/environment';

interface Category {
  value: string;
  label: string;
}

@Component({
  standalone: false,
  selector: 'app-support-settings',
  templateUrl: './support-settings.component.html',
  styleUrls: ['./support-settings.component.css']
})
export class SupportSettingsComponent implements OnInit {
  supportForm: FormGroup;
  categories: Category[] = [];
  isSubmitting = false;
  lastRequestNumber: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public authService: AuthService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.supportForm = this.fb.group({
      category: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
  }

  loadCategories(): void {
    this.http.get<Category[]>(
      environment.API_URL + '/support/categories',
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (cats) => {
        this.categories = cats;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback categories if endpoint fails
        this.categories = [
          { value: 'account_conversion', label: 'Account Conversion' },
          { value: 'account_issue', label: 'Account Issue' },
          { value: 'billing', label: 'Billing' },
          { value: 'bug_report', label: 'Bug Report' },
          { value: 'feature_request', label: 'Feature Request' },
          { value: 'verification', label: 'Verification' },
          { value: 'other', label: 'Other' }
        ];
        this.cdr.detectChanges();
      }
    });
  }

  get messageLength(): number {
    return this.supportForm.get('message')?.value?.length || 0;
  }

  submitRequest(): void {
    if (this.supportForm.invalid || this.isSubmitting) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.lastRequestNumber = null;

    this.http.post<{ request_number: string; message: string }>(
      environment.API_URL + '/support/request',
      this.supportForm.value,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (response) => {
        this.lastRequestNumber = response.request_number;
        this.toastr.success(
          `Request ${response.request_number} submitted. Check your email for confirmation.`,
          'Request Sent'
        );
        this.supportForm.reset();
        this.supportForm.patchValue({ category: '' });
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        const detail = error?.error?.detail || 'Failed to submit request. Please try again.';
        this.toastr.error(detail, 'Error');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
