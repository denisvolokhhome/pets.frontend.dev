import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ToastrModule } from 'ngx-toastr';

import { MessagesListComponent } from './messages-list.component';
import { MessageService, MessageListItem, MessageListResponse } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { IUser } from '../../../models/user';

describe('MessagesListComponent', () => {
  let component: MessagesListComponent;
  let fixture: ComponentFixture<MessagesListComponent>;
  let messageService: jasmine.SpyObj<MessageService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockBreederUser: IUser = {
    id: 'breeder-123',
    email: 'breeder@example.com',
    name: 'Test Breeder',
    is_breeder: true,
    is_active: true,
    is_verified: true
  };

  const mockPetSeekerUser: IUser = {
    id: 'seeker-123',
    email: 'seeker@example.com',
    name: 'Test Seeker',
    is_breeder: false,
    is_active: true,
    is_verified: true
  };

  const mockBreederMessages: MessageListItem[] = [
    {
      id: 'msg-1',
      sender_name: 'John Doe',
      sender_email: 'john@example.com',
      message_preview: 'I am interested in your puppies...',
      is_read: false,
      responded_at: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'msg-2',
      sender_name: 'Jane Smith',
      sender_email: 'jane@example.com',
      message_preview: 'Do you have any available litters?',
      is_read: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const mockPetSeekerMessages: MessageListItem[] = [
    {
      id: 'msg-3',
      sender_name: 'Test Seeker',
      sender_email: 'seeker@example.com',
      message_preview: 'I am interested in your puppies...',
      is_read: true,
      responded_at: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'msg-4',
      sender_name: 'Test Seeker',
      sender_email: 'seeker@example.com',
      message_preview: 'Thank you for the information',
      is_read: true,
      responded_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  beforeEach(async () => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['getMessages']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isBreeder: true,
      isPetSeeker: false
    });

    await TestBed.configureTestingModule({
      declarations: [MessagesListComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
        ToastrModule.forRoot()
      ],
      providers: [
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesListComponent);
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

    it('should load breeder messages on init', () => {
      const mockResponse: MessageListResponse = {
        messages: mockBreederMessages,
        total: 2,
        unread_count: 1,
        limit: 20,
        offset: 0
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(messageService.getMessages).toHaveBeenCalledWith('all', 0, 20, 'newest');
      expect(component.messages).toEqual(mockBreederMessages);
      expect(component.totalMessages).toBe(2);
      expect(component.unreadCount).toBe(1);
    });

    it('should display breeder-specific subtitle', () => {
      expect(component.getSubtitle()).toBe('Manage inquiries from potential customers');
    });

    it('should show correct status for breeder messages', () => {
      Object.defineProperty(authService, 'isBreeder', { value: true, writable: true });
      Object.defineProperty(authService, 'isPetSeeker', { value: false, writable: true });

      const unreadMessage = mockBreederMessages[0];
      const respondedMessage = mockBreederMessages[1];

      expect(component.getStatusText(unreadMessage)).toBe('New');
      expect(component.getStatusText(respondedMessage)).toBe('Responded');
      expect(component.getStatusClass(unreadMessage)).toBe('status-unread');
      expect(component.getStatusClass(respondedMessage)).toBe('status-responded');
    });

    it('should display breeder-specific empty state message', () => {
      component.statusFilter = 'all';
      expect(component.getEmptyStateMessage()).toBe("You haven't received any messages from potential customers.");
    });
  });

  describe('Pet Seeker View', () => {
    beforeEach(() => {
      Object.defineProperty(authService, 'isBreeder', { value: false, writable: true });
      Object.defineProperty(authService, 'isPetSeeker', { value: true, writable: true });
    });

    it('should load pet seeker messages on init', () => {
      const mockResponse: MessageListResponse = {
        messages: mockPetSeekerMessages,
        total: 2,
        unread_count: 1,
        limit: 20,
        offset: 0
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(messageService.getMessages).toHaveBeenCalledWith('all', 0, 20, 'newest');
      expect(component.messages).toEqual(mockPetSeekerMessages);
      expect(component.totalMessages).toBe(2);
    });

    it('should display pet seeker-specific subtitle', () => {
      expect(component.getSubtitle()).toBe('View your conversations with breeders');
    });

    it('should show correct status for pet seeker messages', () => {
      Object.defineProperty(authService, 'isBreeder', { value: false, writable: true });
      Object.defineProperty(authService, 'isPetSeeker', { value: true, writable: true });

      const pendingMessage = mockPetSeekerMessages[0];
      const respondedMessage = mockPetSeekerMessages[1];

      expect(component.getStatusText(pendingMessage)).toBe('Pending');
      expect(component.getStatusText(respondedMessage)).toBe('Responded');
      expect(component.getStatusClass(pendingMessage)).toBe('status-pending');
      expect(component.getStatusClass(respondedMessage)).toBe('status-responded');
    });

    it('should display pet seeker-specific empty state message', () => {
      component.statusFilter = 'all';
      expect(component.getEmptyStateMessage()).toBe("You haven't sent any messages to breeders yet.");
    });
  });

  describe('Message Linking', () => {
    it('should reflect linked messages in pet seeker view', () => {
      Object.defineProperty(authService, 'isBreeder', { value: false, writable: true });
      Object.defineProperty(authService, 'isPetSeeker', { value: true, writable: true });

      const linkedMessage: MessageListItem = {
        id: 'msg-linked',
        sender_name: 'Test Seeker',
        sender_email: 'seeker@example.com',
        message_preview: 'This message was sent before account creation',
        is_read: true,
        responded_at: null,
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      };

      const mockResponse: MessageListResponse = {
        messages: [linkedMessage, ...mockPetSeekerMessages],
        total: 3,
        unread_count: 1,
        limit: 20,
        offset: 0
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.messages.length).toBe(3);
      expect(component.messages[0]).toEqual(linkedMessage);
    });
  });

  describe('Filtering and Pagination', () => {
    it('should filter messages by status', () => {
      const mockResponse: MessageListResponse = {
        messages: [mockBreederMessages[0]],
        total: 1,
        unread_count: 1,
        limit: 20,
        offset: 0
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      component.onFilterChange('unread');

      expect(messageService.getMessages).toHaveBeenCalledWith('unread', 0, 20, 'newest');
      expect(component.statusFilter).toBe('unread');
      expect(component.currentPage).toBe(0);
    });

    it('should change sort order', () => {
      const mockResponse: MessageListResponse = {
        messages: mockBreederMessages,
        total: 2,
        unread_count: 1,
        limit: 20,
        offset: 0
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      component.onSortChange('oldest');

      expect(messageService.getMessages).toHaveBeenCalledWith('all', 0, 20, 'oldest');
      expect(component.sortOrder).toBe('oldest');
    });

    it('should navigate to next page', () => {
      component.totalMessages = 50;
      component.pageSize = 20;
      component.currentPage = 0;

      const mockResponse: MessageListResponse = {
        messages: [],
        total: 50,
        unread_count: 0,
        limit: 20,
        offset: 20
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      component.nextPage();

      expect(component.currentPage).toBe(1);
      expect(messageService.getMessages).toHaveBeenCalledWith('all', 20, 20, 'newest');
    });

    it('should navigate to previous page', () => {
      component.currentPage = 1;

      const mockResponse: MessageListResponse = {
        messages: [],
        total: 50,
        unread_count: 0,
        limit: 20,
        offset: 0
      };

      messageService.getMessages.and.returnValue(of(mockResponse));

      component.previousPage();

      expect(component.currentPage).toBe(0);
      expect(messageService.getMessages).toHaveBeenCalledWith('all', 0, 20, 'newest');
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading messages fails', () => {
      const error = { message: 'Failed to load messages' };
      messageService.getMessages.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(component.messages.length).toBe(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format recent dates correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000).toISOString();
      const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString();
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();

      expect(component.formatDate(fiveMinutesAgo)).toContain('minute');
      expect(component.formatDate(twoHoursAgo)).toContain('hour');
      expect(component.formatDate(threeDaysAgo)).toContain('day');
    });
  });
});
