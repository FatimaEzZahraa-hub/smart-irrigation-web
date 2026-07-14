import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { DeviceService, DeviceZone } from '../../services/device.service';
import { SensorService } from '../../services/sensor.service';
import { PumpService } from '../../services/pump.service';
import { ZoneStateService } from '../../services/zone-state.service';
import { Sensor } from '../../models/sensor';
import { JournalPompe } from '../../models/pump';

type DateRangeFilter = 'today' | 'week' | 'month' | 'custom';
type SortDirection = 'asc' | 'desc';
type HistorySortKey = 'date' | 'time' | 'humidity' | 'temperature' | 'waterLevel' | 'pumpStatus';

interface HistoryRow {
  id: number;
  recordedAt: Date;
  dateText: string;
  timeText: string;
  humidity: number;
  temperature: number;
  waterLevel: number | null;
  pumpStatus: 'ON' | 'OFF' | 'UNKNOWN';
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History {
  history: Sensor[] = [];
  pumpHistory: JournalPompe[] = [];
  zones: DeviceZone[] = [];
  selectedZoneId = '';
  selectedRange: DateRangeFilter = 'today';
  startDate = '';
  endDate = '';
  sortKey: HistorySortKey = 'date';
  sortDirection: SortDirection = 'desc';
  pageSize = 10;
  currentPage = 1;
  isLoading = false;
  errorMessage = '';

  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private deviceService: DeviceService,
    private sensorService: SensorService,
    private pumpService: PumpService,
    private translate: TranslateService,
    private zoneState: ZoneStateService
  ) {
    this.setDateRange('today', false);
    this.loadZones();
  }

  filteredRows: HistoryRow[] = [];

  get paginatedRows(): HistoryRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get pageStart(): number {
    if (!this.filteredRows.length) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
  }

  averageSoil = 0;
  averageTemperature = 0;
  averageWaterLevel = '-';

  applyFilters(): void {
    if (!this.selectedZoneId) {
      this.history = [];
      this.pumpHistory = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = 1;

    forkJoin({
      sensors: this.sensorService.getHistory(this.selectedZoneId, {
        startDate: this.startDate,
        endDate: this.endDate,
        type: 'all'
      }).pipe(catchError(() => {
        this.errorMessage = 'HISTORY.ERROR';
        return of([] as Sensor[]);
      })),
      pumps: this.pumpService.history(this.selectedZoneId).pipe(catchError(() => of([])))
    })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(({ sensors, pumps }) => {
        this.history = sensors;
        this.pumpHistory = Array.isArray(pumps) ? pumps as JournalPompe[] : [];
        this.recomputeFiltered();
      });
  }

  resetFilters(): void {
    this.sortKey = 'date';
    this.sortDirection = 'desc';
    this.pageSize = 10;
    this.setDateRange('today');
  }

  setDateRange(range: DateRangeFilter, shouldApply = true): void {
    this.selectedRange = range;

    if (range !== 'custom') {
      const { start, end } = this.getRangeDates(range);
      this.startDate = this.toInputDate(start);
      this.endDate = this.toInputDate(end);
    }

    this.currentPage = 1;

    if (shouldApply) {
      this.applyFilters();
    }
  }

  onCustomDateChange(): void {
    this.selectedRange = 'custom';
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  sortBy(key: HistorySortKey): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = key === 'date' || key === 'time' ? 'desc' : 'asc';
    }

    this.currentPage = 1;
    this.recomputeFiltered();
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
  }

  exportExcel(): void {
    const rows = this.filteredRows;
    const headers = [
      this.translate.instant('HISTORY.DATE'),
      this.translate.instant('HISTORY.TIME'),
      `${this.translate.instant('HISTORY.HUMIDITY')} (%)`,
      `${this.translate.instant('HISTORY.TEMPERATURE')} (C)`,
      `${this.translate.instant('HISTORY.WATER_LEVEL')} (%)`,
      this.translate.instant('HISTORY.PUMP_STATE')
    ];
    const csvRows = [headers, ...rows.map((row) => [
      row.dateText,
      row.timeText,
      String(row.humidity),
      String(row.temperature),
      row.waterLevel === null ? '' : String(row.waterLevel),
      this.getPumpStatusText(row.pumpStatus)
    ])];

    const csv = csvRows.map((row) => row.map((value) => this.escapeCsvValue(value)).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `historique-irrigation-${this.toInputDate(new Date())}.csv`);
  }

  exportPdf(): void {
    const rows = this.filteredRows;
    const htmlRows = rows.map((row) => `
      <tr>
        <td>${this.escapeHtml(row.dateText)}</td>
        <td>${this.escapeHtml(row.timeText)}</td>
        <td>${row.humidity}%</td>
        <td>${row.temperature} C</td>
        <td>${row.waterLevel === null ? '-' : `${row.waterLevel}%`}</td>
        <td>${this.escapeHtml(this.getPumpStatusText(row.pumpStatus))}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1024,height=720');

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${this.escapeHtml(this.translate.instant('HISTORY.EXPORT_TITLE'))}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #172033; margin: 32px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            p { color: #64748b; margin: 0 0 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d9e2ec; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${this.escapeHtml(this.translate.instant('HISTORY.EXPORT_TITLE'))}</h1>
          <p>${this.escapeHtml(this.startDate)} - ${this.escapeHtml(this.endDate)}</p>
          <table>
            <thead>
              <tr>
                <th>${this.escapeHtml(this.translate.instant('HISTORY.DATE'))}</th>
                <th>${this.escapeHtml(this.translate.instant('HISTORY.TIME'))}</th>
                <th>${this.escapeHtml(this.translate.instant('HISTORY.HUMIDITY'))}</th>
                <th>${this.escapeHtml(this.translate.instant('HISTORY.TEMPERATURE'))}</th>
                <th>${this.escapeHtml(this.translate.instant('HISTORY.WATER_LEVEL'))}</th>
                <th>${this.escapeHtml(this.translate.instant('HISTORY.PUMP_STATE'))}</th>
              </tr>
            </thead>
            <tbody>${htmlRows || `<tr><td colspan="6">${this.escapeHtml(this.translate.instant('HISTORY.EXPORT_EMPTY'))}</td></tr>`}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  getSortIcon(key: HistorySortKey): string {
    if (this.sortKey !== key) {
      return 'unfold_more';
    }

    return this.sortDirection === 'asc' ? 'expand_less' : 'expand_more';
  }

  getPumpStatusLabel(status: HistoryRow['pumpStatus']): string {
    return `HISTORY.PUMP_STATUS.${status}`;
  }

  getPumpStatusClass(status: HistoryRow['pumpStatus']): string {
    return status.toLowerCase();
  }

  private loadZones(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deviceService.getDevices()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (zones) => {
          this.zones = zones;
          const saved = this.zoneState.selectedZoneId;
          const match = saved && zones.some((z) => String(z.id) === saved);
          this.selectedZoneId = match ? saved : (zones.length ? String(zones[0].id) : '');
          this.applyFilters();
        },
        error: () => {
          this.history = [];
          this.errorMessage = 'HISTORY.ERROR';
        }
      });
  }

  private recomputeFiltered(): void {
    this.filteredRows = this.history
      .map((item) => this.toHistoryRow(item))
      .filter((row) => this.isWithinSelectedRange(row.recordedAt))
      .sort((a, b) => this.compareRows(a, b));

    this.averageSoil = this.getAverage('humidity');
    this.averageTemperature = this.getAverage('temperature');
    const waterValues = this.filteredRows
      .map((row) => row.waterLevel)
      .filter((v): v is number => v !== null);
    this.averageWaterLevel = waterValues.length
      ? `${Math.round(waterValues.reduce((sum, v) => sum + v, 0) / waterValues.length)}%`
      : '-';
  }

  private toHistoryRow(item: Sensor): HistoryRow {
    const recordedAt = new Date(item.enregistre_le);
    const humidity = Math.round(Number(item.humidite_sol ?? item.metric_value ?? 0));
    const temperature = Math.round(Number(item.temperature ?? 0));
    const waterLevel = this.getWaterLevel(item);
    const pumpStatus = this.getPumpStatusForDate(recordedAt);
    const dateText = recordedAt.toLocaleDateString();
    const timeText = recordedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      id: item.id,
      recordedAt,
      dateText,
      timeText,
      humidity,
      temperature,
      waterLevel,
      pumpStatus
    };
  }

  private getWaterLevel(item: Sensor): number | null {
    const value = (item as Sensor & { niveau_eau?: number; water_level?: number; niveauEau?: number }).niveau_eau
      ?? (item as Sensor & { water_level?: number }).water_level
      ?? (item as Sensor & { niveauEau?: number }).niveauEau;

    return value === undefined || value === null ? null : Math.round(Number(value));
  }

  private getPumpStatusForDate(recordedAt: Date): HistoryRow['pumpStatus'] {
    const beforeOrAtDate = this.pumpHistory
      .filter((entry) => this.getPumpDate(entry) <= recordedAt)
      .sort((a, b) => this.getPumpDate(b).getTime() - this.getPumpDate(a).getTime())[0];

    return beforeOrAtDate?.action || 'UNKNOWN';
  }

  private getPumpDate(entry: JournalPompe): Date {
    return new Date(entry.declenche_le || 0);
  }

  private getAverage(field: 'humidity' | 'temperature'): number {
    if (!this.filteredRows.length) {
      return 0;
    }

    const total = this.filteredRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
    return Math.round(total / this.filteredRows.length);
  }

  private isWithinSelectedRange(date: Date): boolean {
    if (!this.startDate && !this.endDate) {
      return true;
    }

    const time = date.getTime();
    const start = this.startDate ? new Date(`${this.startDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = this.endDate ? new Date(`${this.endDate}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

    return time >= start && time <= end;
  }

  private getRangeDates(range: Exclude<DateRangeFilter, 'custom'>): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (range === 'today') {
      return { start, end };
    }

    if (range === 'week') {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      return { start, end };
    }

    start.setDate(1);
    return { start, end };
  }

  private compareRows(a: HistoryRow, b: HistoryRow): number {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    const valueA = this.getSortValue(a);
    const valueB = this.getSortValue(b);

    if (valueA < valueB) {
      return -1 * direction;
    }

    if (valueA > valueB) {
      return 1 * direction;
    }

    return 0;
  }

  private getSortValue(row: HistoryRow): string | number {
    switch (this.sortKey) {
      case 'date':
      case 'time':
        return row.recordedAt.getTime();
      case 'humidity':
        return row.humidity;
      case 'temperature':
        return row.temperature;
      case 'waterLevel':
        return row.waterLevel ?? -1;
      case 'pumpStatus':
        return row.pumpStatus;
    }
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getPumpStatusText(status: HistoryRow['pumpStatus']): string {
    if (status === 'ON') {
      return this.translate.instant('HISTORY.PUMP_STATUS.ON');
    }

    if (status === 'OFF') {
      return this.translate.instant('HISTORY.PUMP_STATUS.OFF');
    }

    return this.translate.instant('HISTORY.PUMP_STATUS.UNKNOWN');
  }

  private escapeCsvValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
