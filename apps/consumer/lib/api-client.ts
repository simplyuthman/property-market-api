// Server-only: read at runtime, never baked into the client bundle.
// Set API_BASE_URL in your hosting platform's environment variables.
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export async function fetchFromApi<T>(path: string, searchParams?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as ApiError;
    throw new Error(errorBody.error?.message || `HTTP ${response.status} error`);
  }

  return response.json();
}
