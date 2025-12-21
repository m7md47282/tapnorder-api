import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];
    
    return this.authService.userRole$.pipe(
      take(1),
      map(userRole => {
        if (!userRole) {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }

        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.includes(userRole.role);
          if (!hasRequiredRole) {
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          // If user is already logged in, redirect to appropriate dashboard
          const userRole = this.authService.getCurrentUserRole();
          if (userRole) {
            switch (userRole.role) {
              case 'admin':
                this.router.navigate(['/admin']);
                break;
              case 'cashier':
                this.router.navigate(['/cashier']);
                break;
              case 'kitchen':
                this.router.navigate(['/kitchen']);
                break;
              default:
                this.router.navigate(['/menu']);
            }
          } else {
            this.router.navigate(['/menu']);
          }
          return false;
        }
        return true;
      })
    );
  }
}
