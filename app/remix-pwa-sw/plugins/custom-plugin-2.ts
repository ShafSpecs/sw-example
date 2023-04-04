/**
 * Another pseudocode for a plugin
 */

// Prune expired caches from **all** caches
// To be run not quite often. Would work good with a periodic sync plugin 

// class CachesExpiryPlugin implements StrategyPlugin {
//   async cachesWillExpire(cacheNames: string[]): Promise<void> {
//     const now = Date.now();

//     await Promise.all(
//       cacheNames.map(async (cacheName) => {
//         const cache = await caches.open(cacheName);
//         const keys = await cache.keys();

//         await Promise.all(
//           keys.map(async (request) => {
//             const response = await cache.match(request);
//             const cacheControl = response?.headers.get('Cache-Control');
//             const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
//             const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : null;
//             const expirationTime = response?.headers.get('Expires') ?? null;

//             if ((maxAge && now - response?.headers.get('date') >= maxAge) || (expirationTime && now >= Date.parse(expirationTime))) {
//               await cache.delete(request);
//               console.log(`Deleted expired cache entry for ${request.url}`);
//             }
//           })
//         );
//       })
//     );
//   }
// }