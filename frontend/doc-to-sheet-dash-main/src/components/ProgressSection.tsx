import { CheckCircle2, Loader2, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'uploaded' | 'running' | 'finished' | 'error';

interface ProgressSectionProps {
  status: Status;
  progress: number;
  error?: string;
}

const statusConfig: Record<Status, {
  icon: typeof Upload;
  label: string;
  color: string;
  bgColor: string;
  animate?: boolean;
}> = {
  idle: {
    icon: Upload,
    label: 'Ready to upload',
    color: 'text-muted-foreground',
    bgColor: 'bg-secondary',
    animate: false,
  },
  uploaded: {
    icon: CheckCircle2,
    label: 'Files uploaded',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    animate: false,
  },
  running: {
    icon: Loader2,
    label: 'Processing...',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    animate: true,
  },
  finished: {
    icon: CheckCircle2,
    label: 'Extraction complete!',
    color: 'text-success',
    bgColor: 'bg-success/10',
    animate: false,
  },
  error: {
    icon: AlertCircle,
    label: 'Error occurred',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    animate: false,
  },
};

export function ProgressSection({ status, progress, error }: ProgressSectionProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
          config.bgColor
        )}>
          <Icon className={cn(
            'w-5 h-5',
            config.color,
            config.animate && 'animate-spin'
          )} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={cn('font-medium', config.color)}>
              {config.label}
            </span>
            {(status === 'running' || status === 'finished') && (
              <span className="text-sm font-mono text-muted-foreground">
                {progress}%
              </span>
            )}
          </div>
          
          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </div>
      </div>

      {(status === 'running' || status === 'finished' || status === 'uploaded') && (
        <div className="progress-bar">
          <div
            className={cn(
              'progress-bar-fill',
              status === 'running' && 'animate-pulse-soft'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
