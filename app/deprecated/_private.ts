/**
 * Literally APIs you won't use outside the `sw` module
 */

import { Router } from "./routing";
import type { RouteHandlerCallback, RouteHandler_ } from "./types";

export const normalizeHandler = (
  handler: RouteHandler_
): { handle: RouteHandlerCallback } => {
  if (handler && typeof handler === "object") {
    return handler;
  } else {
    return { handle: handler };
  }
};

let defaultRouter: Router;

export const getOrCreateDefaultRouter = (): Router => {
  if (!defaultRouter) {
    defaultRouter = new Router();

    // The helpers that use the default Router assume these listeners exist.
    defaultRouter.addFetchListener();
    defaultRouter.addCacheListener();
  }
  return defaultRouter;
};

export function timeout(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function stripParams(fullURL: string, ignoreParams: string[]) {
  const strippedURL = new URL(fullURL);
  for (const param of ignoreParams) {
    strippedURL.searchParams.delete(param);
  }
  return strippedURL.href;
}

export async function cacheMatchIgnoreParams(
  cache: Cache,
  request: Request,
  ignoreParams: string[],
  matchOptions?: CacheQueryOptions,
): Promise<Response | undefined> {
  const strippedRequestURL = stripParams(request.url, ignoreParams);

  // If the request doesn't include any ignored params, match as normal.
  if (request.url === strippedRequestURL) {
    return cache.match(request, matchOptions);
  }

  // Otherwise, match by comparing keys
  const keysOptions = {...matchOptions, ignoreSearch: true};
  const cacheKeys = await cache.keys(request, keysOptions);

  for (const cacheKey of cacheKeys) {
    const strippedCacheKeyURL = stripParams(cacheKey.url, ignoreParams);
    if (strippedRequestURL === strippedCacheKeyURL) {
      return cache.match(cacheKey, matchOptions);
    }
  }
  return;
}


export function toRequest(input: RequestInfo) {
  return typeof input === 'string' ? new Request(input) : input;
}

export class Deferred<T> {
  promise: Promise<T>;
  resolve!: (value: T) => void;
  reject!: (reason?: any) => void;

  /**
   * Creates a promise and exposes its resolve and reject functions as methods.
   */
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}