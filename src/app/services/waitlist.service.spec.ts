import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { IDepositUpdate, IManualEntryInput, IWaitlistRequestInput, WaitlistService } from './waitlist.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let http: HttpTestingController;
  const base = `${environment.API_URL}/waitlist`;

  beforeEach(() => {
    localStorage.setItem('id_token', 'tok');
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(WaitlistService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('id_token');
  });

  function expectCall(method: string, url: string, body?: unknown) {
    const req = http.expectOne(r => r.url === url && r.method === method);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    if (body !== undefined) {
      expect(req.request.body).toEqual(body);
    }
    req.flush({});
    return req;
  }

  it('getInfo sends breeding_id when given', () => {
    service.getInfo('b1', 5).subscribe();
    const req = expectCall('GET', `${base}/breeders/b1/info`);
    expect(req.request.params.get('breeding_id')).toBe('5');
  });

  it('getInfo omits breeding_id when undefined', () => {
    service.getInfo('b1').subscribe();
    const req = expectCall('GET', `${base}/breeders/b1/info`);
    expect(req.request.params.has('breeding_id')).toBeFalse();
  });

  it('requestSpot', () => {
    const body: IWaitlistRequestInput = { sex_preference: 'Any', request_breeding_id: 5 };
    service.requestSpot('b1', body).subscribe();
    expectCall('POST', `${base}/breeders/b1/requests`, body);
  });

  it('getMine', () => {
    service.getMine().subscribe();
    expectCall('GET', `${base}/mine`);
  });

  it('withdrawMine', () => {
    service.withdrawMine('e1').subscribe();
    expectCall('POST', `${base}/mine/e1/withdraw`);
  });

  it('getBreederWaitlist', () => {
    service.getBreederWaitlist().subscribe();
    expectCall('GET', base);
  });

  it('getLitterWaitlist', () => {
    service.getLitterWaitlist(7).subscribe();
    expectCall('GET', `${base}/breedings/7`);
  });

  it('addManual', () => {
    const body: IManualEntryInput = { contact_name: 'A', contact_email: 'a@b.com' };
    service.addManual(body).subscribe();
    expectCall('POST', `${base}/entries`, body);
  });

  it('approve', () => {
    service.approve('e1').subscribe();
    expectCall('POST', `${base}/entries/e1/approve`);
  });

  it('decline', () => {
    service.decline('e1').subscribe();
    expectCall('POST', `${base}/entries/e1/decline`);
  });

  it('updateDeposit', () => {
    const body: IDepositUpdate = { deposit_status: 'received', deposit_received_on: '2026-01-01' };
    service.updateDeposit('e1', body).subscribe();
    expectCall('PUT', `${base}/entries/e1/deposit`, body);
  });

  it('move to a litter and to general', () => {
    service.move('e1', 3).subscribe();
    expectCall('POST', `${base}/entries/e1/move`, { breeding_id: 3 });
    service.move('e1', null).subscribe();
    expectCall('POST', `${base}/entries/e1/move`, { breeding_id: null });
  });

  it('reorder with and without note', () => {
    service.reorder('e1', 2, 'why').subscribe();
    expectCall('POST', `${base}/entries/e1/reorder`, { position: 2, note: 'why' });
    service.reorder('e1', 2).subscribe();
    const req = expectCall('POST', `${base}/entries/e1/reorder`, { position: 2 });
    expect('note' in req.request.body).toBeFalse();
  });

  it('resetOrder for a litter and general', () => {
    service.resetOrder(4).subscribe();
    expectCall('POST', `${base}/breedings/4/reset-order`);
    service.resetOrder(null).subscribe();
    expectCall('POST', `${base}/general/reset-order`);
  });

  it('match', () => {
    service.match('e1', 'o1').subscribe();
    expectCall('POST', `${base}/entries/e1/match`, { offspring_id: 'o1' });
  });

  it('pass', () => {
    service.pass('e1').subscribe();
    expectCall('POST', `${base}/entries/e1/pass`);
  });

  it('withdraw with and without deposit outcome', () => {
    service.withdraw('e1', 'refunded').subscribe();
    expectCall('POST', `${base}/entries/e1/withdraw`, { deposit_outcome: 'refunded' });
    service.withdraw('e1').subscribe();
    expectCall('POST', `${base}/entries/e1/withdraw`, {});
  });

  it('getEvents', () => {
    service.getEvents('e1').subscribe();
    expectCall('GET', `${base}/entries/e1/events`);
  });

  it('getSettings / updateSettings', () => {
    service.getSettings().subscribe();
    expectCall('GET', `${base}/settings`);
    const body = { deposit_amount: '100', deposit_policy: 'p' };
    service.updateSettings(body).subscribe();
    expectCall('PUT', `${base}/settings`, body);
  });
});
