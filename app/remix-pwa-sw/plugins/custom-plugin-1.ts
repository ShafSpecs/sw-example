/**
 * Another simple implementation
 */

// class CustomPlugin implements StrategyPlugin {
//   cacheWillExpire(args: CacheWillExpireArgs): boolean {
//     const {cacheName, cachedResponse, matchOptions} = args;

//     // Check if the cached response has expired
//     const isExpired = isResponseExpired(cachedResponse);

//     if (isExpired) {
//       // Remove the expired response from the cache
//       caches.open(cacheName).then(cache => {
//         cache.delete(args.request, {ignoreSearch: matchOptions.ignoreSearch});
//       });
//     }

//     // Return true if the response has expired
//     return isExpired;
//   }
// }
