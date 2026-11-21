import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService } from './data.service';
import { OffspringService } from './offspring.service';

describe('Image rotation API calls', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('rotates a pet image clockwise', () => {
    TestBed.inject(DataService).rotatePetImage('p1', 7, 90).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/pets/p1/image/7/rotate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ degrees: 90 });
    req.flush({});
  });

  it('rotates an offspring image', () => {
    TestBed.inject(OffspringService).rotateOffspringImage('o1', 'i1', 90).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/offsprings/o1/images/i1/rotate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ degrees: 90 });
    req.flush({});
  });

  it('rotates the profile image', () => {
    TestBed.inject(DataService).rotateProfileImage(90).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/users/me/profile-image/rotate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ degrees: 90 });
    req.flush({ profile_image_path: 'app/x.jpg', message: 'ok' });
  });
});
