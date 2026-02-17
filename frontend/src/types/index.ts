export interface PipelineRun {
  id: number;
  pipeline_name: string;
  status: 'running' | 'success' | 'failed';
  started_at: string;
  completed_at: string | null;
  records_processed: number;
  error_message: string | null;
  logs: string | null;
}

export interface PipelineTriggerResponse {
  status: string;
  message: string;
  run_id: number;
}

export interface Stats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  latest_runs: {
    [key: string]: {
      status: string;
      started_at: string;
      records_processed: number;
    };
  };
}

export interface Schedule {
  id: string;
  pipeline_name: string;
  cron_expression: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface PipelineConfig {
  name: string;
  displayName: string;
  description: string;
  icon: string;
}
