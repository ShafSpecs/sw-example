/// <reference lib="WebWorker" />

import {
  matchRequest,
  CacheFirst,
  NetworkFirst,
  RemixNavigationHandler
} from "@remix-pwa/sw";

declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache-v1";
const DATA = "data-cache-v1";
const ASSETS = "assets-cache-v1";
const StaticAssets = ["/build/", "/icons/"];


const navigationHandler = new RemixNavigationHandler({ dataCacheName: DATA, documentCacheName: PAGES })

const assetHandler = new CacheFirst({ cacheName: ASSETS });
const pageHandler = new NetworkFirst({ cacheName: PAGES });
const dataHandler = new NetworkFirst({ cacheName: DATA, isLoader: true });

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

self.addEventListener("fetch", (event) => {
  event.respondWith(fetchHandler(event));
});

self.addEventListener("message", (event) => {
  event.waitUntil(
    navigationHandler.handle(event)
  );
});

// self.addEventListener("push", (event) => {
//   event.waitUntil(handlePush(event));
// });
