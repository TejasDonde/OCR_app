import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface LogWindowProps {
  logs: string[];
}

export function LogWindow({ logs }: LogWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Terminal className="w-4 h-4" />
        <span>Processing Log</span>
      </div>
      
      <div
        ref={scrollRef}
        className="log-window h-48 p-4 text-muted-foreground"
      >
        {logs.length === 0 ? (
          <p className="text-muted-foreground/60 italic">
            Logs will appear here during processing...
          </p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-muted-foreground/50 select-none mr-3">
                {String(index + 1).padStart(3, '0')}
              </span>
              <span>{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
