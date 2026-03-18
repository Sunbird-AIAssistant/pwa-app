import { Injectable } from '@angular/core';
import { config } from 'configuration/environment.prod';
import { ConfigVariables } from '../../config';

/** Resolves API base URL from tenant config (apiBaseUrl) or environment. No hardcoded localhost. */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private cachedBaseUrl: string | null = null;

  /** Returns API base URL (with trailing slash). Uses appConfig.apiBaseUrl when set, else environment. */
  async getApiBaseUrl(): Promise<string> {
    if (this.cachedBaseUrl) return this.cachedBaseUrl;
    try {
      const appConfig = await ConfigVariables;
      const url = (appConfig as any)?.apiBaseUrl;
      if (url && typeof url === 'string' && url.trim()) {
        this.cachedBaseUrl = url.trim().replace(/\/?$/, '/');
        return this.cachedBaseUrl;
      }
    } catch {
      // ignore
    }
    this.cachedBaseUrl = (config.api.BASE_URL || '').replace(/\/?$/, '/');
    return this.cachedBaseUrl;
  }

  /** Synchronous fallback when config not yet loaded; use for initial display, then refresh with getApiBaseUrl(). */
  getApiBaseUrlSync(): string {
    return this.cachedBaseUrl || (config.api.BASE_URL || '').replace(/\/?$/, '/');
  }

  clearCache(): void {
    this.cachedBaseUrl = null;
  }
}
