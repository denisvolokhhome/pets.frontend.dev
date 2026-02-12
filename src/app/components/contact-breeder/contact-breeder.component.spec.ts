import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ContactBreederComponent } from './contact-breeder.component';
import { MessageService } from '../../services/message.service';
import { ToastrService } from 'ngx-toastr';

describe('ContactBreederComponent', () => {
  let component: ContactBreederComponent;
  let fixture: ComponentFixture<ContactBreederComponent>;
  let messageService: jasmine.SpyObj<MessageService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['sendMessage']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [ 
        ContactBreederComponent, 
        ReactiveFormsModule, 
        CommonModule,
        HttpClientTestingModule 
      ],
      providers: [
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    })
    .compileComponents();

    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactBreederComponent);
    component = fixture.componentInstance;
    component.breederId = 'breeder-123';
    component.breederName = 'Test Breeder';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.contactForm.get('sender_name')?.value).toBe('');
      expect(component.contactForm.get('sender_email')?.value).toBe('');
      expect(component.contactForm.get('message')?.value).toBe('');
    });

    it('should have required validators on name and email', () => {
      const nameControl = component.contactForm.get('sender_name');
      const emailControl = component.contactForm.get('sender_email');

      expect(nameControl?.hasError('required')).toBe(true);
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.contactForm.get('sender_email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should validate name minimum length', () => {
      const nameControl = component.contactForm.get('sender_name');
      
      nameControl?.setValue('J');
      expect(nameControl?.hasError('minlength')).toBe(true);

      nameControl?.setValue('John');
      expect(nameControl?.hasError('minlength')).toBe(false);
    });

    it('should validate message maximum length', () => {
      const messageControl = component.contactForm.get('message');
      
      messageControl?.setValue('x'.repeat(2001));
      expect(messageControl?.hasError('maxlength')).toBe(true);

      messageControl?.setValue('x'.repeat(2000));
      expect(messageControl?.hasError('maxlength')).toBe(false);
    });
  });

  describe('Form Submission', () => {
    it('should not submit if form is invalid', () => {
      component.onSubmit();

      expect(messageService.sendMessage).not.toHaveBeenCalled();
      expect(component.contactForm.get('sender_name')?.touched).toBe(true);
      expect(component.contactForm.get('sender_email')?.touched).toBe(true);
    });

    it('should submit valid form successfully', () => {
      const mockResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };
      messageService.sendMessage.and.returnValue(of(mockResponse));

      component.contactForm.patchValue({
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'I am interested in your puppies'
      });

      component.onSubmit();

      expect(messageService.sendMessage).toHaveBeenCalledWith({
        breeder_id: 'breeder-123',
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'I am interested in your puppies'
      });
      expect(toastrService.success).toHaveBeenCalled();
      expect(component.visible).toBe(false);
    });

    it('should submit form without message text', () => {
      const mockResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };
      messageService.sendMessage.and.returnValue(of(mockResponse));

      component.contactForm.patchValue({
        sender_name: 'Jane Smith',
        sender_email: 'jane@example.com'
      });

      component.onSubmit();

      expect(messageService.sendMessage).toHaveBeenCalledWith({
        breeder_id: 'breeder-123',
        sender_name: 'Jane Smith',
        sender_email: 'jane@example.com',
        message: ''
      });
    });

    it('should handle submission error', () => {
      const mockError = {
        message: 'Breeder not found'
      };
      messageService.sendMessage.and.returnValue(throwError(() => mockError));

      component.contactForm.patchValue({
        sender_name: 'John Doe',
        sender_email: 'john@example.com'
      });

      component.onSubmit();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Breeder not found',
        'Error'
      );
      expect(component.isSubmitting).toBe(false);
    });

    it('should reset form after successful submission', () => {
      const mockResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };
      messageService.sendMessage.and.returnValue(of(mockResponse));

      component.contactForm.patchValue({
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'Test message'
      });

      component.onSubmit();

      expect(component.contactForm.get('sender_name')?.value).toBeNull();
      expect(component.contactForm.get('sender_email')?.value).toBeNull();
      expect(component.contactForm.get('message')?.value).toBeNull();
    });

    it('should emit messageSent event after successful submission', () => {
      const mockResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };
      messageService.sendMessage.and.returnValue(of(mockResponse));
      spyOn(component.messageSent, 'emit');

      component.contactForm.patchValue({
        sender_name: 'John Doe',
        sender_email: 'john@example.com'
      });

      component.onSubmit();

      expect(component.messageSent.emit).toHaveBeenCalled();
    });

    it('should set loading state during submission', () => {
      const mockResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };
      messageService.sendMessage.and.returnValue(of(mockResponse));

      component.contactForm.patchValue({
        sender_name: 'John Doe',
        sender_email: 'john@example.com'
      });

      expect(component.isSubmitting).toBe(false);
      
      component.onSubmit();

      // After submission completes
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('Modal Visibility', () => {
    it('should close modal', () => {
      component.visible = true;
      
      component.closeDialog();

      expect(component.visible).toBe(false);
    });

    it('should reset form when closing modal', () => {
      component.contactForm.patchValue({
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'Test message'
      });

      component.closeDialog();

      expect(component.contactForm.get('sender_name')?.value).toBeNull();
      expect(component.contactForm.get('sender_email')?.value).toBeNull();
      expect(component.contactForm.get('message')?.value).toBeNull();
    });

    it('should emit visibleChange event when closing', () => {
      spyOn(component.visibleChange, 'emit');
      component.visible = true;
      
      component.closeDialog();

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should call closeDialog when onCancel is called', () => {
      spyOn(component, 'closeDialog');
      
      component.onCancel();

      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Form Getters', () => {
    it('should get sender_name control', () => {
      const control = component.senderName;
      expect(control).toBe(component.contactForm.get('sender_name'));
    });

    it('should get sender_email control', () => {
      const control = component.senderEmail;
      expect(control).toBe(component.contactForm.get('sender_email'));
    });

    it('should get message control', () => {
      const control = component.message;
      expect(control).toBe(component.contactForm.get('message'));
    });
  });

  describe('Input Properties', () => {
    it('should accept breederId input', () => {
      component.breederId = 'new-breeder-id';
      expect(component.breederId).toBe('new-breeder-id');
    });

    it('should accept breederName input', () => {
      component.breederName = 'New Breeder Name';
      expect(component.breederName).toBe('New Breeder Name');
    });
  });
});
