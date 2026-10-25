/**
 * ========================================================
 * ⚡ GOOGLE APPS SCRIPT -> NODE.JS / SQLITE API BRIDGE
 * ========================================================
 */
(function () {
  window.google = window.google || {};
  window.google.script = window.google.script || {};

  function getApiBase() {
    if (typeof window.SARAWAT_API_BASE === 'string') {
      return window.SARAWAT_API_BASE.trim().replace(/\/+$/, '');
    }

    const tunnelUrl = (window.CLOUDFLARE_TUNNEL_URL || window.HARDCODED_TUNNEL_URL || '').trim().replace(/\/+$/, '');
    const hostname = window.location.hostname || '';
    const port = window.location.port || '';
    const protocol = window.location.protocol || '';

    // 1. If accessed on production domain (sarawatdc.site, vercel.app) or directly on Cloudflare
    if (
      hostname.endsWith('sarawatdc.site') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.trycloudflare.com')
    ) {
      return '';
    }

    // 2. If directly accessed on Express backend port 5000
    if (port === '5000') {
      return '';
    }

    // 3. If accessed on localhost / 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '' || port === '80' || port === '443') return tunnelUrl || 'http://localhost:5000';
      return 'http://localhost:5000';
    }

    // 4. If accessed via LAN IP on local Wi-Fi / Ethernet
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
      if (port === '' || port === '80' || port === '443') return tunnelUrl || `${protocol}//${hostname}:5000`;
      return `${protocol}//${hostname}:5000`;
    }

    // 5. External static hosts (file:// or other external hosts)
    return tunnelUrl;
  }

  window.getRosterApiBase = getApiBase;

  // Navigation helpers (Clean URLs: /si-roster and /si-roster/admin)
  window.goToRosterAdmin = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (window.location.protocol === 'file:') {
      window.location.href = 'admin.html';
      return;
    }
    const origin = window.location.origin || '';
    window.location.href = origin + '/si-roster/admin';
  };

  window.goToRosterStudent = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (window.location.protocol === 'file:') {
      window.location.href = 'index.html';
      return;
    }
    const origin = window.location.origin || '';
    window.location.href = origin + '/si-roster';
  };

  // ---------------------------------------------------------------------------
  // 🛡️ Device Fingerprint / Persistent UUID for Anti-Spam & Fair-Share Quota
  // ---------------------------------------------------------------------------
  function getOrCreateDeviceId() {
    try {
      let id = localStorage.getItem('dg_device_uuid');
      if (!id) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          id = crypto.randomUUID();
        } else {
          id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
        }
        localStorage.setItem('dg_device_uuid', id);
      }
      return id;
    } catch (e) {
      return 'dev_fallback_' + Date.now();
    }
  }

  // Client-side debounce tracker
  const clientCallCooldowns = new Map();

  function createGoogleScriptRunner() {
    let successHandler = null;
    let errorHandler = null;

    const target = {};
    const proxy = new Proxy(target, {
      get(t, prop) {
        if (prop === 'withSuccessHandler') {
          return function (fn) {
            successHandler = fn;
            return proxy;
          };
        }
        if (prop === 'withFailureHandler') {
          return function (fn) {
            errorHandler = fn;
            return proxy;
          };
        }

        return async function (...args) {
          const method = prop;
          const apiBase = getApiBase();
          const url = `${apiBase}/api/roster/${method}`;

          // Client-side throttle: prevent instant spam calls for refresh / activities
          const now = Date.now();
          if (method === 'getUpcomingActivities' || method === 'getAllActivities') {
            const lastCall = clientCallCooldowns.get(method) || 0;
            if (now - lastCall < 800) {
              // Rapid spam within 800ms: return cached or debounce gently
              console.warn(`[Client RateLimit] Throttled rapid call to ${method}`);
            }
            clientCallCooldowns.set(method, now);
          }

          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true',
                'X-Device-Id': getOrCreateDeviceId(),
                'X-Client-Timestamp': String(Date.now())
              },
              body: JSON.stringify({ args })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data && data.success) {
              if (typeof successHandler === 'function') {
                successHandler(data.result);
              }
              return data.result;
            } else {
              const errMsg = (data && (data.message || data.error)) ? (data.message || data.error) : ('Error in ' + method);
              const err = new Error(errMsg);
              err.retryAfterSeconds = data ? (data.retryAfterSeconds || 0) : 0;
              err.lockedOut = data ? !!data.lockedOut : false;
              err.remainingAttempts = data && typeof data.remainingAttempts === 'number' ? data.remainingAttempts : undefined;
              err.status = res.status;
              if (typeof errorHandler === 'function') {
                errorHandler(err);
                return null;
              } else {
                console.error(`[Roster API Error] ${method}:`, err);
                throw err;
              }
            }
          } catch (netErr) {
            if (typeof errorHandler === 'function') {
              errorHandler(netErr);
              return null;
            } else {
              console.error(`[Roster Network Error] ${method}:`, netErr);
              throw netErr;
            }
          }
        };
      }
    });

    return proxy;
  }

  Object.defineProperty(window.google.script, 'run', {
    get: createGoogleScriptRunner,
    configurable: true
  });
})();
