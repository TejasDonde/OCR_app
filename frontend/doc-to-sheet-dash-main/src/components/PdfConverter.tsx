import { useState, useCallback, useRef, useEffect } from 'react';
import { FileSpreadsheet, Play, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropZone } from '@/components/DropZone';
import { ProgressSection } from '@/components/ProgressSection';
import { LogWindow } from '@/components/LogWindow';
import { uploadFiles, startProcessing, checkStatus, downloadZip } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type Status = 'idle' | 'uploaded' | 'running' | 'finished' | 'error';

export function PdfConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');
    addLog(`Uploading ${files.length} file(s)...`);

    try {
      const response = await uploadFiles(files);
      setTaskId(response.task_id);
      setStatus('uploaded');
      setProgress(0);
      addLog(`Upload successful! Task ID: ${response.task_id}`);
      
      toast({
        title: 'Upload Complete',
        description: `${files.length} file(s) uploaded successfully.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setStatus('error');
      addLog(`Error: ${message}`);
      
      toast({
        title: 'Upload Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, addLog]);

  const handleStartExtraction = useCallback(async () => {
    if (!taskId) return;

    setError('');
    addLog('Starting extraction process...');

    try {
      await startProcessing(taskId);
      setStatus('running');
      addLog('Extraction started. Polling for updates...');

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await checkStatus(taskId);
          
          setProgress(statusResponse.progress);
          
          if (statusResponse.status === 'running') {
            addLog(`Progress: ${statusResponse.progress}%`);
          } else if (statusResponse.status === 'finished') {
            setStatus('finished');
            setProgress(100);
            addLog('Extraction complete! ZIP file ready for download.');
            stopPolling();
            
            toast({
              title: 'Extraction Complete',
              description: 'Your Excel files are ready for download.',
            });
          } else if (statusResponse.status === 'error') {
            setStatus('error');
            setError(statusResponse.error || 'Processing failed');
            addLog(`Error: ${statusResponse.error}`);
            stopPolling();
            
            toast({
              title: 'Processing Failed',
              description: statusResponse.error || 'An error occurred during processing.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Status check failed';
          addLog(`Warning: ${message}`);
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start processing';
      setError(message);
      setStatus('error');
      addLog(`Error: ${message}`);
      
      toast({
        title: 'Start Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [taskId, addLog, stopPolling]);

  const handleDownload = useCallback(async () => {
    if (!taskId) return;

    setIsDownloading(true);
    addLog('Downloading ZIP file...');

    try {
      await downloadZip(taskId);
      addLog('Download started!');
      
      toast({
        title: 'Download Started',
        description: 'Your ZIP file is being downloaded.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      addLog(`Error: ${message}`);
      
      toast({
        title: 'Download Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [taskId, addLog]);

  const handleReset = useCallback(() => {
    stopPolling();
    setFiles([]);
    setTaskId(null);
    setStatus('idle');
    setProgress(0);
    setError('');
    setLogs([]);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const canUpload = files.length > 0 && status === 'idle';
  const canStart = status === 'uploaded' && taskId;
  const canDownload = status === 'finished' && taskId;
  const isProcessing = status === 'running' || isUploading;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg shadow-primary/20 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            OCR ix
          </h1>
          
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 space-y-6">
          {/* Drop Zone */}
          <DropZone
            files={files}
            onFilesChange={setFiles}
            disabled={isProcessing || status === 'finished'}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canUpload && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                variant="gradient"
                size="lg"
                className="flex-1 min-w-[140px]"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Upload Files
                  </>
                )}
              </Button>
            )}

            {canStart && (
              <Button
                onClick={handleStartExtraction}
                variant="gradient"
                size="lg"
                className="flex-1 min-w-[140px]"
              >
                <Play className="w-4 h-4" />
                Run Extraction
              </Button>
            )}

            {canDownload && (
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="success"
                size="lg"
                className="flex-1 min-w-[140px]"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download ZIP
                  </>
                )}
              </Button>
            )}

            {(status !== 'idle' || files.length > 0) && !isProcessing && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Progress Section */}
          {status !== 'idle' && (
            <div className="pt-4 border-t border-border animate-slide-up">
              <ProgressSection
                status={status}
                progress={progress}
                error={error}
              />
            </div>
          )}

          {/* Log Window */}
          {(status === 'running' || status === 'finished' || logs.length > 0) && (
            <div className="pt-4 border-t border-border animate-slide-up">
              <LogWindow logs={logs} />
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Supports multiple PDF files • Extracts tables to Excel format
        </p>
      </div>
    </div>
  );
}
