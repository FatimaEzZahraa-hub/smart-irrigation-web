import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PumpControl } from './pump-control';
import { commonTestProviders } from '../../testing/test-providers';

describe('PumpControl', () => {
  let component: PumpControl;
  let fixture: ComponentFixture<PumpControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PumpControl],
      providers: commonTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(PumpControl);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
