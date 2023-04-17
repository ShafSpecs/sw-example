/// <reference lib="WebWorker" />

import { isAssetRequest } from "~/remix-pwa-sw/core/common";

export type {};

export type LoadServiceWorkerOptions = {
  scope: string;
  serviceWorkerUrl: string;
};

/**
 * For `entry.client` file!
 */
export function loadServiceWorker(
  options: LoadServiceWorkerOptions = {
    scope: "/",
    serviceWorkerUrl: "/entry.worker.js",
  }
) {
  if ("serviceWorker" in navigator) {
    async function register() {
      try {
        const registration = await navigator.serviceWorker
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
              navigator.serviceWorker.controller.postMessage({
                type: "SYNC_REMIX_MANIFEST",
                manifest: window.__remixManifest,
              });
            } else {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => {
                  navigator.serviceWorker.controller?.postMessage({
                    type: "SYNC_REMIX_MANIFEST",
                    manifest: window.__remixManifest,
                  });
                }
              );
            }
          });

        console.log("Service worker registered", registration);
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
};

export interface MatchAssetRequestProps extends MatchRequestProps {
  paths?: string[]
}

type P = {
  url: URL;
  request: Request;
  event: Event;
}

export function matchAssetRequest({ request }: P, assetUrls: string[] = ["/build/", "/icons"]) {
  return isAssetRequest(request, assetUrls);
}

export function matchDocumentRequest({ request }: MatchRequestProps) {
  return isMethod(request, ["get"]) && request.mode === "navigate";
}

export function matchLoaderRequest({ request }: MatchRequestProps) {
  const url = new URL(request.url);
  return isMethod(request, ["get"]) && url.searchParams.get("_data");
}

function isMethod(request: Request, methods: string[]) {
  return methods.includes(request.method.toLowerCase());
}