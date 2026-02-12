import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessageService, MessageCreate, Message, MessageListResponse, UnreadCountResponse, MessageSendResponse, MessageResponseCreate } from './message.service';
import { environment } from 'src/environments/environment';

describe('MessageService', () => {
  let service: MessageService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MessageService]
    });
    service = TestBed.inject(MessageService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('test_token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendMessage', () => {
    it('should send a message to a breeder', () => {
      const messageData: MessageCreate = {
        breeder_id: 'breeder-123',
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'I am interested in your puppies'
      };

      const mockResponse: MessageSendResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };

      service.sendMessage(messageData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toContain('sent to the breeder');
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/send`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(messageData);
      req.flush(mockResponse);
    });

    it('should send a message without message text', () => {
      const messageData: MessageCreate = {
        breeder_id: 'breeder-123',
        sender_name: 'Jane Smith',
        sender_email: 'jane@example.com'
      };

      const mockResponse: MessageSendResponse = {
        success: true,
        message: 'Your message has been sent to the breeder'
      };

      service.sendMessage(messageData).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/send`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle error when breeder not found', () => {
      const messageData: MessageCreate = {
        breeder_id: 'invalid-id',
        sender_name: 'John Doe',
        sender_email: 'john@example.com'
      };

      service.sendMessage(messageData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('not found');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/messages/send`);
      req.flush({ detail: 'Breeder not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getMessages', () => {
    it('should get all messages with default parameters', () => {
      const mockResponse: MessageListResponse = {
        messages: [
          {
            id: 'msg-1',
            sender_name: 'User 1',
            sender_email: 'user1@example.com',
            message_preview: 'Preview 1',
            is_read: false,
            responded_at: null,
            created_at: '2026-02-11T10:00:00Z'
          }
        ],
        total: 1,
        unread_count: 1,
        limit: 20,
        offset: 0
      };

      service.getMessages().subscribe(response => {
        expect(response.messages.length).toBe(1);
        expect(response.total).toBe(1);
        expect(response.unread_count).toBe(1);
      });

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/messages/` &&
        req.params.get('status') === 'all' &&
        req.params.get('skip') === '0' &&
        req.params.get('limit') === '20' &&
        req.params.get('sort') === 'newest'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test_token');
      req.flush(mockResponse);
    });

    it('should filter messages by unread status', () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 0,
        unread_count: 0,
        limit: 20,
        offset: 0
      };

      service.getMessages('unread').subscribe();

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/messages/` &&
        req.params.get('status') === 'unread'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should paginate messages', () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 50,
        unread_count: 10,
        limit: 10,
        offset: 20
      };

      service.getMessages('all', 20, 10).subscribe(response => {
        expect(response.offset).toBe(20);
        expect(response.limit).toBe(10);
      });

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/messages/` &&
        req.params.get('skip') === '20' &&
        req.params.get('limit') === '10'
      );
      req.flush(mockResponse);
    });

    it('should sort messages by oldest', () => {
      const mockResponse: MessageListResponse = {
        messages: [],
        total: 0,
        unread_count: 0,
        limit: 20,
        offset: 0
      };

      service.getMessages('all', 0, 20, 'oldest').subscribe();

      const req = httpMock.expectOne(req => 
        req.url === `${apiUrl}/messages/` &&
        req.params.get('sort') === 'oldest'
      );
      req.flush(mockResponse);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread message count', () => {
      const mockResponse: UnreadCountResponse = {
        unread_count: 5
      };

      service.getUnreadCount().subscribe(response => {
        expect(response.unread_count).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/unread-count`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test_token');
      req.flush(mockResponse);
    });

    it('should handle zero unread messages', () => {
      const mockResponse: UnreadCountResponse = {
        unread_count: 0
      };

      service.getUnreadCount().subscribe(response => {
        expect(response.unread_count).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/unread-count`);
      req.flush(mockResponse);
    });
  });

  describe('getMessage', () => {
    it('should get a single message by ID', () => {
      const mockMessage: Message = {
        id: 'msg-1',
        breeder_id: 'breeder-123',
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'Full message text',
        is_read: false,
        response_text: null,
        responded_at: null,
        created_at: '2026-02-11T10:00:00Z',
        updated_at: null
      };

      service.getMessage('msg-1').subscribe(message => {
        expect(message.id).toBe('msg-1');
        expect(message.sender_name).toBe('John Doe');
        expect(message.message).toBe('Full message text');
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/msg-1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test_token');
      req.flush(mockMessage);
    });

    it('should handle message not found error', () => {
      service.getMessage('invalid-id').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('not found');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/messages/invalid-id`);
      req.flush({ detail: 'Message not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('markAsRead', () => {
    it('should mark a message as read', () => {
      const mockMessage: Message = {
        id: 'msg-1',
        breeder_id: 'breeder-123',
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'Test message',
        is_read: true,
        response_text: null,
        responded_at: null,
        created_at: '2026-02-11T10:00:00Z',
        updated_at: '2026-02-11T10:05:00Z'
      };

      service.markAsRead('msg-1').subscribe(message => {
        expect(message.is_read).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/msg-1/read`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test_token');
      req.flush(mockMessage);
    });
  });

  describe('respondToMessage', () => {
    it('should send a response to a message', () => {
      const responseData: MessageResponseCreate = {
        response_text: 'Thank you for your interest!'
      };

      const mockMessage: Message = {
        id: 'msg-1',
        breeder_id: 'breeder-123',
        sender_name: 'John Doe',
        sender_email: 'john@example.com',
        message: 'Test message',
        is_read: true,
        response_text: 'Thank you for your interest!',
        responded_at: '2026-02-11T10:10:00Z',
        created_at: '2026-02-11T10:00:00Z',
        updated_at: '2026-02-11T10:10:00Z'
      };

      service.respondToMessage('msg-1', responseData).subscribe(message => {
        expect(message.response_text).toBe('Thank you for your interest!');
        expect(message.responded_at).not.toBeNull();
        expect(message.is_read).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/messages/msg-1/respond`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(responseData);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test_token');
      req.flush(mockMessage);
    });

    it('should handle validation error for empty response', () => {
      const responseData: MessageResponseCreate = {
        response_text: ''
      };

      service.respondToMessage('msg-1', responseData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('Validation error');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/messages/msg-1/respond`);
      req.flush({ detail: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized error', () => {
      service.getMessages().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('Unauthorized');
        }
      );

      const req = httpMock.expectOne(req => req.url === `${apiUrl}/messages/`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 forbidden error', () => {
      service.getMessage('msg-1').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('forbidden');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/messages/msg-1`);
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 500 server error', () => {
      service.getUnreadCount().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('Server error');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/messages/unread-count`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', () => {
      const messageData: MessageCreate = {
        breeder_id: 'breeder-123',
        sender_name: 'John Doe',
        sender_email: 'john@example.com'
      };

      service.sendMessage(messageData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('Error');
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/messages/send`);
      req.error(new ProgressEvent('Network error'));
    });
  });
});
