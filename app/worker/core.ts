/**
 * This is contains internal APIs for `sw` modules like `logger` - which is based on
 * Workbox logger
 */

/// <reference lib="WebWorker" />

export type {};
declare let self: ServiceWorkerGlobalScope;

export function debug(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
}

export function isMethod(request: Request, methods: string[]): boolean {
  return methods.includes(request.method.toLowerCase());
}

declare global {
  interface WorkerGlobalScope {
    __DISABLE_PWA_DEV_LOGS: boolean;
  }

  interface Window {
    __DISABLE_PWA_DEV_LOGS: boolean;
  }
}

type LoggerMethods =
  | "debug"
  | "info"
  | "log"
  | "warn"
  | "error"
  | "groupCollapsed"
  | "groupEnd";

export const logger = (
  process.env.NODE_ENV === "production"
    ? null
    : (() => {
        // Don't overwrite this value if it's already set.
        // See https://github.com/GoogleChrome/workbox/pull/2284#issuecomment-560470923
        if (!("__DISABLE_PWA_DEV_LOGS" in self)) {
          //@ts-ignore
          self.__DISABLE_PWA_DEV_LOGS = false;
        }

        let inGroup = false;

        const methodToColorMap: { [methodName: string]: string | null } = {
          debug: `#7f8c8d`, // Gray
          log: `#2ecc71`, // Green
          info: `#3498db`, // Blue
          warn: `#f39c12`, // Yellow
          error: `#c0392b`, // Red
          groupCollapsed: `#3498db`, // Blue
          groupEnd: null, // No colored prefix on groupEnd
        };

        const print = function (method: LoggerMethods, args: any[]) {
          if (self.__DISABLE_PWA_DEV_LOGS) {
            return;
          }

          if (method === "groupCollapsed") {
            // Safari doesn't print all console.groupCollapsed() arguments:
            // https://bugs.webkit.org/show_bug.cgi?id=182754
            if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
              console[method](...args);
              return;
            }
          }

          const styles = [
            `background: ${methodToColorMap[method]!}`,
            `border-radius: 0.5em`,
            `color: white`,
            `font-weight: bold`,
            `padding: 2px 0.5em`,
          ];

          const logPrefix = inGroup ? [] : ["%cremix-pwa", styles.join(";")];

          console[method](...logPrefix, ...args);

          if (method === "groupCollapsed") {
            inGroup = true;
          }
          if (method === "groupEnd") {
            inGroup = false;
          }
        };
        // eslint-disable-next-line @typescript-eslint/ban-types
        const api: { [methodName: string]: Function } = {};
        const loggerMethods = Object.keys(methodToColorMap);

        for (const key of loggerMethods) {
          const method = key as LoggerMethods;

          api[method] = (...args: any[]) => {
            print(method, args);
          };
        }

        return api as unknown;
      })()
) as Console;
