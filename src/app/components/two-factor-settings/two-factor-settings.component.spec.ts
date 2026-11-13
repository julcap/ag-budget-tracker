import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TwoFactorSettingsComponent } from './two-factor-settings.component';
import { AuthService } from '../../services/auth.service';

describe('TwoFactorSettingsComponent', () => {
  let fixture: ComponentFixture<TwoFactorSettingsComponent>;
  let component: TwoFactorSettingsComponent;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorSettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.login('sam', 'password1').subscribe();
    http.expectOne('/api/auth/login').flush({
      token: 't', user: { id: 1, username: 'sam', email: null, is_admin: false, totp_enabled: false }
    });
    fixture = TestBed.createComponent(TwoFactorSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('budget_session_token');
  });

  it('enrols: shows the QR code and secret, then turns 2FA on with a valid code', () => {
    component.startSetup();
    http.expectOne('/api/auth/totp/setup').flush({ secret: 'ABCDEF', otpauthUri: 'otpauth://x', qrCodeDataUrl: 'data:image/png;base64,AA==' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img.qr').getAttribute('src')).toContain('data:image/png');
    expect(fixture.nativeElement.textContent).toContain('ABCDEF');

    component.code.setValue('123456');
    component.confirmSetup();
    http.expectOne('/api/auth/totp/enable').flush({ totp_enabled: true });
    expect(component.enabled()).toBeTrue();
    expect(component.mode()).toBe('idle');
    expect(component.notice()).toContain('on');
  });

  it('keeps the setup open and shows the error for a wrong code', () => {
    component.startSetup();
    http.expectOne('/api/auth/totp/setup').flush({ secret: 'A', otpauthUri: 'o', qrCodeDataUrl: 'd' });
    component.code.setValue('000000');
    component.confirmSetup();
    http.expectOne('/api/auth/totp/enable').flush({ error: 'Incorrect code' }, { status: 400, statusText: 'Bad Request' });
    expect(component.mode()).toBe('setup');
    expect(component.error()).toBe('Incorrect code');
  });

  it('turns 2FA off with password and code', () => {
    auth.updateUser({ totp_enabled: true });
    component.startDisable();
    component.disableForm.setValue({ password: 'password1', code: '123456' });
    component.confirmDisable();
    const req = http.expectOne('/api/auth/totp/disable');
    expect(req.request.body).toEqual({ password: 'password1', code: '123456' });
    req.flush({ totp_enabled: false });
    expect(component.enabled()).toBeFalse();
  });
});
