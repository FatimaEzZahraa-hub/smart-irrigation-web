import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { commonTestProviders } from '../../testing/test-providers';
import { DeviceService } from '../../services/device.service';
import { SensorService } from '../../services/sensor.service';
import { WeatherService } from '../../services/weather.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
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
            getLatest: () => of({
              humidite_sol: 50,
              temperature: 22,
              humidite_air: 60
            })
          }
        },
        {
          provide: WeatherService,
          useValue: {
            getIconUrl: () => '',
            getZoneWeather: () => of({
              location: 'Zone A',
              temperature: 22,
              humidity: 60,
              description: 'clear',
              icon: '01d'
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
