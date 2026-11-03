// Safeguard for browser extension interceptors and proxy environments (e.g. Urban VPN)
export function sanitizeFetchDescriptor(desc: PropertyDescriptor | undefined, fallbackFetch?: any): PropertyDescriptor {
  if (!desc || typeof desc !== 'object') {
    return {
      configurable: true,
      enumerable: true,
      writable: true,
      value: fallbackFetch,
    };
  }
  if ('get' in desc || 'set' in desc) {
    const origGet = desc.get;
    const origSet = desc.set;
    let localVal: any;
    let hasLocalVal = false;
    return {
      configurable: true,
      enumerable: desc.enumerable !== false,
      get(this: any) {
        if (hasLocalVal) return localVal;
        if (origGet) {
          try {
            return origGet.call(this);
          } catch {
            // fallback
          }
        }
        return (typeof window !== 'undefined' && (window as any)._activeFetch) || fallbackFetch;
      },
      set(this: any, fn: any) {
        if (typeof fn === 'function') {
          localVal = fn;
          hasLocalVal = true;
          if (typeof window !== 'undefined') {
            (window as any)._activeFetch = fn;
          }
        }
        if (origSet) {
          try {
            origSet.call(this, fn);
          } catch {
            // ignore
          }
        }
      },
    };
  }
  return {
    configurable: true,
    enumerable: desc.enumerable !== false,
    writable: true,
    value: typeof desc.value === 'function' ? desc.value : fallbackFetch,
  };
}

(function ensureGlobalFetchResilience() {
  if (typeof window === 'undefined') return;
  try {
    const isExtNoise = (str: unknown) => {
      if (!str) return false;
      const s = String(str);
      return (
        s.includes('Cannot set property fetch') ||
        s.includes('chrome-extension:') ||
        s.includes('eppiocemhmnlbhjplcgkofciiegomcon') ||
        s.includes('requests.js') ||
        s.includes('executors/200.js')
      );
    };

    const origFetch = window.fetch ? window.fetch.bind(window) : undefined;
    (window as any)._activeFetch = origFetch;

    const isFetchTarget = (target: any, prop: PropertyKey) => {
      if (prop !== 'fetch') return false;
      if (target === window || target === globalThis) return true;
      if (typeof Window !== 'undefined' && target === Window.prototype) return true;
      return false;
    };

    const origDefineProperty = Object.defineProperty;
    Object.defineProperty = function <T>(target: T, prop: PropertyKey, descriptor: PropertyDescriptor & ThisType<any>): T {
      if (isFetchTarget(target, prop)) {
        return origDefineProperty.call(Object, target, prop, sanitizeFetchDescriptor(descriptor, origFetch)) as T;
      }
      return origDefineProperty.call(Object, target, prop, descriptor) as T;
    };

    if (typeof Reflect !== 'undefined' && Reflect.defineProperty) {
      const origReflectDefineProperty = Reflect.defineProperty;
      Reflect.defineProperty = function (target: object, prop: PropertyKey, descriptor: PropertyDescriptor): boolean {
        if (isFetchTarget(target, prop)) {
          return origReflectDefineProperty.call(Reflect, target, prop, sanitizeFetchDescriptor(descriptor, origFetch));
        }
        return origReflectDefineProperty.call(Reflect, target, prop, descriptor);
      };
    }

    const mutableDesc = sanitizeFetchDescriptor(
      {
        get() {
          return (window as any)._activeFetch || origFetch;
        },
        configurable: true,
        enumerable: true,
      },
      origFetch
    );

    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        origDefineProperty.call(Object, Window.prototype, 'fetch', mutableDesc);
      } catch {
        // ignore
      }
    }

    try {
      delete (window as any).fetch;
    } catch {
      // ignore
    }

    try {
      origDefineProperty.call(Object, window, 'fetch', mutableDesc);
    } catch {
      // ignore
    }

    if (typeof console !== 'undefined' && console.error) {
      const origConsoleError = console.error;
      console.error = function (...args: any[]) {
        for (const arg of args) {
          const text = arg && (arg.stack || arg.message) ? arg.stack || arg.message : String(arg);
          if (isExtNoise(text)) return;
        }
        return origConsoleError.apply(console, args);
      };
    }

    const origOnError = window.onerror;
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      const combined = `${msg || ''} ${url || ''} ${error && (error.stack || error.message) ? error.stack || error.message : ''}`;
      if (isExtNoise(combined)) return true;
      if (origOnError) return origOnError.apply(this, [msg, url, lineNo, columnNo, error]);
      return false;
    };
  } catch {
    // Ignore if environment prevents defining window.fetch
  }
})();

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

