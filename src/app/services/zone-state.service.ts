import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ZoneStateService {
  private _zoneId = '';

  get selectedZoneId(): string {
    return this._zoneId;
  }

  setZone(id: string): void {
    if (id && id !== this._zoneId) {
      this._zoneId = id;
    }
  }
}
