import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { History } from './history';
import { DeviceService } from '../../services/device.service';
import { PumpService } from '../../services/pump.service';
import { SensorService } from '../../services/sensor.service';
import { commonTestProviders } from '../../testing/test-providers';

describe('History', () => {
  let component: History;
  let fixture: ComponentFixture<History>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [History],
      providers: [
        ...commonTestProviders,
        {
          provide: DeviceService,
          useValue: {
            getDevices: () => of([])
          }
        },
        {
          provide: SensorService,
          useValue: {
            getHistory: () => of([])
          }
        },
        {
          provide: PumpService,
          useValue: {
            history: () => of([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(History);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
