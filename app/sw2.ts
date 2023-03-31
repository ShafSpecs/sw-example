/// <reference lib="WebWorker" />

export type {};
declare let self: ServiceWorkerGlobalScope;

export type LoadServiceWorkerOptions = {
  scope?: string;
  serviceWorkerUrl?: string;
  skipWaiting?: boolean;
};

/**
 * For `entry.client` file!
 */
export function loadServiceWorker(
  options: LoadServiceWorkerOptions = {
    scope: "/",
    serviceWorkerUrl: "/entry.worker.js",
    skipWaiting: false,
  }
) {
  if ("serviceWorker" in navigator) {
    async function register() {
      try {
        await navigator.serviceWorker
          //@ts-ignore
          .register(options.serviceWorkerUrl, {
            scope: options.scope,
          })
          .then(() => navigator.serviceWorker.ready)
          .then((registration) => {
            if (registration.waiting) {
              return registration.waiting;
            }

            return new Promise<ServiceWorker>((resolve) => {
              if (registration.installing) {
                registration.installing.addEventListener("statechange", () => {
                  if (registration.waiting) {
                    resolve(registration.waiting);
                  }
                });
              } else {
                registration.addEventListener("updatefound", () => {
                  if (registration.installing) {
                    registration.installing.addEventListener(
                      "statechange",
                      () => {
                        if (registration.waiting) {
                          resolve(registration.waiting);
                        }
                      }
                    );
                  }
                });
              }
            });
          })
          .then(() => {
            if (navigator.serviceWorker.controller) {
              console.log("Syncing...");

              navigator.serviceWorker.controller.postMessage({
                type: "SYNC_REMIX_MANIFEST",
                manifest: window.__remixManifest,
              });
            } else {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => {
                  console.log("Syncing...");

                  navigator.serviceWorker.controller?.postMessage({
                    type: "SYNC_REMIX_MANIFEST",
                    manifest: window.__remixManifest,
                  });
                }
              );
            }
          });

        console.log("Service worker registered", navigator.serviceWorker.ready);
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    }

    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      register();
    } else {
      window.addEventListener("load", register);
    }

    if (options.skipWaiting) {
      self.addEventListener("install", () => {
        self.skipWaiting();
      });
    }
  }
}

export function debug(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
}

export interface MatchRequestProps {
  url: URL;
  request: Request;
  event: Event;
}

export interface MatchAssetRequestProps extends MatchRequestProps {
  paths?: string[];
}

export function matchAssetRequest({ request, paths }: MatchAssetRequestProps) {
  if (!paths) {
    paths = ["/favicon.ico", "/build/"];
  }

  return (
    isMethod(request, ["get"]) &&
    paths.some((publicPath) => request.url.includes(publicPath))
  );
}

export function matchDocumentRequest({ request }: MatchRequestProps) {
  return isMethod(request, ["get"]) && request.mode === "navigate";
}

export function matchLoaderRequest({ request }: MatchRequestProps) {
  const url = new URL(request.url);
  return isMethod(request, ["get"]) && url.searchParams.get("_data");
}

export function isMethod(request: Request, methods: string[]) {
  return methods.includes(request.method.toLowerCase());
}
