import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let firebaseServiceSpy: jasmine.SpyObj<FirebaseService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('FirebaseService', ['getAuth', 'getDoc', 'setDoc']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseService, useValue: spy }
      ]
    });
    service = TestBed.inject(AuthService);
    firebaseServiceSpy = TestBed.inject(FirebaseService) as jasmine.SpyObj<FirebaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get current user', (done) => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    service.getCurrentUser().subscribe(user => {
      expect(user).toBe(mockUser);
      done();
    });
  });

  it('should get current user role', (done) => {
    const mockUserRole = { uid: '123', email: 'test@example.com', role: 'customer', displayName: 'Test User', createdAt: new Date() };
    service.getCurrentUserRole().subscribe(role => {
      expect(role).toBe(mockUserRole);
      done();
    });
  });
});
