import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), AuthService]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.toggleShowPassword();
    expect(component.showPassword()).toBeTrue();
    component.toggleShowPassword();
    expect(component.showPassword()).toBeFalse();
  });

  it('should mark fields touched and not submit when form is invalid', () => {
    component.form.setValue({ email: '', password: '' });
    component.submit();
    expect(component.form.touched).toBeTrue();
    expect(component.signedIn()).toBeFalse();
  });

  it('should sign in successfully with valid credentials', () => {
    spyOn(authService, 'login');
    component.form.setValue({
      email: 'user@example.com',
      password: 'password123'
    });
    component.submit();
    expect(component.signedIn()).toBeTrue();
    expect(authService.login).toHaveBeenCalled();
  });
});
