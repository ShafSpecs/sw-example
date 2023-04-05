/// <reference lib="WebWorker" />

import { registerRoute, setDefaultHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

import { 
  matchAssetRequest, 
  matchDocumentRequest, 
  matchLoaderRequest, 
  remixLoaderPlugin 
} from '~/remix-pwa-sw/workbox'

import { 
  handlePush,
  handleMessage
} from '~/remix-pwa-sw'

declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache-v1";
const DATA = "data-cache-v1";
const ASSETS = "assets-cache-v1";
const StaticAssets = ['/build/', '/icons/']

function debug(...messages: any[]) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(...messages);
  }
}

// (dev-afzalansari) - TODO: This plugin is just for testing workbox in development
// remove this plugin while creating a template from it.
const backgroundSyncPlugin = new BackgroundSyncPlugin("loaderQueue", {
  maxRetentionTime: 60 * 24,
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const replayedResponse = await fetch(entry.request.clone());
        const dataCache = await caches.open(DATA);
        await dataCache.put(entry.request, replayedResponse.clone());

        debug(
          `Request for '${entry.request.url}' ` +
            `has been replayed in queue '${queue.name}'`
        );
      } catch (error) {
        await queue.unshiftRequest(entry);

        debug(
          `Request for '${entry.request.url}' ` +
            `failed to replay, putting it back in queue '${queue.name}'`
        );
      }
    }
    debug(
      `All requests in queue '${queue.name}' have successfully ` +
        `replayed; the queue is now empty!`
    );
  },
});
//////////////////////////////


// Assets
registerRoute((event) => matchAssetRequest(event, StaticAssets),
  new CacheFirst({
    cacheName: ASSETS,
  })
);

// Loaders
registerRoute(
  matchLoaderRequest,
  new NetworkFirst({
    cacheName: DATA,
    plugins: [backgroundSyncPlugin, remixLoaderPlugin],
  })
);

// Documents
registerRoute(
  matchDocumentRequest,
  new NetworkFirst({
    cacheName: PAGES,
  })
);

setDefaultHandler(({ request }) => {
  return fetch(request.clone());
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

self.addEventListener("message", (event) => {
  event.waitUntil(handleMessage(event, { dataCache: DATA, documentCache: PAGES }));
});
