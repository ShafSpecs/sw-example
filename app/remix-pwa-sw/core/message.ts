import type { AssetsManifest } from "@remix-run/react/dist/entry";
import type { EntryRoute } from "@remix-run/react/dist/routes";

export async function handleMessage(
  event: ExtendableMessageEvent,
  {
    dataCache,
    documentCache,
  }: {
    dataCache: string;
    documentCache: string;
  }
) {
  const cachePromises: Map<string, Promise<void>> = new Map();

  if (event.data.type === "REMIX_NAVIGATION") {
    const { isMount, location, matches, manifest } = event.data;
    const documentUrl = location.pathname + location.search + location.hash;

    const [DataCache, DocumentCache, existingDocument] = await Promise.all([
      caches.open(dataCache),
      caches.open(documentCache),
      caches.match(documentUrl),
    ]);

    if (!existingDocument || !isMount) {
      // debug("Caching document for", documentUrl);
      cachePromises.set(
        documentUrl,
        DocumentCache.add(documentUrl).catch((error) => {
          // debug(`Failed to cache document for ${documentUrl}:`, error);
        })
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
            //   debug("Caching data for", url);
            cachePromises.set(
              url,
              DataCache.add(url).catch((error) => {
                //   debug(`Failed to cache data for ${url}:`, error);
              })
            );
          }
        }
      }
    }
  }

  await Promise.all(cachePromises.values());
}


export async function handleSyncRemixManifest(event: ExtendableMessageEvent, {
  dataCache,
  documentCache,
  assetCache
}: {
  dataCache: string;
  documentCache: string;
  assetCache: string;
}) {
  console.debug("sync manifest");
  const cachePromises: Map<string, Promise<void>> = new Map();
  const [DataCache, DocumentCache, AssetCache] = await Promise.all([
    caches.open(dataCache),
    caches.open(documentCache),
    caches.open(assetCache),
  ]);
  const manifest: AssetsManifest = event.data.manifest;
  const routes = Object.values(manifest.routes);

  for (const route of routes) {
    if (route.id.includes("$")) {
      console.debug("parametrized route", route.id);
      continue;
    }

    cacheRoute(route);
  }

  await Promise.all(cachePromises.values());

  function cacheRoute(route: EntryRoute) {
    const pathname = getPathname(route);
    if (route.hasLoader) {
      cacheLoaderData(route);
    }

    if (route.module) {
      cachePromises.set(route.module, cacheAsset(route.module));
    }

    if (route.imports) {
      for (const assetUrl of route.imports) {
        // debug(route.index, route.parentId, route.imports, route.module);
        if (cachePromises.has(assetUrl)) {
          continue;
        }

        cachePromises.set(assetUrl, cacheAsset(assetUrl));
      }
    }

    cachePromises.set(
      pathname,
      DocumentCache.add(pathname).catch((error) => {
        console.debug(`Failed to cache document ${pathname}:`, error);
      })
    );
  }

  function cacheLoaderData(route: EntryRoute) {
    const pathname = getPathname(route);
    const params = new URLSearchParams({ _data: route.id });
    const search = `?${params.toString()}`;
    const url = pathname + search;
    if (!cachePromises.has(url)) {
      console.debug("Caching data for", url);
      cachePromises.set(
        url,
        DataCache.add(url).catch((error) => {
          console.debug(`Failed to cache data for ${url}:`, error);
        })
      );
    }
  }

  async function cacheAsset(assetUrl: string) {
    if (await AssetCache.match(assetUrl)) {
      return;
    }

    console.debug("Caching asset", assetUrl);
    return AssetCache.add(assetUrl).catch((error) => {
      console.debug(`Failed to cache asset ${assetUrl}:`, error);
    });
  }

  function getPathname(route: EntryRoute) {
    if(route.index) return "/"

    let pathname = "";
    if (route.path && route.path.length > 0) {
      pathname = "/" + route.path;
    }
    if (route.parentId) {
      const parentPath = getPathname(manifest.routes[route.parentId]);
      if (parentPath) {
        pathname = parentPath + pathname;
      }
    }
    return pathname;
  }
}