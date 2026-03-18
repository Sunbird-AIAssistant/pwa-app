/**
 * Resolves tenant config key (maps to assets/appConfig/<key>.json).
 * No hardcoded default tenant string — if nothing matches, returns '' (set ?tenant=, meta, or use tenant.example.com).
 * Priority:
 * 1. URL ?tenant= or ?subdomain= (persisted to sessionStorage)
 * 2. sessionStorage tenantSubdomain
 * 3. <meta name="app-tenant-subdomain" content="...">
 * 4. Hostname: first label when host has multiple labels (tenant.example.com); skips www
 * 5. Single-label hostname (e.g. browser reports "localhost") → that label as-is from the host (not a code default)
 * IPv4 hosts (127.0.0.1) do not map to a tenant key — use ?tenant= or meta.
 */
function slugifyTenant(s: string): string {
  const t = s.trim();
  return /^[a-zA-Z0-9_-]+$/.test(t) ? t : '';
}

export function resolveTenantSubdomain(): string {
  if (typeof window === 'undefined' || !window.location) {
    const g = typeof globalThis !== 'undefined' ? (globalThis as { __APP_TENANT_SUBDOMAIN__?: string }) : {};
    return slugifyTenant(g.__APP_TENANT_SUBDOMAIN__ || '');
  }

  try {
    const sp = new URLSearchParams(window.location.search);
    const q = slugifyTenant(sp.get('tenant') || sp.get('subdomain') || '');
    if (q) {
      try {
        sessionStorage.setItem('tenantSubdomain', q);
      } catch {
        /* ignore */
      }
      return q;
    }
  } catch {
    /* ignore */
  }

  try {
    const stored = slugifyTenant(sessionStorage.getItem('tenantSubdomain') || '');
    if (stored) return stored;
  } catch {
    /* ignore */
  }

  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="app-tenant-subdomain"]');
    const mc = slugifyTenant(meta?.getAttribute('content') || '');
    if (mc) return mc;
  }

  const host = (window.location.hostname || '').toLowerCase();
  if (!host) return '';

  // IPv4 — first octet is not a tenant id
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return '';
  }

  const parts = host.split('.');
  if (parts.length >= 2) {
    if (parts[0] === 'www' && parts.length >= 3) {
      return parts[1];
    }
    return parts[0];
  }

  return parts[0] || '';
}

export const subdomain = resolveTenantSubdomain();
const jsonFilename = subdomain ? `${subdomain}.json` : '';

export const ConfigVariables = jsonFilename
  ? fetch(`../assets/appConfig/${jsonFilename}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => data)
      .catch((error) => {
        console.error('There was a problem with the fetch operation:', error);
      })
  : (() => {
      console.error(
        '[app] Tenant not resolved. Use ?tenant=<id>, set meta app-tenant-subdomain, or open via tenant.yourdomain.com (not raw IP without meta).',
      );
      return Promise.resolve(undefined);
    })();
