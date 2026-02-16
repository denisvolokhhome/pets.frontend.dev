import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import * as fc from 'fast-check';
import { ContactBreederComponent } from './contact-breeder.component';
import { MessageService } from '../../services/message.service';

/**
 * Property-Based Tests for Contact Breeder Component
 * 
 * These tests use fast-check to verify universal properties that should hold
 * for all valid inputs, ensuring the component behaves correctly across a wide
 * range of scenarios.
 */
describe('ContactBreederComponent - Property-Based Tests', () => {
  let component: ContactBreederComponent;
  let fixture: ComponentFixture<ContactBreederComponent>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockMessageService = jasmine.createSpyObj('MessageService', ['sendMessage']);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ContactBreederComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MessageService, useValue: mockMessageService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactBreederComponent);
    component = fixture.componentInstance;
    component.breederId = 'test-breeder-id';
    component.breederName = 'Test Breeder';
    fixture.detectChanges();
  });

  /**
   * Property 11: Post-Message Account Prompt
   * 
   * Feature: pet-seeker-accounts
   * Validates: Requirements 8.1, 8.3
   * 
   * For any successful guest message submission, the system SHALL display 
   * an account creation prompt with the sender's email pre-filled.
   */
  describe('Property 11: Post-Message Account Prompt', () => {
    it('should display account prompt with pre-filled email after any successful message submission', () => {
      fc.assert(
        fc.property(
          // Generate valid email addresses
          fc.emailAddress(),
          // Generate valid names (2-255 chars)
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2),
          // Generate optional messages (0-2000 chars)
          fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
          (email, name, message) => {
            // Reset component state
            component.showAccountPrompt = false;
            component.submittedEmail = '';
            component.contactForm.reset();

            // Set up form with valid data
            component.contactForm.patchValue({
              sender_name: name,
              sender_email: email,
              message: message || ''
            });

            // Mock successful message submission
            mockMessageService.sendMessage.and.returnValue(
              of({ success: true, message: 'Message sent successfully' })
            );

            // Submit the form
            component.onSubmit();

            // Verify account prompt is shown
            expect(component.showAccountPrompt).toBe(
              true,
              `Account prompt should be shown after successful submission for email: ${email}`
            );

            // Verify email is pre-filled
            expect(component.submittedEmail).toBe(
              email,
              `Submitted email should be stored as: ${email}`
            );

            // Verify success toast was shown
            expect(mockToastr.success).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 } // Run 100 iterations with different inputs
      );
    });

    it('should NOT display account prompt if message submission fails', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2),
          fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
          (email, name, message) => {
            // Reset component state
            component.showAccountPrompt = false;
            component.submittedEmail = '';
            component.contactForm.reset();

            // Set up form with valid data
            component.contactForm.patchValue({
              sender_name: name,
              sender_email: email,
              message: message || ''
            });

            // Mock failed message submission
            mockMessageService.sendMessage.and.returnValue(
              throwError(() => new Error('Network error'))
            );

            // Submit the form
            component.onSubmit();

            // Verify account prompt is NOT shown on failure
            expect(component.showAccountPrompt).toBe(
              false,
              `Account prompt should NOT be shown after failed submission for email: ${email}`
            );

            // Verify email is NOT stored
            expect(component.submittedEmail).toBe(
              '',
              'Submitted email should remain empty after failure'
            );

            // Verify error toast was shown
            expect(mockToastr.error).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should navigate to guest-to-account page with email query param when user accepts prompt', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            // Set up component state as if message was just sent
            component.showAccountPrompt = true;
            component.submittedEmail = email;
            component.visible = true;

            // User clicks "Create Account" button
            component.onCreateAccount();

            // Verify navigation to guest-to-account with email param
            expect(mockRouter.navigate).toHaveBeenCalledWith(
              ['/guest-to-account'],
              { queryParams: { email: email } }
            );

            // Verify dialog is closed
            expect(component.visible).toBe(false);
            expect(component.showAccountPrompt).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close dialog without navigation when user skips account creation', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            // Set up component state as if message was just sent
            component.showAccountPrompt = true;
            component.submittedEmail = email;
            component.visible = true;

            // Reset router spy
            mockRouter.navigate.calls.reset();

            // User clicks "Maybe Later" button
            component.onSkipAccountCreation();

            // Verify NO navigation occurred
            expect(mockRouter.navigate).not.toHaveBeenCalled();

            // Verify dialog is closed
            expect(component.visible).toBe(false);
            expect(component.showAccountPrompt).toBe(false);
            expect(component.submittedEmail).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Form Validation Consistency
   * 
   * Ensures that form validation behaves consistently across all inputs
   */
  describe('Property: Form Validation Consistency', () => {
    it('should reject submission when required fields are missing', () => {
      fc.assert(
        fc.property(
          // Generate combinations of missing required fields
          fc.record({
            hasName: fc.boolean(),
            hasEmail: fc.boolean(),
            hasMessage: fc.boolean()
          }).filter(fields => !fields.hasName || !fields.hasEmail), // At least one required field missing
          fc.emailAddress(),
          fc.string({ minLength: 2, maxLength: 255 }),
          fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
          (missingFields, email, name, message) => {
            // Reset form
            component.contactForm.reset();
            component.showAccountPrompt = false;

            // Set only the fields that should be present
            component.contactForm.patchValue({
              sender_name: missingFields.hasName ? name : '',
              sender_email: missingFields.hasEmail ? email : '',
              message: missingFields.hasMessage ? (message || '') : ''
            });

            // Reset message service spy
            mockMessageService.sendMessage.calls.reset();

            // Attempt to submit
            component.onSubmit();

            // Verify message service was NOT called
            expect(mockMessageService.sendMessage).not.toHaveBeenCalled();

            // Verify account prompt was NOT shown
            expect(component.showAccountPrompt).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept submission when all required fields are valid', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2),
          fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
          (email, name, message) => {
            // Reset form
            component.contactForm.reset();
            component.showAccountPrompt = false;

            // Set valid data
            component.contactForm.patchValue({
              sender_name: name,
              sender_email: email,
              message: message || ''
            });

            // Mock successful submission
            mockMessageService.sendMessage.and.returnValue(
              of({ success: true, message: 'Message sent successfully' })
            );

            // Submit
            component.onSubmit();

            // Verify message service WAS called
            expect(mockMessageService.sendMessage).toHaveBeenCalled();

            // Verify the call had correct data (component trims values)
            const callArgs = mockMessageService.sendMessage.calls.mostRecent().args[0];
            expect(callArgs.sender_email).toBe(email);
            expect(callArgs.sender_name).toBe(name.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
