/// <reference lib="WebWorker" />

import type { RouteHandlerCallbackOptions} from "./routing";
import { Route, Router, setCatchHandler} from "./routing";
import { registerRoute, setDefaultHandler } from "./routing";
import { debug, matchAssetRequest, matchDocumentRequest, matchLoaderRequest } from "./sw2";
import { NetworkFirst } from './nw';
import { CachedResponseWillBeUsedCallback, CachedResponseWillBeUsedCallbackParam, FetchDidSucceedCallback, FetchDidSucceedCallbackParam, HandlerDidErrorCallback } from "./types";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = 'page-cache-v1'
const DATA = 'data-cache-v1'
const ASSETS = 'assets-cache-v1'

const handlerCb = async ({url, request, event, params}: RouteHandlerCallbackOptions) => {
  const response = await fetch(request);
  const responseBody = await response.text();
  return new Response(`${responseBody}`, {
    headers: response.headers,
  });
};

async function handleMessage(event: ExtendableMessageEvent) {
  const cachePromises: Map<string, Promise<void>> = new Map();

  console.log(event.data.type);

  if (event.data.type === "REMIX_NAVIGATION") {
    const { isMount, location, matches, manifest } = event.data;
    const documentUrl = location.pathname + location.search + location.hash;

    const [dataCache, documentCache, existingDocument] = await Promise.all([
      caches.open(DATA),
      caches.open(PAGES),
      caches.match(documentUrl),
    ]);

    if (!existingDocument || !isMount) {
      debug("Caching document for", documentUrl);
      cachePromises.set(
        documentUrl,
        documentCache.add(documentUrl).catch((error) => {
          debug(`Failed to cache document for ${documentUrl}:`, error);
        }),
      );
    }

    if (isMount) {
      for (const match of matches) {
        if (manifest.routes[match.id].hasLoader) {
          const params = new URLSearchParams(location.search);
          params.set("_data", match.id);
          let search = params.toString();
          search = search ? `?${search}` : "";
          const url = location.pathname + search + location.hash;
          if (!cachePromises.has(url)) {
            debug("Caching data for", url);
            cachePromises.set(
              url,
              dataCache.add(url).catch((error) => {
                debug(`Failed to cache data for ${url}:`, error);
              }),
            );
          }
        }
      }
    }
  }

  await Promise.all(cachePromises.values());
}

type RemixLoaderPlugin = {
  cachedResponseWillBeUsed: CachedResponseWillBeUsedCallback;
  handlerDidError: HandlerDidErrorCallback;
  fetchDidSucceed: FetchDidSucceedCallback;
};

// Loader Plugin
const remixLoaderPlugin: RemixLoaderPlugin = {
  fetchDidSucceed: async ({ response }: FetchDidSucceedCallbackParam) => {
    // @ts-ignore
    console.log('manifest', self.__remixManifest)
    return response
  },
  cachedResponseWillBeUsed: async ({
    cachedResponse,
  }: CachedResponseWillBeUsedCallbackParam) => {
    cachedResponse?.headers.set("X-Remix-Worker", "yes");
    return cachedResponse;
  },
  handlerDidError: async () => {
    return new Response(JSON.stringify({ message: "Network Error" }), {
      status: 500,
      statusText: "Internal Server Error",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Remix-Catch": "yes",
        "X-Remix-Worker": "yes",
      },
    });
  },
};

// Assets
registerRoute(matchAssetRequest, new NetworkFirst({
  cacheName: ASSETS
}));

// Loaders
registerRoute(matchLoaderRequest, new NetworkFirst({
  cacheName: DATA,
  plugins: [remixLoaderPlugin],
}));

// Documents
registerRoute(matchDocumentRequest, new NetworkFirst({
  cacheName: PAGES
}));

// setCatchHandler(async ({url, event, params}) => {
//   console.log("Falling back to catch handler");
//   const response = await fetch(url.href);
//   const responseBody = await response.text();
//   return new Response(`${responseBody}`, {
//     headers: response.headers,
//   });
// });

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  event.waitUntil(handleMessage(event))
})

// const router = new Router();

// self.addEventListener('fetch', event => {
//   const {request} = event;
//   const responsePromise = router.handleRequest({
//     event,
//     request,
//   });
//   if (responsePromise) {
//     console.log(request.url);
    
//     // Router found a route to handle the request.
//     event.respondWith(responsePromise);
//   } else {
//     // No route was found to handle the request.
//   }
// });

// const matchCb = ({url, request, event}: RouteHandlerCallbackOptions) => {
//   return url.pathname === '/parent';
// };

// router.registerRoute(new Route(matchCb, handlerCb));
// router.registerRoute(new Route(matchLoaderRequest, handlerCb))
// router.registerRoute(new Route(matchAssetRequest, handlerCb))

setDefaultHandler(async ({ request }) => {
  console.log("Falling back to default handler");
  return fetch(request.clone())
})