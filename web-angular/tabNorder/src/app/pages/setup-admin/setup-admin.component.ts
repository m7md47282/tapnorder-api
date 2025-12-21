import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { InputComponent } from '../../components/ui/input/input.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../components/ui/card/card.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-setup-admin',
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
  templateUrl: './setup-admin.component.html',
  styles: []
})
export class SetupAdminComponent implements OnInit {
  setupForm: FormGroup;
  isLoading: boolean = false;
  isSuccess: boolean = false;
  error: string = '';
  isDemoMode: boolean = true; // This would be determined by environment or service

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.setupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    const user = this.authService.getCurrentUser();
    if (user) {
      this.router.navigate(['/admin']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.setupForm.valid) {
      this.isLoading = true;
      this.error = '';
      const { name, email, password } = this.setupForm.value;

      try {
        const userProfile = await this.authService.signUp(email, password, name);
        
        this.toastService.success('Super Admin Created!', `Admin account created successfully for ${name}`);
        this.isSuccess = true;
        
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 2000);
      } catch (error) {
        console.error('Setup admin error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        if (errorMessage.includes('Firebase configuration not found')) {
          this.error = 'Firebase configuration not found. Please check your Firebase setup or use demo mode.';
          this.toastService.error('Firebase Configuration Error', 'Please check FIREBASE_SETUP.md for setup instructions or use demo mode by navigating to /demo');
        } else {
          this.error = 'Failed to create admin account. Please try again.';
          this.toastService.error('Error', errorMessage);
        }
      } finally {
        this.isLoading = false;
      }
    }
  }

  async createDemoAdmin(): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      const userProfile = await this.authService.signUp('admin@demo.com', 'admin123', 'Demo Admin');
      
      this.toastService.success('Demo Admin Created!', `Demo admin account created successfully. Email: admin@demo.com, Password: admin123`);
      this.isSuccess = true;
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/admin']);
      }, 2000);
    } catch (error) {
      console.error('Demo admin creation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('Firebase configuration not found')) {
        this.error = 'Firebase configuration not found. Please check your Firebase setup or use demo mode.';
        this.toastService.error('Firebase Configuration Error', 'Please check FIREBASE_SETUP.md for setup instructions or use demo mode by navigating to /demo');
      } else {
        this.error = 'Failed to create demo admin account.';
        this.toastService.error('Error', errorMessage);
      }
    } finally {
      this.isLoading = false;
    }
  }
}
