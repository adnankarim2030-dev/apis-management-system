// API Client for APIS Platform

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    unreadCount?: number;
    [key: string]: any;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: ApiResponse['meta'] }> {
  const token = localStorage.getItem('apis_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let resJson: ApiResponse<T>;
  try {
    resJson = JSON.parse(text);
  } catch (parseErr) {
    if (!response.ok) {
      throw new Error(`Server connection issue (${response.status}). Please verify database connectivity.`);
    }
    throw new Error(`Invalid response from server.`);
  }

  if (!resJson.success) {
    const errorMsg = resJson.error?.message || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return {
    data: resJson.data as T,
    meta: resJson.meta,
  };
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body || {}),
    });
  },

  put: <T>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body || {}),
    });
  },

  delete: <T>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },
};
