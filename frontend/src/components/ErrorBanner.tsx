import React from 'react';

interface ErrorBannerProps {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, isLoading, onRetry }) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center justify-between gap-4"
    >
      <div>
        <strong className="font-semibold">Error:</strong> {error}
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isLoading}
        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50 shrink-0 transition-colors"
      >
        {isLoading ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  );
};
