/**
 * API client - centralized HTTP requests
 */

import { env } from '@/config';
import { AetherError, NetworkError, ValidationError } from '@/types';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout = 10000;

  constructor() {
    this.baseUrl = env.API_URL;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        timeout: config?.timeout || this.timeout,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AetherError(
          'API_ERROR',
          errorData.message || `API error: ${response.statusCode}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof AetherError) {
        throw error;
      }
      if (error instanceof TypeError) {
        throw new NetworkError('Failed to connect to API');
      }
      throw new AetherError('UNKNOWN_ERROR', String(error), 500);
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, config);
  }

  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, config);
  }

  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, config);
  }
}

export const apiClient = new ApiClient();
