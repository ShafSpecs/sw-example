/// <reference lib="WebWorker" />

import { claimClient } from "./worker/loader";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = 'page-cache-v1'
const DATA = 'data-cache-v1'
const ASSETS = 'assets-cache-v1'

self.__DISABLE_PWA_DEV_LOGS = true;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

claimClient();