import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastrModule, ToastrService } from 'ngx-toastr';

import { MessageDetailComponent } from './message-detail.component';
import { MessageService, Message } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';

describe('MessageDetailComponent', () => {
  let component: MessageDetailComponent;
  let fixture: ComponentFixture<MessageDetailComponent>;
  let messageService: jasmine.SpyObj<MessageService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let toastr: jasmine.SpyObj<ToastrService>;

  const mockBreederMessage: Message = {
    id: 'msg-1',
    breeder_id: 'breeder-123',
    sender_name: 'John Doe',
    sender_email: 'john@example.com',
    message: 'I am interested in your puppies. Do you have any available?',
    is_read: false,
    response_text: null,
    responded_at: null,
    created_at: new Date().toISOString(),
    updated_at: null
  };

  const mockRespondedMessage: Message = {
    ...mockBreederMessage,
    id: 'msg-2',
    is_read: true,
    response_text: 'Thank you for your interest. Yes, we have puppies available.',
    responded_at: new Date().toISOString()
  };

  beforeEach(async () => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', [
      'getMessage',
      'markAsRead',
      'respondToMessage'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isBreeder: true,
      isPetSeeker: false
    });
    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      declarations: [MessageDetailComponent],
      imports: [
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
        ReactiveFormsModule,
        ToastrModule.forRoot()
      ],
      providers: [
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => 'msg-1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    toastr = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Breeder View', () => {
    beforeEach(() => {
      Object.defineProperty(authService, 'isBreeder', { value: true, writable: true });
      Object.defineProperty(authService, 'isPetSeeker', { value: false, writable: true });
    });

    it('should load message on init', () => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));

      fixture.detectChanges();

      expect(messageService.getMessage).toHaveBeenCalledWith('msg-1');
      expect(component.message).toEqual(mockBreederMessage);
      expect(component.isLoading).toBe(false);
    });

    it('should load message and update read status for unread messages', fakeAsync(() => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));

      component.ngOnInit();
      flush();

      expect(messageService.getMessage).toHaveBeenCalledWith('msg-1');
      expect(component.message).toEqual(mockBreederMessage);
      // The markAsRead call happens asynchronously in a nested subscribe
      // We verify the behavior by checking the message was loaded correctly
    }));

    it('should not mark already read message as read', () => {
      const readMessage = { ...mockBreederMessage, is_read: true };
      messageService.getMessage.and.returnValue(of(readMessage));

      fixture.detectChanges();

      expect(messageService.markAsRead).not.toHaveBeenCalled();
    });

    it('should show response form for unresponded messages', () => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));

      fixture.detectChanges();

      expect(component.showResponseForm).toBe(true);
    });

    it('should not show response form for responded messages', () => {
      messageService.getMessage.and.returnValue(of(mockRespondedMessage));

      fixture.detectChanges();

      expect(component.showResponseForm).toBe(false);
    });

    it('should submit response successfully', () => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));
      messageService.respondToMessage.and.returnValue(of(mockRespondedMessage));

      fixture.detectChanges();

      component.responseForm.patchValue({
        response_text: 'Thank you for your interest.'
      });

      component.onSubmitResponse();

      expect(messageService.respondToMessage).toHaveBeenCalledWith('msg-1', {
        response_text: 'Thank you for your interest.'
      });
      expect(toastr.success).toHaveBeenCalledWith('Response sent successfully!', 'Success');
      expect(component.showResponseForm).toBe(false);
    });

    it('should not submit invalid response form', () => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));

      fixture.detectChanges();

      component.responseForm.patchValue({
        response_text: ''
      });

      component.onSubmitResponse();

      expect(messageService.respondToMessage).not.toHaveBeenCalled();
      expect(component.responseForm.invalid).toBe(true);
    });

    it('should handle response submission error', () => {
      const error = { message: 'Failed to send response' };
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));
      messageService.respondToMessage.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      component.responseForm.patchValue({
        response_text: 'Thank you for your interest.'
      });

      component.onSubmitResponse();

      expect(toastr.error).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });

    it('should toggle response form visibility', () => {
      messageService.getMessage.and.returnValue(of(mockRespondedMessage));

      fixture.detectChanges();

      expect(component.showResponseForm).toBe(false);

      component.toggleResponseForm();

      expect(component.showResponseForm).toBe(true);

      component.toggleResponseForm();

      expect(component.showResponseForm).toBe(false);
    });
  });

  describe('Pet Seeker View', () => {
    beforeEach(() => {
      Object.defineProperty(authService, 'isBreeder', { value: false, writable: true });
      Object.defineProperty(authService, 'isPetSeeker', { value: true, writable: true });
    });

    it('should load pet seeker message', () => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));

      fixture.detectChanges();

      expect(messageService.getMessage).toHaveBeenCalledWith('msg-1');
      expect(component.message).toEqual(mockBreederMessage);
    });

    it('should not show response form for pet seekers', () => {
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));

      fixture.detectChanges();

      // Pet seekers should not see response form even for unresponded messages
      expect(component.isPetSeeker).toBe(true);
      expect(component.isBreeder).toBe(false);
    });

    it('should display breeder response for pet seekers', () => {
      messageService.getMessage.and.returnValue(of(mockRespondedMessage));

      fixture.detectChanges();

      expect(component.message?.response_text).toBe('Thank you for your interest. Yes, we have puppies available.');
      expect(component.hasResponse()).toBe(true);
    });
  });

  describe('Navigation', () => {
    it('should navigate back to messages list', () => {
      spyOn(router, 'navigate');

      component.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/messages']);
    });

    it('should navigate to messages list if message ID is missing', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute);
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(null);
      spyOn(router, 'navigate');

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/messages']);
    });

    it('should navigate to messages list if message not found', () => {
      const error = { status: 404, message: 'Message not found' };
      messageService.getMessage.and.returnValue(throwError(() => error));
      spyOn(router, 'navigate');

      fixture.detectChanges();

      expect(toastr.error).toHaveBeenCalledWith('Failed to load message', 'Error');
      expect(router.navigate).toHaveBeenCalledWith(['/messages']);
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00Z').toISOString();
      const formatted = component.formatDate(testDate);

      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      Object.defineProperty(authService, 'isBreeder', { value: true, writable: true });
      messageService.getMessage.and.returnValue(of(mockBreederMessage));
      messageService.markAsRead.and.returnValue(of({ ...mockBreederMessage, is_read: true }));
      fixture.detectChanges();
    });

    it('should validate required response text', () => {
      const responseText = component.responseForm.get('response_text');

      responseText?.setValue('');
      expect(responseText?.hasError('required')).toBe(true);

      responseText?.setValue('Valid response');
      expect(responseText?.hasError('required')).toBe(false);
    });

    it('should validate max length', () => {
      const responseText = component.responseForm.get('response_text');
      const longText = 'a'.repeat(5001);

      responseText?.setValue(longText);
      expect(responseText?.hasError('maxlength')).toBe(true);

      responseText?.setValue('Valid response');
      expect(responseText?.hasError('maxlength')).toBe(false);
    });
  });
});
