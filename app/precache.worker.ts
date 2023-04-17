/// <reference lib="WebWorker" />

import { matchRequest } from "./remix-pwa-sw/handler/fetch";
import { RemixMessageHandler } from "./remix-pwa-sw/handler/message";
import { CacheFirst, NetworkFirst } from "./remix-pwa-sw/handler/strategy";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache";
const DATA = "data-cache";
const ASSETS = "assets-cache";
const StaticAssets = ["/build/", "/icons/"];

const assetHandler = new CacheFirst({ cacheName: ASSETS });
const pageHandler = new NetworkFirst({ cacheName: PAGES });
// const dataHandler = new NetworkFirst({ cacheName: DATA, isLoader: true });
const dataHandler = new NetworkFirst({ cacheName: DATA });

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

export const handlePush = async (event: PushEvent) => {
  const data = JSON.parse(event?.data!.text());
  const title = data.title ? data.title : "Remix PWA";

  const options = {
    body: data.body ? data.body : "Notification Body Text",
    icon: data.icon ? data.icon : "/icons/android-icon-192x192.png",
    badge: data.badge ? data.badge : "/icons/android-icon-48x48.png",
    dir: data.dir ? data.dir : "auto",
    image: data.image ? data.image : undefined,
    silent: data.silent ? data.silent : false,
  };

  self.registration.showNotification(title, {
    ...options,
  });
};


self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const remixMessageHandler = new RemixMessageHandler();

self.addEventListener("message", (event) => {
  event.waitUntil(remixMessageHandler.handle(event, {
    dataCache: DATA,
    assetCache: ASSETS,
    documentCache: PAGES
  }));
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetchHandler(event));
});