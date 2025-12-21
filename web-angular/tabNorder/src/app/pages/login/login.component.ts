import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { InputComponent } from '../../components/ui/input/input.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../components/ui/card/card.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent
  ],
  templateUrl: './login.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    const user = this.authService.getCurrentUser();
    if (user) {
      this.router.navigate(['/admin']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = '';
      const { email, password } = this.loginForm.value;

      try {
        await this.authService.signIn(email, password);
        this.isLoading = false;
        this.toastService.success('Success', 'Signed in successfully!');
        
        // Get user role and redirect
        const userRole = this.authService.getCurrentUserRole();
        if (userRole?.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (userRole?.role === 'cashier') {
          this.router.navigate(['/cashier']);
        } else if (userRole?.role === 'kitchen') {
          this.router.navigate(['/kitchen']);
        } else {
          this.router.navigate(['/']);
        }
        this.cdr.markForCheck();
      } catch (error) {
        this.isLoading = false;
        this.error = 'Invalid email or password. Please try again.';
        this.toastService.error('Error', 'Failed to sign in. Please check your credentials.');
        console.error('Login error:', error);
        this.cdr.markForCheck();
      }
    }
  }

  async onGoogleSignIn(): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      await this.authService.signInWithGoogle();
      this.isLoading = false;
      this.toastService.success('Success', 'Signed in successfully!');
      
      // Get user role and redirect
      const userRole = this.authService.getCurrentUserRole();
      if (userRole?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else if (userRole?.role === 'cashier') {
        this.router.navigate(['/cashier']);
      } else if (userRole?.role === 'kitchen') {
        this.router.navigate(['/kitchen']);
      } else {
        this.router.navigate(['/']);
      }
      this.cdr.markForCheck();
    } catch (error) {
      this.isLoading = false;
      this.error = 'Failed to sign in with Google. Please try again.';
      this.toastService.error('Error', 'Failed to sign in with Google. Please try again.');
      console.error('Google sign in error:', error);
      this.cdr.markForCheck();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();
  }
}
