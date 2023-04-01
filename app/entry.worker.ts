/// <reference lib="WebWorker" />

import { logger } from "./deprecated/core";
import { claimClient } from "./deprecated/loader";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache-v1";
const DATA = "data-cache-v1";
const ASSETS = "assets-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", () => {
  
});
