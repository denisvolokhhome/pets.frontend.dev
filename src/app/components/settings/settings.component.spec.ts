import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SettingsComponent } from './settings.component';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

describe('SettingsComponent waitlist section', () => {
  const original = environment.enableWaitlist;
  afterEach(() => { environment.enableWaitlist = original; });

  function labels(flag: boolean, isBreeder: boolean): string[] {
    environment.enableWaitlist = flag;
    TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { isBreeder, isServiceProvider: false } }]
    });
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.sidebar-nav-item'))
      .map(b => b.textContent!.trim());
  }

  it('flag off: hidden for breeders', () => {
    expect(labels(false, true)).not.toContain('Waitlist');
  });
  it('flag on + breeder: visible', () => {
    expect(labels(true, true)).toContain('Waitlist');
  });
  it('flag on + non-breeder: hidden', () => {
    expect(labels(true, false)).not.toContain('Waitlist');
  });
});
