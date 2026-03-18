import { Injectable } from '@angular/core';
import { ApiModule } from './api/api.module';
import { StorageService } from './storage.service';

/**
 * Stores Prajayatna JWT and user in sessionStorage (cleared when tab closes) instead of localStorage
 * to reduce XSS exposure. Also syncs token to ApiModule so bearer requests use it.
 * For production, prefer backend issuing httpOnly cookies and not storing tokens in JS.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private static readonly TOKEN_KEY = 'access_token';
  private static readonly USER_KEY = 'user';

  constructor(private storage: StorageService) {}

  getToken(): string | null {
    return sessionStorage.getItem(AuthTokenService.TOKEN_KEY);
  }

  getUser(): { name?: string; [k: string]: any } | null {
    try {
      const raw = sessionStorage.getItem(AuthTokenService.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setTokenAndUser(accessToken: string, user: object): void {
    sessionStorage.setItem(AuthTokenService.TOKEN_KEY, accessToken);
    sessionStorage.setItem(AuthTokenService.USER_KEY, JSON.stringify(user || {}));
    this.syncToApiModule(accessToken);
    this.storage.setData('api_token', accessToken).catch(() => {});
  }

  clear(): void {
    sessionStorage.removeItem(AuthTokenService.TOKEN_KEY);
    sessionStorage.removeItem(AuthTokenService.USER_KEY);
    const config = ApiModule.getInstance().getConfig();
    if (config.authentication) config.authentication.bearerToken = '';
    this.storage.removeData('api_token').catch(() => {});
  }

  /** Ensure ApiModule and StorageService use current token for bearer requests. */
  private syncToApiModule(token: string): void {
    const config = ApiModule.getInstance().getConfig();
    if (!config.authentication) return;
    config.authentication.bearerToken = token;
  }
}
