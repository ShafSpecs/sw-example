/// <reference lib="WebWorker" />

import { claimClient } from "./worker/loader";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = 'page-cache-v1'
const DATA = 'data-cache-v1'
const ASSETS = 'assets-cache-v1'

// Disables all logs in the console.
// Check `worker/core.ts` for more granular control and log levels.
// self.__DISABLE_PWA_DEV_LOGS = true;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

claimClient();