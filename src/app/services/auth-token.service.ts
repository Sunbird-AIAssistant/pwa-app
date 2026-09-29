import { Injectable } from '@angular/core';
import { ApiModule } from './api/api.module';
import { StorageService } from './storage.service';

/**
 * Stores Prajayatna JWT and user in localStorage so the 30-day login survives closing the tab or app
 * (sessionStorage would end it with the tab). Also syncs token to ApiModule so bearer requests use it.
 * StorageService already keeps the same token in localStorage on web ('api_token'), so this adds no new exposure.
 * For production, prefer backend issuing httpOnly cookies and not storing tokens in JS.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private static readonly TOKEN_KEY = 'access_token';
  private static readonly USER_KEY = 'user';

  constructor(private storage: StorageService) {}

  getToken(): string | null {
    return localStorage.getItem(AuthTokenService.TOKEN_KEY);
  }

  getUser(): { name?: string; [k: string]: any } | null {
    try {
      const raw = localStorage.getItem(AuthTokenService.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * True while the stored token has not passed its `exp` claim. Pass tenantName to also require that the
   * token was issued for that tenant (localStorage is shared by every tenant served from one origin).
   */
  hasValidSession(tenantName?: string): boolean {
    const claims = this.getClaims();
    const exp = claims?.exp;
    if (typeof exp !== 'number' || exp * 1000 <= Date.now()) return false;
    return !tenantName || claims?.tenantName === tenantName;
  }

  setTokenAndUser(accessToken: string, user: object): void {
    localStorage.setItem(AuthTokenService.TOKEN_KEY, accessToken);
    localStorage.setItem(AuthTokenService.USER_KEY, JSON.stringify(user || {}));
    this.syncToApiModule(accessToken);
    this.storage.setData('api_token', accessToken).catch(() => {});
  }

  clear(): void {
    localStorage.removeItem(AuthTokenService.TOKEN_KEY);
    localStorage.removeItem(AuthTokenService.USER_KEY);
    const config = ApiModule.getInstance().getConfig();
    if (config.authentication) config.authentication.bearerToken = '';
    this.storage.removeData('api_token').catch(() => {});
  }

  /** Claims from the stored JWT, or null when there is no token or it cannot be decoded. */
  private getClaims(): { exp?: number; tenantName?: string } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }

  /** Ensure ApiModule and StorageService use current token for bearer requests. */
  private syncToApiModule(token: string): void {
    const config = ApiModule.getInstance().getConfig();
    if (!config.authentication) return;
    config.authentication.bearerToken = token;
  }
}
