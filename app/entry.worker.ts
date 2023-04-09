/// <reference lib="WebWorker" />

// BUGS: None for now.
// 
// FIXES: 
//   - Fixed the loader not cahing issue, was caused by `matchRequest` function
//   - Wasn't working offline. Issue was I mistakenly used `event.waitUntil` in the `fetch` event
//     listener 
//
// This worker showcases most of the progress made; strategies, custom strategies;
// custom handlers, custom matchers, etc. Still a lot more to be improved on.

import { logger } from "./remix-pwa-sw/core/_private";
import {
  isAssetRequest,
  isDocumentRequest,
  isLoaderRequest,
} from "./remix-pwa-sw/core/common";
import { handleFetchRequest } from "./remix-pwa-sw/handler/fetch";
import { PingHandler, RemixMessageHandler } from "./remix-pwa-sw/handler/message";
import { CacheStrategy } from "./remix-pwa-sw/handler/strategy";
import { CacheFirst, NetworkFirst } from "./remix-pwa-sw/handler/strategy";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache";
const DATA = "data-cache";
const ASSETS = "assets-cache";
const IMAGES = "images-cache";

// A custom case for cahing (cache images separately)
const isImageRequest = (request: Request) => {
  return request.destination === "image";
};

// ---- Example ----
// Creating a custom strategy for the images
// This strategy would serve from cache and update
// the cache with network in the background - kinda
// (StaleWhileRevalidate)
class ImageCacheStrategy extends CacheStrategy {
  async _handle(request: Request) {
    const cache = await caches.open(IMAGES);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const response = await fetch(request);
      if (response.status === 200) {
        await cache.put(request, response.clone());
      }

      return response;
    } else {
      const response = await fetch(request);
      if (response.status === 200) {
        await cache.put(request, response.clone());
      }

      return response;
    }
  }
}

const imageCacheStrategy = new ImageCacheStrategy({
  cacheName: IMAGES,
  matchOptions: {
    ignoreSearch: true,
  },
});

const assetCacheStrategy = new CacheFirst({
  cacheName: ASSETS,
  matchOptions: {
    ignoreSearch: true,
    ignoreVary: true,
  },
});

const loaderCacheStrategy = new NetworkFirst({
  cacheName: DATA,
});

const pageCacheStrategy = new CacheFirst({
  cacheName: PAGES
});

const pingMessageHandler = new PingHandler();
const remixMessageHandler = new RemixMessageHandler();

const fetchHandler = async (event: FetchEvent): Promise<Response> => {
  const { request } = event;

  // Run through the matched request and use the appropriate strategy
  // to handle the request.
  // 
  // Also, this is not recommended. Don't cache images directly like this. Eats up browser 
  // storage quickly. This is just for showcase purposes.
  if (isImageRequest(request)) {
    return handleFetchRequest(request, imageCacheStrategy)
  }

  if (isAssetRequest(request)) {
    return handleFetchRequest(request, assetCacheStrategy)
  }

  if (isLoaderRequest(request)) {
    return handleFetchRequest(request, loaderCacheStrategy)
  }

  if (isDocumentRequest(request)) {
    return handleFetchRequest(request, pageCacheStrategy)
  }

  return fetch(request.clone());
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
  // event.waitUntil(pingMessageHandler.handle(event));
  event.waitUntil(remixMessageHandler.handle(event, { 
    'caches': {
      DATA,
      PAGES,
    }
   }));
});

self.addEventListener("push", (event) => {});
