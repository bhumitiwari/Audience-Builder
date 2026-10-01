import { useState, useCallback } from 'react';
import type {
  AudiencePreviewRequest,
  AudiencePreviewResponse,
} from './api.js';
import { postAudiencePreview } from './api.js';

/**
 * Server data layer: Manages the lifecycle of backend audience data,
 * loading flags, error state, and retry execution.
 */
export function useAudiencePreview() {
  const [serverData, setServerData] = useState<AudiencePreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    payload: AudiencePreviewRequest;
    baseUrl: string;
  } | null>(null);

  const executePreview = useCallback(
    async (payload: AudiencePreviewRequest, baseUrl: string) => {
      setIsLoading(true);
      setApiError(null);
      setLastRequest({ payload, baseUrl });

      try {
        const response = await postAudiencePreview(payload, baseUrl);
        setServerData(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Audience preview failed';
        setApiError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const retryLastPreview = useCallback((overrideBaseUrl?: string) => {
    if (lastRequest) {
      executePreview(lastRequest.payload, overrideBaseUrl || lastRequest.baseUrl);
    }
  }, [lastRequest, executePreview]);

  const clearServerData = useCallback(() => {
    setServerData(null);
    setApiError(null);
    setLastRequest(null);
  }, []);

  return {
    serverData,
    isLoading,
    apiError,
    executePreview,
    retryLastPreview,
    clearServerData,
  };
}
