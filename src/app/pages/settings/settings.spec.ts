import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Settings } from './settings';
import { commonTestProviders } from '../../testing/test-providers';
import { AuthService } from '../../services/auth.service';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        ...commonTestProviders,
        {
          provide: AuthService,
          useValue: {
            profile: () => of({
              fullName: 'Test User',
              email: 'test@example.com',
              role: 'admin',
              createdAt: '2026-01-01T00:00:00.000Z'
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
