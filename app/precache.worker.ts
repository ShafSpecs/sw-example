/// <reference lib="WebWorker" />

import {
  matchRequest,
  CacheFirst,
  NetworkFirst,
  PrecacheHandler
} from "@remix-pwa/sw";

declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache";
const DATA = "data-cache";
const ASSETS = "assets-cache";
const StaticAssets = ["/build/", "/icons/"];

const assetHandler = new CacheFirst({ cacheName: ASSETS });
const pageHandler = new NetworkFirst({ cacheName: PAGES });
const dataHandler = new NetworkFirst({ cacheName: DATA, isLoader: true });


const navigationHandler = new PrecacheHandler({ dataCacheName: DATA, documentCacheName: PAGES, assetCacheName: ASSETS })


const fetchHandler = async (event: FetchEvent): Promise<Response> => {
  const { request } = event;
  const match = matchRequest(request, StaticAssets);

  switch (match) {
    case "asset":
      return assetHandler.handle(request);
    case "document":
      return pageHandler.handle(request);
    case "loader":
      return dataHandler.handle(request);
    default:
      return fetch(request.clone());
  }
};


self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  event.waitUntil(navigationHandler.handle(event));
});

// self.addEventListener("push", (event) => {
//   event.waitUntil(handlePush(event));
// });

self.addEventListener("fetch", (event) => {
  event.respondWith(fetchHandler(event));
});
