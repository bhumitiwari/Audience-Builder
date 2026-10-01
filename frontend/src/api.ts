export type EventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_started'
  | 'purchase';

export type Operator = 'at_least' | 'exactly';

export interface ConditionRule {
  id: string;
  eventType: EventType;
  operator: Operator;
  count: number | string;
  withinDays: number | string;
}

export interface AudiencePreviewRequest {
  name: string;
  asOf: string;
  conditions: {
    eventType: EventType;
    operator: Operator;
    count: number;
    withinDays: number;
  }[];
}

export interface MemberEvidence {
  eventType: EventType;
  observedCount: number;
}

export interface AudienceMember {
  anonymousId: string;
  evidence: MemberEvidence[];
}

export interface AudiencePreviewResponse {
  name: string;
  asOf: string;
  total: number;
  members: AudienceMember[];
}

export const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';


export function normalizeBackendUrl(input: string): string {
  let url = (input || '').trim();
  if (!url) return DEFAULT_BACKEND_URL;

  // Auto-prepend http:// if protocol is omitted
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  // Removes trailing slashes
  return url.replace(/\/+$/, '');
}

export async function postAudiencePreview(
  payload: AudiencePreviewRequest,
  baseUrl: string = DEFAULT_BACKEND_URL
): Promise<AudiencePreviewResponse> {
  const normalizedBase = normalizeBackendUrl(baseUrl);
  const endpoint = `${normalizedBase}/v1/audiences/preview`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Cannot connect to backend at ${normalizedBase}. Ensure the backend service is running and reachable.`
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. 502/404 HTML proxy page)
    throw new Error(`Server returned non-JSON response (HTTP ${response.status} ${response.statusText})`);
  }

  if (!response.ok) {
    const errorDetails = data?.error?.details
      ? data.error.details.map((d: { message: string }) => d.message).join(', ')
      : data?.error?.message || `Request failed with HTTP status ${response.status}`;
    throw new Error(errorDetails);
  }

  return data as AudiencePreviewResponse;
}

export const previewAudience = postAudiencePreview;
