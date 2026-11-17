import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MessageService } from './message.service';

describe('MessageService.sendThreadMessage', () => {
  let svc: MessageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(MessageService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('keeps direct replies in their thread by sending thread_id', () => {
    svc.sendThreadMessage({ receiver_id: 'b1', message: 'hi', thread_id: 't1' } as any).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/messages/direct'));
    expect(req.request.body).toEqual({ receiver_id: 'b1', message: 'hi', thread_id: 't1' });
    req.flush({});
  });

  it('omits thread_id for a brand-new direct conversation', () => {
    svc.sendThreadMessage({ receiver_id: 'b1', message: 'hi' } as any).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/messages/direct'));
    expect(req.request.body).toEqual({ receiver_id: 'b1', message: 'hi' });
    req.flush({});
  });
});
