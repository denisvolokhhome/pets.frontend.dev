export type DataExportStatus = 'pending' | 'running' | 'ready' | 'failed';

export interface DataExport {
  id: string;
  status: DataExportStatus;
  file_size: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
}
