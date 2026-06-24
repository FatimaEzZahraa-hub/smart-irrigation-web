import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { PumpService } from './pump.service';
import { commonTestProviders } from '../testing/test-providers';

describe('PumpService', () => {
  let service: PumpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestProviders,
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PumpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request pump activation', () => {
    service.turnOn('zone-1').subscribe();

    const request = httpMock.expectOne('http://localhost:3000/pump/on');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ deviceId: 'zone-1' });
    request.flush({});
  });
});
