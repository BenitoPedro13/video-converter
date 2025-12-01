'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { API_URL } from '@/lib/api-client';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<
    'idle' | 'uploading' | 'converting' | 'completed' | 'error'
  >('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setConversionStatus('idle');
      setDownloadUrl(null);
    }
  };

  const startPolling = (filename: string) => {
    setConversionStatus('converting');
    const interval = setInterval(async () => {
      try {
        // Check if file is ready by trying to download/head it
        // Since we don't have a specific status endpoint, we try to fetch the file
        // If it returns 200, it's ready. If 404, it's not.
        const response = await fetch(
          `${API_URL}/converter/download/${filename}`,
          {
            method: 'HEAD',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          },
        );

        if (response.ok) {
          clearInterval(interval);
          setConversionStatus('completed');
          setDownloadUrl(
            `${API_URL}/converter/download/${filename}?token=${localStorage.getItem(
              'access_token',
            )}`,
          );
        } else if (response.status !== 404) {
          // If it's not 404 and not 200, something might be wrong (e.g. 500)
          // But for now we assume 404 means processing.
          // We could add a timeout here to stop polling after X minutes.
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setConversionStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // We need to use fetch directly here because apiRequest assumes JSON
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/converter/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      // data should contain { filename: string, ... }
      if (data.filename) {
        startPolling(data.filename);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video. Please try again.');
      setConversionStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name || user?.email}
            </span>
            <button
              onClick={logout}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Video to MP3 Converter
              </h2>
              <p className="mt-2 text-gray-600">
                Upload a video file to convert it to MP3 audio.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />

                {file && conversionStatus === 'idle' && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Convert to MP3'}
                  </button>
                )}

                {conversionStatus === 'uploading' && (
                  <div className="text-indigo-600">Uploading video...</div>
                )}

                {conversionStatus === 'converting' && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-indigo-600">
                      Converting... This may take a while.
                    </p>
                  </div>
                )}

                {conversionStatus === 'completed' && downloadUrl && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-green-600 font-semibold">
                      Conversion Completed!
                    </div>
                    <a
                      href={downloadUrl}
                      download
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                    >
                      Download MP3
                    </a>
                    <button
                      onClick={() => {
                        setFile(null);
                        setConversionStatus('idle');
                        setDownloadUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Convert another file
                    </button>
                  </div>
                )}

                {error && <div className="text-red-600">{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
