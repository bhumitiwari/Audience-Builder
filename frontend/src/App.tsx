import { useState } from 'react';
import { DEFAULT_BACKEND_URL } from './api.js';
import { useAudiencePreview } from './useAudiencePreview.js';
import { Header } from './components/Header.js';
import { ErrorBanner } from './components/ErrorBanner.js';
import { AudienceForm } from './components/AudienceForm.js';
import { ResultsView } from './components/ResultsView.js';

export function App() {
  // Configurable backend base URL state (persisted to localStorage)
  const [backendUrl, setBackendUrlState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mable_backend_url');
      if (saved) return saved;
    }
    return DEFAULT_BACKEND_URL;
  });

  const handleUrlChange = (url: string) => {
    setBackendUrlState(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mable_backend_url', url);
    }
  };

  // Server data lifecycle layer (separated from local form state)
  const {
    serverData,
    isLoading,
    apiError,
    executePreview,
    retryLastPreview,
    clearServerData,
  } = useAudiencePreview();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Semantic Header with Configurable Base URL */}
        <Header backendUrl={backendUrl} onUrlChange={handleUrlChange} />

        {/* Product-Quality Error Banner with Visible Retry Path */}
        <ErrorBanner
          error={apiError}
          isLoading={isLoading}
          onRetry={() => retryLastPreview(backendUrl)}
        />

        {/* Responsive Workspace Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Audience Definition Form (Local State & Controls) */}
          <section aria-label="Rule Definition" className="lg:col-span-6">
            <AudienceForm
              isLoading={isLoading}
              onSubmit={(payload) => executePreview(payload, backendUrl)}
              onReset={clearServerData}
            />
          </section>

          {/* Right Column: Audience Preview Results (Server Data Display) */}
          <section aria-label="Audience Results" className="lg:col-span-6">
            <ResultsView result={serverData} isLoading={isLoading} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
