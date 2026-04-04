import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-guest-prompt-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './guest-prompt-modal.component.html',
  styleUrls: ['./guest-prompt-modal.component.css']
})
export class GuestPromptModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() offspringId?: string;
  @Input() offspringName?: string;
  @Output() authSuccess = new EventEmitter<void>();

  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoggingIn = false;
  isRegistering = false;
  showRegisterForm = false; // Toggle between login and register

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.visible) this.closeModal();
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    public router: Router,
    private elementRef: ElementRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      isBreeder: [false],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Pre-fill email if available from query params
    const email = this.getEmailFromQueryParams();
    if (email) {
      this.loginForm.patchValue({ email });
      this.registerForm.patchValue({ email });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      setTimeout(() => {
        const firstInput = this.elementRef.nativeElement.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  private getEmailFromQueryParams(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email');
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isLoggingIn) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoggingIn = true;

    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.LoginUser(loginData).subscribe({
      next: (response) => {
        this.toastService.success('Login successful!', 'Welcome back');
        this.isLoggingIn = false;
        this.closeModal();
        this.handlePostAuthRedirect();
      },
      error: (error) => {
        console.error('Login error:', error);
        this.toastService.error(
          error.message || 'Invalid email or password',
          'Login Failed'
        );
        this.isLoggingIn = false;
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid || this.isRegistering) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegistering = true;

    const registerData = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`,
      is_breeder: this.registerForm.value.isBreeder
    };

    // Use appropriate registration method based on user type
    const registerObservable = this.registerForm.value.isBreeder
      ? this.authService.RegisterUser(registerData)
      : this.authService.RegisterPetSeeker(registerData);

    registerObservable.subscribe({
      next: (response) => {
        this.toastService.success(
          'Account created successfully!',
          'Welcome to Breedly'
        );
        
        // Auto-login after registration
        const loginData = {
          email: this.registerForm.value.email,
          password: this.registerForm.value.password
        };
        
        this.authService.LoginUser(loginData).subscribe({
          next: () => {
            this.isRegistering = false;
            this.closeModal();
            this.handlePostAuthRedirect();
          },
          error: (error) => {
            console.error('Auto-login error:', error);
            this.isRegistering = false;
            this.closeModal();
            this.toastService.info('Please log in with your new account', 'Registration Complete');
          }
        });
      },
      error: (error) => {
        console.error('Registration error:', error);
        if (error.error?.detail === 'REGISTER_SSO_ACCOUNT_EXISTS' || error.status === 409) {
          this.toastService.info(
            'An account with this email was created using Google Sign-In. Please sign in with Google.',
            'Account Exists'
          );
          this.closeModal();
          this.router.navigate(['/login'], { queryParams: { hint: 'sso' } });
        } else {
          this.toastService.error(
            error.message || 'Failed to create account',
            'Registration Failed'
          );
        }
        this.isRegistering = false;
      }
    });
  }

  private handlePostAuthRedirect(): void {
    // Retrieve stored offspring context
    const storedContext = sessionStorage.getItem('pendingOffspringContact');
    
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext);
        
        // Clear the stored context
        sessionStorage.removeItem('pendingOffspringContact');
        
        // Navigate to message thread with offspring context
        this.router.navigate(['/messages/new'], {
          queryParams: {
            breederId: context.breederId,
            offspringId: context.offspringId
          }
        });
        
        this.authSuccess.emit();
        return;
      } catch (error) {
        console.error('Error parsing stored offspring context:', error);
      }
    }
    
    // Fallback: just emit success and let parent handle
    this.authSuccess.emit();
  }

  closeModal(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.loginForm.reset();
    this.registerForm.reset();
    this.showRegisterForm = false;
  }

  switchToRegister(): void {
    this.showRegisterForm = true;
  }

  switchToLogin(): void {
    this.showRegisterForm = false;
  }

  get loginEmail() {
    return this.loginForm.get('email');
  }

  get loginPassword() {
    return this.loginForm.get('password');
  }

  get registerEmail() {
    return this.registerForm.get('email');
  }

  get registerPassword() {
    return this.registerForm.get('password');
  }

  get registerConfirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get registerFirstName() {
    return this.registerForm.get('firstName');
  }

  get registerLastName() {
    return this.registerForm.get('lastName');
  }

  get registerAcceptTerms() {
    return this.registerForm.get('acceptTerms');
  }
}
