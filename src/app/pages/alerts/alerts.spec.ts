import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alerts } from './alerts';
import { commonTestProviders } from '../../testing/test-providers';

describe('Alerts', () => {
  let component: Alerts;
  let fixture: ComponentFixture<Alerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alerts],
      providers: commonTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Alerts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
