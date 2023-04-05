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
