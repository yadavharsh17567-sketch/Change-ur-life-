export type PipelineStatus = 'waiting' | 'starting' | 'processing' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStatus;
  progress: number;
  timestamp?: string;
  error?: string;
}

export interface PipelineTask {
  id: string;
  videoTitle: string;
  thumbnail?: string;
  currentStepId: string;
  overallProgress: number;
  status: PipelineStatus;
  startTime: string;
  estimatedTimeRemaining?: string;
  steps: PipelineStep[];
  logs: { timestamp: string; message: string; type: 'info' | 'error' | 'success' }[];
}

export interface PipelineStats {
  processedToday: number;
  currentlyProcessing: number;
  avgProcessingTime: string;
  successRate: number;
  totalRenderingTime: string;
}

export interface Clip {
  id: string;
  title: string;
  description: string;
  tags: string[];
  startTime: string;
  endTime: string;
  duration: number;
  viralScore: number;
  transcript?: string;
}

