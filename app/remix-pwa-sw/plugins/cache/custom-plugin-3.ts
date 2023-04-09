/**
 * Another expiration plugin 
 */

// To be run when updating the cache. Clears expired cache from a paricular store 
// can stil be improved. 

// class CachesExpiryPlugin implements StrategyPlugin {
  // async cacheWillExpire(cache: Cache): Promise<void> {
  //   const keys = await cache.keys();
  //   const now = Date.now();

  //   for (const key of keys) {
  //     const response = await cache.match(key);

  //     if (response) {
  //       const dateHeader = response.headers.get('date');
  //       const cacheTime = dateHeader ? new Date(dateHeader).getTime() : null;

  //       if (cacheTime && now - cacheTime > MAX_CACHE_AGE) {
  //         await cache.delete(key);
  //       }
  //     }
  //   }
  // }
// }
