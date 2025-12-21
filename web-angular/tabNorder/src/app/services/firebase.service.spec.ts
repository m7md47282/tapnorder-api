import { TestBed } from '@angular/core/testing';
import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get auth instance', () => {
    const auth = service.getAuth();
    expect(auth).toBeDefined();
  });

  it('should get firestore instance', () => {
    const db = service.getFirestore();
    expect(db).toBeDefined();
  });

  it('should get storage instance', () => {
    const storage = service.getStorage();
    expect(storage).toBeDefined();
  });
});
