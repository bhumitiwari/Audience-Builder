import React from 'react';

interface HeaderProps {
  backendUrl: string;
  onUrlChange: (url: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ backendUrl, onUrlChange }) => {
  return (
    <header className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mable Audience Builder
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define behavioral rules and preview anonymous audience membership
          </p>
        </div>

        {/* Configurable Backend Base URL Control */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <label
            htmlFor="backend-base-url"
            className="text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            Backend Base URL:
          </label>
          <input
            id="backend-base-url"
            type="url"
            value={backendUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="http://localhost:3001"
            aria-describedby="backend-url-help"
            className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 w-full sm:w-56 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors"
          />
        </div>
      </div>
      <p id="backend-url-help" className="sr-only">
        Enter the target backend API host and port where preview requests will be evaluated.
      </p>
    </header>
  );
};
