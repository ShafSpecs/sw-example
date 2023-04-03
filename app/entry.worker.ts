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

import { logger } from "./worker/_private";
import {
  isAssetRequest,
  isDocumentRequest,
  isLoaderRequest,
} from "./worker/common";
import { Strategy } from "./worker/strategy";
import { CacheFirst, NetworkFirst } from "./worker/strategy";

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

// Custom matcher to match the incoming request
const matchRequest = (
  request: Request
): boolean => {
  switch (true) {
    case isImageRequest(request):
    case isLoaderRequest(request)?.valueOf():
    case isAssetRequest(request):
    case isDocumentRequest(request):
      return true;
    default:
      return false;
  }
};

// ---- Example ----
// Creating a custom strategy for the images
// This strategy would serve from cache and update
// the cache with network in the background - kinda 
// (StaleWhileRevalidate)
class ImageCacheStrategy extends Strategy {
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

const fetchHandler = async (event: FetchEvent): Promise<Response> => {
  const { request } = event;
  // const match = matchRequest(request);

  let strategy: Strategy;

  // Run through the matched request and use the appropriate strategy
  // to handle the request.
  //
  // P.S.: Still open to better implementations for this. Is possible, wrap into
  // functions instead of initializing the strategy in code directly?
  // 
  // Btw, might seem weird that I'm matching and doing conditionals after, 
  // that's bcus I changed the implementation midway. It was previously switch 
  // case, but I changed it to if-else to make it more readable and fix some weird bug.
  // 
  // Also, this is not recommended. Don't cache images directly like this. Eats up browser 
  // storage quickly. This is just for showcase purposes.
  if (isImageRequest(request)) {
    strategy = new ImageCacheStrategy({
      cacheName: IMAGES,
      matchOptions: {
        ignoreSearch: true,
      },
    });

    return strategy.handle(request);
  }

  if (isAssetRequest(request)) {
    strategy = new CacheFirst({
      cacheName: ASSETS,
      matchOptions: {
        ignoreSearch: true,
        ignoreVary: true,
      },
    });

    return strategy.handle(request);
  }

  if (isLoaderRequest(request)) {
    strategy = new NetworkFirst({
      cacheName: DATA,
    });

    return strategy.handle(request);
  }

  if (isDocumentRequest(request)) {
    strategy = new CacheFirst({
      cacheName: PAGES
    });

    return strategy.handle(request);
  }

  return fetch(request.clone());
};

const messageHandler = async (event: ExtendableMessageEvent) => {
  const { data } = event;
  let cachePromises: Map<string, Promise<void>> = new Map();

  if (data.type === "REMIX_NAVIGATION") {
    let { isMount, location, matches, manifest } = data;
    let documentUrl = location.pathname + location.search + location.hash;

    let [dataCache, documentCache, existingDocument] = await Promise.all([
      caches.open(DATA),
      caches.open(PAGES),
      caches.match(documentUrl),
    ]);

    if (!existingDocument || !isMount) {
      // debug("Caching document for", documentUrl);
      cachePromises.set(
        documentUrl,
        documentCache.add(documentUrl).catch((error) => {
          // debug(`Failed to cache document for ${documentUrl}:`, error);
        })
      );
    }

    if (isMount) {
      for (let match of matches) {
        if (manifest.routes[match.id].hasLoader) {
          let params = new URLSearchParams(location.search);
          params.set("_data", match.id);
          let search = params.toString();
          search = search ? `?${search}` : "";
          let url = location.pathname + search + location.hash;
          if (!cachePromises.has(url)) {
            // debug("Caching data for", url);
            cachePromises.set(
              url,
              dataCache.add(url).catch((error) => {
                // debug(`Failed to cache data for ${url}:`, error);
              })
            );
          }
        }
      }
    }
  }

  await Promise.all(cachePromises.values());
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
  event.waitUntil(messageHandler(event));
});

self.addEventListener("push", (event) => {});
