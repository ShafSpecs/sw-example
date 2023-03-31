/// <reference lib="WebWorker" />

import { logger } from "./worker/core";
import { claimClient } from "./worker/loader";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache-v1";
const DATA = "data-cache-v1";
const ASSETS = "assets-cache-v1";

// Disables all logs in the console.
// Check `worker/core.ts` for more granular control and log levels.
// self.__DISABLE_PWA_DEV_LOGS = true;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// contains an "active" eventListener
// claims the client `clients.claim()`
claimClient();

self.addEventListener("activate", () => {
  // if (self.registration.navigationPreload) {
  //   self.registration.navigationPreload.enable();
  // }
  if (self.registration.active?.scriptURL === self.location.href) {
    // If the active service worker is not the same as the one that just became active (i.e. this one)
    // logger.warn("Uh oh! Service Worker is not active!", self.registration.active?.scriptURL, self.location.href);
    
    logger.log(
      "🚀 Service Worker is active!",
      self.registration.active?.scriptURL,
    );
  }
});
