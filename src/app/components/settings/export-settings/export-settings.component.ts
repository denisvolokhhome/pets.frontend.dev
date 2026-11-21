import { Component, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, Subject, Subscription, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DataExport } from '../../../models/data-export';
import { DataExportService } from '../../../services/data-export.service';

export type ExportViewState = 'loading' | 'none' | 'preparing' | 'ready' | 'failed';

const POLL_MS = 3000;

@Component({
  standalone: false,
  selector: 'app-export-settings',
  templateUrl: './export-settings.component.html',
  styleUrls: ['./export-settings.component.css'],
})
export class ExportSettingsComponent implements OnInit, OnDestroy {
  state: ExportViewState = 'loading';
  current: DataExport | null = null;
  loadError = false;
  isStarting = false;
  isDownloading = false;
  downloadError = '';
  private poll?: Subscription;
  private readonly destroy$ = new Subject<void>();

  constructor(private exports: DataExportService) {}

  ngOnInit(): void {
    this.exports.latest().pipe(takeUntil(this.destroy$)).subscribe({
      next: e => this.apply(e),
      error: () => { this.loadError = true; this.state = 'none'; },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }

  startExport(): void {
    if (this.isStarting) return;
    this.isStarting = true;
    this.downloadError = '';
    this.exports.start().pipe(takeUntil(this.destroy$)).subscribe({
      next: e => { this.isStarting = false; this.apply(e); },
      error: () => { this.isStarting = false; this.loadError = true; },
    });
  }

  download(): void {
    if (!this.current || this.isDownloading) return;
    this.isDownloading = true;
    this.downloadError = '';
    this.exports.downloadLink(this.current.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ url }) => { this.isDownloading = false; this.navigate(`${environment.API_HOST}${url}`); },
      error: err => {
        this.isDownloading = false;
        if (err?.status === 410) {
          this.apply({ ...this.current!, is_expired: true });
        } else {
          this.downloadError = 'Could not start the download. Please try again.';
        }
      },
    });
  }

  /** Native browser download (progress + resume); separate so specs can spy on it. */
  navigate(url: string): void {
    window.location.href = url;
  }

  get sizeLabel(): string {
    const bytes = this.current?.file_size ?? 0;
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private apply(e: DataExport | null): void {
    this.loadError = false;
    this.current = e;
    if (!e || (e.status === 'ready' && e.is_expired)) {
      this.state = 'none';
    } else if (e.status === 'pending' || e.status === 'running') {
      this.state = 'preparing';
    } else {
      this.state = e.status;
    }
    if (this.state === 'preparing') this.startPolling(); else this.stopPolling();
  }

  private startPolling(): void {
    if (this.poll || this.destroy$.isStopped) return;
    this.poll = timer(POLL_MS, POLL_MS)
      .pipe(
        // A failed poll (e.g. a 502 during a deploy) is skipped; the next tick tries again
        switchMap(() => this.exports.latest().pipe(catchError(() => EMPTY))),
        takeUntil(this.destroy$),
      )
      .subscribe(e => this.apply(e));
  }

  private stopPolling(): void {
    this.poll?.unsubscribe();
    this.poll = undefined;
  }
}
