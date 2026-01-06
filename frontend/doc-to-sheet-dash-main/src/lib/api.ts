// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface UploadResponse {
  task_id: string;
}

export interface StartResponse {
  started: boolean;
}

export interface StatusResponse {
  status: 'uploaded' | 'running' | 'finished' | 'error';
  progress: number;
  task_dir?: string;
  zip?: string | null;
  error?: string;
}

/**
 * Upload PDF files to the server
 */
export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload files');
  }

  return response.json();
}

/**
 * Start processing the uploaded files
 */
export async function startProcessing(taskId: string): Promise<StartResponse> {
  const response = await fetch(`${API_BASE_URL}/start/${taskId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to start processing');
  }

  return response.json();
}

/**
 * Check the status of a processing task
 */
export async function checkStatus(taskId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/status/${taskId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to check status');
  }

  return response.json();
}

/**
 * Download the resulting ZIP file
 */
export async function downloadZip(taskId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/download/${taskId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to download file');
  }

  // Get the blob and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `extracted_data_${taskId}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
