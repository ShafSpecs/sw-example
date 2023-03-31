/**
 * Contains APIs pertaining to loading, and installing a Service Worker
 */

import { debug } from "./core";
import type { LoadServiceWorkerOptions } from "./types";

/// <reference lib="WebWorker" />

export type {};
declare let self: ServiceWorkerGlobalScope;

/**
 * Load service worker in `entry.client`
 * 
 * All parameters are optional.
 * 
 * @param {string} LoadServiceWorkerOptions.scope - Scope of the service worker.
 * @param {string} LoadServiceWorkerOptions.serviceWorkerUrl - URL of the service worker.
 * @param {boolean} LoadServiceWorkerOptions.skipWaiting - Skip waiting for the service worker.
 * 
 * ```ts
 * loadServiceWorker({
 *  scope: "/",
 *  serviceWorkerUrl: "/entry.worker.js",
 *  skipWaiting: false,
 * })
 * ```
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
            debug("Syncing...")

            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: "SYNC_REMIX_MANIFEST",
                manifest: window.__remixManifest,
              });
            } else {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => {
                  debug("Syncing...")

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