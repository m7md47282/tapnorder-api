import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['signIn', 'signInWithGoogle', 'getCurrentUserRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    toastServiceSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate required fields', () => {
    component.loginForm.patchValue({ email: '', password: '' });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should validate email format', () => {
    component.loginForm.patchValue({ email: 'invalid-email', password: 'password' });
    expect(component.loginForm.get('email')?.hasError('email')).toBeTrue();
  });

  it('should handle successful login', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    const mockUserRole = { uid: '123', email: 'test@example.com', role: 'customer', displayName: 'Test User', createdAt: new Date() };
    
    authServiceSpy.signIn.and.returnValue(Promise.resolve(mockUser as any));
    authServiceSpy.getCurrentUserRole.and.returnValue(of(mockUserRole));

    component.loginForm.patchValue({ email: 'test@example.com', password: 'password' });
    await component.onSubmit();

    expect(authServiceSpy.signIn).toHaveBeenCalledWith('test@example.com', 'password');
    expect(routerSpy.navigate).toHaveBeenCalled();
  });

  it('should handle login error', async () => {
    authServiceSpy.signIn.and.returnValue(Promise.reject(new Error('Login failed')));

    component.loginForm.patchValue({ email: 'test@example.com', password: 'password' });
    await component.onSubmit();

    expect(component.error).toBe('Login failed');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });
});
