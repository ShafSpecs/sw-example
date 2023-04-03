import type { Strategy } from "./strategy";

// todo: Add more typings to the callbacks. This is quite ugly

export interface StrategyPlugin {
  // Called before a request is made to the network or cache.
  // Can be used to modify the request or return a different request, for example.
  requestWillFetch?: (options: {request: Request}) => Promise<Request>;

  // Called when a request fails to be fetched and stored in the cache.
  // Can be used to register a background sync task, for example.
  fetchDidFail?: (options: {request: Request}) => Promise<void>;

  // Called before a response is stored in the cache.
  cacheWillUpdate?: (options: {request: Request, response: Response, event?: ExtendableEvent}) => Promise<Response>;

  // Called after a response is stored in the cache.
  // Can be used to perform additional actions, such as analytics tracking.
  cacheDidUpdate?: (options: {cacheName: string, request: Request, oldResponse?: Response, newResponse: Response, event?: ExtendableEvent}) => Promise<void>;

  // Called before a cached response is used to respond to a fetch event.
  cachedResponseWillBeUsed?: (options: {cacheName: string, request: Request, matchOptions: CacheQueryOptions, cachedResponse: Response, event?: ExtendableEvent}) => Promise<Response | null>;

  // Called when a cached response is deleted from the cache, either explicitly or due to cache eviction.
  // Can be used to perform additional cleanup, such as deleting related data in other caches.
  cacheDidDelete?: (options: {cacheName: string, request?: Request, cachedResponse?: Response, matchOptions?: CacheQueryOptions}) => Promise<void>;

  // Called when a fetch request is made, whether it's made directly by the application or by the service worker.
  // Can be used to modify the request, for example.
  fetchDidStart?: (options: {request: Request}) => Promise<void>;

  // Called after a response is received from the network, but before it's stored in the cache.
  // Can be used to modify the response, for example.
  fetchDidReceive?: (options: {request: Request, response: Response}) => Promise<Response>;

  // Called after a response is stored in the cache, but before it's returned to the application.
  // Can be used to modify the cached response, for example.
  cachedResponseWillBeRead?: (options: {cacheName: string, request: Request, matchOptions: CacheQueryOptions, cachedResponse: Response}) => Promise<Response>;

  // Called after a fetch request is made and a response is received from the network, but before it's returned to the application.
  // Can be used to modify the response, for example.
  fetchDidSucceed?: (options: {request: Request, response: Response}) => Promise<Response>;

  // Called before a cached response is used to respond to a fetch event, to check if it's still valid.
  // Can be used to implement custom caching logic, for example based on the age or content of the cached response.
  cachedResponseIsValid?: (options: {cacheName: string, request: Request, matchOptions: CacheQueryOptions, cachedResponse: Response}) => Promise<boolean>;

  // Called before a response is stored in the cache, to check if it should be cached.
  // Can be used to implement custom caching logic, for example based on the response headers or status.
  responseShouldBeCached?: (options: {request: Request, response: Response}) => Promise<boolean>;
  
  // Called when a fetch request is made to a URL that is not in the cache, to allow the plugin to fetch it and store it.
  // Can be used to implement custom caching logic, for example to cache requests that match a certain pattern.
  cacheableFetchDidFetch?: (options: {request: Request}) => Promise<Response>;
}

