/**
 * Contains APIs pertaining to loading, and installing a Service Worker
 */

/// <reference lib="WebWorker" />

export type {};
declare let self: ServiceWorkerGlobalScope;

export type LoadServiceWorkerOptions = {
  scope?: string;
  serviceWorkerUrl?: string;
};

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
          /**
           * Do we really need this??? We aren't using it anywhere or returning the registration.
           */

          // .then((registration) => {
          //   if (registration.waiting) {
          //     return registration.waiting;
          //   }

          //   return new Promise<ServiceWorker>((resolve) => {
          //     if (registration.installing) {
          //       registration.installing.addEventListener("statechange", () => {
          //         if (registration.waiting) {
          //           resolve(registration.waiting);
          //         }
          //       });
          //     } else {
          //       registration.addEventListener("updatefound", () => {
          //         if (registration.installing) {
          //           registration.installing.addEventListener(
          //             "statechange",
          //             () => {
          //               if (registration.waiting) {
          //                 resolve(registration.waiting);
          //               }
          //             }
          //           );
          //         }
          //       });
          //     }
          //   });
          // })

          .then(() => {
            // (ShafSpecs) Is adding this debug too much?
            // logger.debug("Syncing manifest...");

            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: "SYNC_REMIX_MANIFEST",
                manifest: window.__remixManifest,
              });
            } else {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => {
                  // (ShafSpecs) Is adding this debug too much?
                  // logger.debug("Syncing manifest...");

                  navigator.serviceWorker.controller?.postMessage({
                    type: "SYNC_REMIX_MANIFEST",
                    manifest: window.__remixManifest,
                  });
                }
              );
            }
          })
          .then(
            () => null
            // logger.debug(
            //   "Service worker registered",
            //   navigator.serviceWorker.controller
            // )
          );
      } catch (error) {
        // logger.error("Service worker registration failed", error);
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
