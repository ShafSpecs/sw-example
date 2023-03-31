/// <reference lib="WebWorker" />

import type { HandlerCBCallback } from "./routing";
import type { MapLikeObject, WorkboxPlugin, WorkboxPluginCallbackParam } from "./types";

export type {};
declare let self: ServiceWorkerGlobalScope;

export interface StrategyOptions {
  cacheName?: string;
  plugins?: WorkboxPlugin[];
  fetchOptions?: RequestInit;
  matchOptions?: CacheQueryOptions;
}

interface RouteHandlerObject {
    handle: HandlerCBCallback;
}

export declare interface RouteHandlerCallbackOptions {
  event: ExtendableEvent;
  request: Request;
  url: URL;
  params?: string[] | MapLikeObject;
}

/**
 * Options passed to a `ManualHandlerCallback` function.
 */
export interface ManualHandlerCallbackOptions {
  event: ExtendableEvent;
  request: Request | string;
}

export type HandlerCallbackOptions =
  | RouteHandlerCallbackOptions
  | ManualHandlerCallbackOptions;

/**
 * An abstract base class that all other strategy classes must extend from:
 *
 * @memberof workbox-strategies
 */
export abstract class Strategy implements RouteHandlerObject {
  cacheName: string;
  plugins: WorkboxPlugin[];
  fetchOptions?: RequestInit;
  matchOptions?: CacheQueryOptions;

  protected abstract _handle(
    request: Request,
    handler: StrategyHandler,
  ): Promise<Response | undefined>;

  /**
   * Creates a new instance of the strategy and sets all documented option
   * properties as public instance properties.
   *
   * Note: if a custom strategy class extends the base Strategy class and does
   * not need more than these properties, it does not need to define its own
   * constructor.
   *
   * @param {Object} [options]
   * @param {string} [options.cacheName] Cache name to store and retrieve
   * requests. Defaults to the cache names provided by
   * {@link workbox-core.cacheNames}.
   * @param {Array<Object>} [options.plugins] [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
   * to use in conjunction with this caching strategy.
   * @param {Object} [options.fetchOptions] Values passed along to the
   * [`init`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
   * of [non-navigation](https://github.com/GoogleChrome/workbox/issues/1796)
   * `fetch()` requests made by this strategy.
   * @param {Object} [options.matchOptions] The
   * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
   * for any `cache.match()` or `cache.put()` calls made by this strategy.
   */
  constructor(options: StrategyOptions = {}) {
    /**
     * Cache name to store and retrieve
     * requests. Defaults to the cache names provided by
     * {@link workbox-core.cacheNames}.
     *
     * @type {string}
     */
    this.cacheName = options.cacheName ? options.cacheName : "runtime";
    /**
     * The list
     * [Plugins]{@link https://developers.google.com/web/tools/workbox/guides/using-plugins}
     * used by this strategy.
     *
     * @type {Array<Object>}
     */
    this.plugins = options.plugins || [];
    /**
     * Values passed along to the
     * [`init`]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters}
     * of all fetch() requests made by this strategy.
     *
     * @type {Object}
     */
    this.fetchOptions = options.fetchOptions;
    /**
     * The
     * [`CacheQueryOptions`]{@link https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions}
     * for any `cache.match()` or `cache.put()` calls made by this strategy.
     *
     * @type {Object}
     */
    this.matchOptions = options.matchOptions;
  }

  /**
   * Perform a request strategy and returns a `Promise` that will resolve with
   * a `Response`, invoking all relevant plugin callbacks.
   *
   * When a strategy instance is registered with a Workbox
   * {@link workbox-routing.Route}, this method is automatically
   * called when the route matches.
   *
   * Alternatively, this method can be used in a standalone `FetchEvent`
   * listener by passing it to `event.respondWith()`.
   *
   * @param {FetchEvent|Object} options A `FetchEvent` or an object with the
   *     properties listed below.
   * @param {Request|string} options.request A request to run this strategy for.
   * @param {ExtendableEvent} options.event The event associated with the
   *     request.
   * @param {URL} [options.url]
   * @param {*} [options.params]
   */
  handle(options: FetchEvent | HandlerCallbackOptions): Promise<Response> {
    const [responseDone] = this.handleAll(options);
    return responseDone;
  }

  /**
   * Similar to {@link workbox-strategies.Strategy~handle}, but
   * instead of just returning a `Promise` that resolves to a `Response` it
   * it will return an tuple of `[response, done]` promises, where the former
   * (`response`) is equivalent to what `handle()` returns, and the latter is a
   * Promise that will resolve once any promises that were added to
   * `event.waitUntil()` as part of performing the strategy have completed.
   *
   * You can await the `done` promise to ensure any extra work performed by
   * the strategy (usually caching responses) completes successfully.
   *
   * @param {FetchEvent|Object} options A `FetchEvent` or an object with the
   *     properties listed below.
   * @param {Request|string} options.request A request to run this strategy for.
   * @param {ExtendableEvent} options.event The event associated with the
   *     request.
   * @param {URL} [options.url]
   * @param {*} [options.params]
   * @return {Array<Promise>} A tuple of [response, done]
   *     promises that can be used to determine when the response resolves as
   *     well as when the handler has completed all its work.
   */
  handleAll(
    options: FetchEvent | HandlerCallbackOptions,
  ): [Promise<Response>, Promise<void>] {
    // Allow for flexible options to be passed.
    if (options instanceof FetchEvent) {
      options = {
        event: options,
        request: options.request,
      };
    }

    const event = options.event;
    const request =
      typeof options.request === 'string'
        ? new Request(options.request)
        : options.request;
    const params = 'params' in options ? options.params : undefined;

    const handler = new StrategyHandler(this, {event, request, params});

    const responseDone = this._getResponse(handler, request, event);
    const handlerDone = this._awaitComplete(
      responseDone,
      handler,
      request,
      event,
    );

    // Return an array of promises, suitable for use with Promise.all().
    return [responseDone, handlerDone];
  }

  async _getResponse(
    handler: StrategyHandler,
    request: Request,
    event: ExtendableEvent,
  ): Promise<Response> {
    await handler.runCallbacks('handlerWillStart', {event, request});

    let response: Response | undefined = undefined;
    try {
      response = await this._handle(request, handler);
      // The "official" Strategy subclasses all throw this error automatically,
      // but in case a third-party Strategy doesn't, ensure that we have a
      // consistent failure when there's no response or an error response.
      // if (!response || response.type === 'error') {
      //   throw new WorkboxError('no-response', {url: request.url});
      // }
    } catch (error) {
      if (error instanceof Error) {
        for (const callback of handler.iterateCallbacks('handlerDidError')) {
          response = await callback({error, event, request});
          if (response) {
            break;
          }
        }
      }

      if (!response) {
        throw error;
      } else if (process.env.NODE_ENV !== 'production') {
        // logger.log(
        //   `While responding to '${getFriendlyURL(request.url)}', ` +
        //     `an ${
        //       error instanceof Error ? error.toString() : ''
        //     } error occurred. Using a fallback response provided by ` +
        //     `a handlerDidError plugin.`,
        // );
      }
    }

    for (const callback of handler.iterateCallbacks('handlerWillRespond')) {
      //@ts-ignore
      response = await callback({event, request, response});
    }

    return response!;
  }

  async _awaitComplete(
    responseDone: Promise<Response>,
    handler: StrategyHandler,
    request: Request,
    event: ExtendableEvent,
  ): Promise<void> {
    let response;
    let error;

    try {
      response = await responseDone;
    } catch (error) {
      // Ignore errors, as response errors should be caught via the `response`
      // promise above. The `done` promise will only throw for errors in
      // promises passed to `handler.waitUntil()`.
    }

    try {
      await handler.runCallbacks('handlerDidRespond', {
        event,
        request,
        response,
      });
      await handler.doneWaiting();
    } catch (waitUntilError) {
      if (waitUntilError instanceof Error) {
        error = waitUntilError;
      }
    }

    await handler.runCallbacks('handlerDidComplete', {
      event,
      request,
      response,
      error: error as Error,
    });
    handler.destroy();

    if (error) {
      throw error;
    }
  }
}

export function timeout(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripParams(fullURL: string, ignoreParams: string[]) {
  const strippedURL = new URL(fullURL);
  for (const param of ignoreParams) {
    strippedURL.searchParams.delete(param);
  }
  return strippedURL.href;
}

/**
 * Matches an item in the cache, ignoring specific URL params. This is similar
 * to the `ignoreSearch` option, but it allows you to ignore just specific
 * params (while continuing to match on the others).
 *
 * @private
 * @param {Cache} cache
 * @param {Request} request
 * @param {Object} matchOptions
 * @param {Array<string>} ignoreParams
 * @return {Promise<Response|undefined>}
 */
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


function toRequest(input: RequestInfo) {
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

/**
 * A class created every time a Strategy instance instance calls
 * {@link workbox-strategies.Strategy~handle} or
 * {@link workbox-strategies.Strategy~handleAll} that wraps all fetch and
 * cache actions around plugin callbacks and keeps track of when the strategy
 * is "done" (i.e. all added `event.waitUntil()` promises have resolved).
 *
 * @memberof workbox-strategies
 */
export class StrategyHandler {
  public request!: Request;
  public url?: URL;
  public event: ExtendableEvent;
  public params?: any;

  private _cacheKeys: Record<string, Request> = {};

  private readonly _strategy: Strategy;
  private readonly _extendLifetimePromises: Promise<any>[];
  private readonly _handlerDeferred: Deferred<any>;
  private readonly _plugins: WorkboxPlugin[];
  private readonly _pluginStateMap: Map<WorkboxPlugin, MapLikeObject>;

  /**
   * Creates a new instance associated with the passed strategy and event
   * that's handling the request.
   *
   * The constructor also initializes the state that will be passed to each of
   * the plugins handling this request.
   *
   * @param {workbox-strategies.Strategy} strategy
   * @param {Object} options
   * @param {Request|string} options.request A request to run this strategy for.
   * @param {ExtendableEvent} options.event The event associated with the
   *     request.
   * @param {URL} [options.url]
   * @param {*} [options.params] The return value from the
   *     {@link workbox-routing~matchCallback} (if applicable).
   */
  constructor(strategy: Strategy, options: HandlerCallbackOptions) {
    /**
     * The request the strategy is performing (passed to the strategy's
     * `handle()` or `handleAll()` method).
     * @name request
     * @instance
     * @type {Request}
     * @memberof workbox-strategies.StrategyHandler
     */
    /**
     * The event associated with this request.
     * @name event
     * @instance
     * @type {ExtendableEvent}
     * @memberof workbox-strategies.StrategyHandler
     */
    /**
     * A `URL` instance of `request.url` (if passed to the strategy's
     * `handle()` or `handleAll()` method).
     * Note: the `url` param will be present if the strategy was invoked
     * from a workbox `Route` object.
     * @name url
     * @instance
     * @type {URL|undefined}
     * @memberof workbox-strategies.StrategyHandler
     */
    /**
     * A `param` value (if passed to the strategy's
     * `handle()` or `handleAll()` method).
     * Note: the `param` param will be present if the strategy was invoked
     * from a workbox `Route` object and the
     * {@link workbox-routing~matchCallback} returned
     * a truthy value (it will be that value).
     * @name params
     * @instance
     * @type {*|undefined}
     * @memberof workbox-strategies.StrategyHandler
     */
    // if (process.env.NODE_ENV !== 'production') {
    //   assert!.isInstance(options.event, ExtendableEvent, {
    //     moduleName: 'workbox-strategies',
    //     className: 'StrategyHandler',
    //     funcName: 'constructor',
    //     paramName: 'options.event',
    //   });
    // }

    Object.assign(this, options);

    this.event = options.event;
    this._strategy = strategy;
    this._handlerDeferred = new Deferred();
    this._extendLifetimePromises = [];

    // Copy the plugins list (since it's mutable on the strategy),
    // so any mutations don't affect this handler instance.
    this._plugins = [...strategy.plugins];
    this._pluginStateMap = new Map();
    for (const plugin of this._plugins) {
      this._pluginStateMap.set(plugin, {});
    }

    this.event.waitUntil(this._handlerDeferred.promise);
  }

  /**
   * Fetches a given request (and invokes any applicable plugin callback
   * methods) using the `fetchOptions` (for non-navigation requests) and
   * `plugins` defined on the `Strategy` object.
   *
   * The following plugin lifecycle methods are invoked when using this method:
   * - `requestWillFetch()`
   * - `fetchDidSucceed()`
   * - `fetchDidFail()`
   *
   * @param {Request|string} input The URL or request to fetch.
   * @return {Promise<Response>}
   */
  async fetch(input: RequestInfo): Promise<Response> {
    const {event} = this;
    let request: Request = toRequest(input);

    if (
      request.mode === 'navigate' &&
      event instanceof FetchEvent &&
      event.preloadResponse
    ) {
      const possiblePreloadResponse = (await event.preloadResponse) as
        | Response
        | undefined;
      if (possiblePreloadResponse) {
        // if (process.env.NODE_ENV !== 'production') {
        //   logger.log(
        //     `Using a preloaded navigation response for ` +
        //       `'${getFriendlyURL(request.url)}'`,
        //   );
        // }
        return possiblePreloadResponse;
      }
    }

    // If there is a fetchDidFail plugin, we need to save a clone of the
    // original request before it's either modified by a requestWillFetch
    // plugin or before the original request's body is consumed via fetch().
    const originalRequest = this.hasCallback('fetchDidFail')
      ? request.clone()
      : null;

    try {
      for (const cb of this.iterateCallbacks('requestWillFetch')) {
        request = await cb({request: request.clone(), event});
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new Error("plugin-error-request-will-fetch");
        // throw new WorkboxError('plugin-error-request-will-fetch', {
        //   thrownErrorMessage: err.message,
        // });
      }
    }

    // The request can be altered by plugins with `requestWillFetch` making
    // the original request (most likely from a `fetch` event) different
    // from the Request we make. Pass both to `fetchDidFail` to aid debugging.
    const pluginFilteredRequest: Request = request.clone();

    try {
      let fetchResponse: Response;

      // See https://github.com/GoogleChrome/workbox/issues/1796
      fetchResponse = await fetch(
        request,
        request.mode === 'navigate' ? undefined : this._strategy.fetchOptions,
      );

      // if (process.env.NODE_ENV !== 'production') {
      //   logger.debug(
      //     `Network request for ` +
      //       `'${getFriendlyURL(request.url)}' returned a response with ` +
      //       `status '${fetchResponse.status}'.`,
      //   );
      // }

      for (const callback of this.iterateCallbacks('fetchDidSucceed')) {
        fetchResponse = await callback({
          event,
          request: pluginFilteredRequest,
          response: fetchResponse,
        });
      }
      return fetchResponse;
    } catch (error) {
      // if (process.env.NODE_ENV !== 'production') {
      //   logger.log(
      //     `Network request for ` +
      //       `'${getFriendlyURL(request.url)}' threw an error.`,
      //     error,
      //   );
      // }

      // `originalRequest` will only exist if a `fetchDidFail` callback
      // is being used (see above).
      if (originalRequest) {
        await this.runCallbacks('fetchDidFail', {
          error: error as Error,
          event,
          originalRequest: originalRequest.clone(),
          request: pluginFilteredRequest.clone(),
        });
      }
      throw error;
    }
  }

  /**
   * Calls `this.fetch()` and (in the background) runs `this.cachePut()` on
   * the response generated by `this.fetch()`.
   *
   * The call to `this.cachePut()` automatically invokes `this.waitUntil()`,
   * so you do not have to manually call `waitUntil()` on the event.
   *
   * @param {Request|string} input The request or URL to fetch and cache.
   * @return {Promise<Response>}
   */
  async fetchAndCachePut(input: RequestInfo): Promise<Response> {
    const response = await this.fetch(input);
    const responseClone = response.clone();

    void this.waitUntil(this.cachePut(input, responseClone));

    return response;
  }

  /**
   * Matches a request from the cache (and invokes any applicable plugin
   * callback methods) using the `cacheName`, `matchOptions`, and `plugins`
   * defined on the strategy object.
   *
   * The following plugin lifecycle methods are invoked when using this method:
   * - cacheKeyWillByUsed()
   * - cachedResponseWillByUsed()
   *
   * @param {Request|string} key The Request or URL to use as the cache key.
   * @return {Promise<Response|undefined>} A matching response, if found.
   */
  async cacheMatch(key: RequestInfo): Promise<Response | undefined> {
    const request: Request = toRequest(key);
    let cachedResponse: Response | undefined;
    const {cacheName, matchOptions} = this._strategy;

    const effectiveRequest = await this.getCacheKey(request, 'read');
    const multiMatchOptions = {...matchOptions, ...{cacheName}};

    cachedResponse = await caches.match(effectiveRequest, multiMatchOptions);

    // if (process.env.NODE_ENV !== 'production') {
    //   if (cachedResponse) {
    //     logger.debug(`Found a cached response in '${cacheName}'.`);
    //   } else {
    //     logger.debug(`No cached response found in '${cacheName}'.`);
    //   }
    // }

    for (const callback of this.iterateCallbacks('cachedResponseWillBeUsed')) {
      cachedResponse =
        (await callback({
          cacheName,
          matchOptions,
          cachedResponse,
          request: effectiveRequest,
          event: this.event,
        })) || undefined;
    }
    return cachedResponse;
  }

  /**
   * Puts a request/response pair in the cache (and invokes any applicable
   * plugin callback methods) using the `cacheName` and `plugins` defined on
   * the strategy object.
   *
   * The following plugin lifecycle methods are invoked when using this method:
   * - cacheKeyWillByUsed()
   * - cacheWillUpdate()
   * - cacheDidUpdate()
   *
   * @param {Request|string} key The request or URL to use as the cache key.
   * @param {Response} response The response to cache.
   * @return {Promise<boolean>} `false` if a cacheWillUpdate caused the response
   * not be cached, and `true` otherwise.
   */
  async cachePut(key: RequestInfo, response: Response): Promise<boolean> {
    switch (typeof key) {
      case 'string':
        // key = new Request(key);
        if (key.includes("extension://")) {
          return false;
        }
        break;
      case 'object':
        if (key instanceof Request) {
          // If we already have a `Request` object, we should clone it
          // so we don't mutate the original `Request` object (which could be
          // reused).
          // key = key.clone();

          if (key.url.includes("extension://")) {
            return false;
          }
        }
        break;
      default: {
        throw new Error("unsupported type")
      }
    }

    const request: Request = toRequest(key);

    // Run in the next task to avoid blocking other cache reads.
    // https://github.com/w3c/ServiceWorker/issues/1397
    await timeout(0);

    const effectiveRequest = await this.getCacheKey(request, 'write');

    if (process.env.NODE_ENV !== 'production') {
      if (effectiveRequest.method && effectiveRequest.method !== 'GET') {
        throw new Error("attempt-to-cache-non-get-req")
        // throw new WorkboxError('attempt-to-cache-non-get-request', {
        //   url: getFriendlyURL(effectiveRequest.url),
        //   method: effectiveRequest.method,
        // });
      }

      // See https://github.com/GoogleChrome/workbox/issues/2818
      // const vary = response.headers.get('Vary');
      // if (vary) {
      //   logger.debug(
      //     `The response for ${getFriendlyURL(effectiveRequest.url)} ` +
      //       `has a 'Vary: ${vary}' header. ` +
      //       `Consider setting the {ignoreVary: true} option on your strategy ` +
      //       `to ensure cache matching and deletion works as expected.`,
      //   );
      // }
    }

    if (!response) {
      // if (process.env.NODE_ENV !== 'production') {
      //   logger.error(
      //     `Cannot cache non-existent response for ` +
      //       `'${getFriendlyURL(effectiveRequest.url)}'.`,
      //   );
      // }

      throw new Error("cache-put-with-no-res")
      // throw new WorkboxError('cache-put-with-no-response', {
      //   url: getFriendlyURL(effectiveRequest.url),
      // });
    }

    const responseToCache = await this._ensureResponseSafeToCache(response);

    if (!responseToCache) {
      // if (process.env.NODE_ENV !== 'production') {
      //   logger.debug(
      //     `Response '${getFriendlyURL(effectiveRequest.url)}' ` +
      //       `will not be cached.`,
      //     responseToCache,
      //   );
      // }
      return false;
    }

    const {cacheName, matchOptions} = this._strategy;
    const cache = await self.caches.open(cacheName);

    const hasCacheUpdateCallback = this.hasCallback('cacheDidUpdate');
    const oldResponse = hasCacheUpdateCallback
      ? await cacheMatchIgnoreParams(
          // TODO(philipwalton): the `__WB_REVISION__` param is a precaching
          // feature. Consider into ways to only add this behavior if using
          // precaching.
          cache,
          effectiveRequest.clone(),
          ['__WB_REVISION__'],
          matchOptions,
        )
      : null;

    // if (process.env.NODE_ENV !== 'production') {
    //   logger.debug(
    //     `Updating the '${cacheName}' cache with a new Response ` +
    //       `for ${getFriendlyURL(effectiveRequest.url)}.`,
    //   );
    // }

    try {
      await cache.put(
        effectiveRequest,
        hasCacheUpdateCallback ? responseToCache.clone() : responseToCache,
      );
    } catch (error) {
      if (error instanceof Error) {
        // See https://developer.mozilla.org/en-US/docs/Web/API/DOMException#exception-QuotaExceededError
        if (error.name === 'QuotaExceededError') {
          // await executeQuotaErrorCallbacks();
          console.error("Quota Exceeded Error!")
        }
        throw error;
      }
    }

    for (const callback of this.iterateCallbacks('cacheDidUpdate')) {
      await callback({
        cacheName,
        oldResponse,
        newResponse: responseToCache.clone(),
        request: effectiveRequest,
        event: this.event,
      });
    }

    return true;
  }

  /**
   * Checks the list of plugins for the `cacheKeyWillBeUsed` callback, and
   * executes any of those callbacks found in sequence. The final `Request`
   * object returned by the last plugin is treated as the cache key for cache
   * reads and/or writes. If no `cacheKeyWillBeUsed` plugin callbacks have
   * been registered, the passed request is returned unmodified
   *
   * @param {Request} request
   * @param {string} mode
   * @return {Promise<Request>}
   */
  async getCacheKey(
    request: Request,
    mode: 'read' | 'write',
  ): Promise<Request> {
    const key = `${request.url} | ${mode}`;
    if (!this._cacheKeys[key]) {
      let effectiveRequest = request;

      for (const callback of this.iterateCallbacks('cacheKeyWillBeUsed')) {
        effectiveRequest = toRequest(
          await callback({
            mode,
            request: effectiveRequest,
            event: this.event,
            // params has a type any can't change right now.
            params: this.params, // eslint-disable-line
          }),
        );
      }

      this._cacheKeys[key] = effectiveRequest;
    }
    return this._cacheKeys[key];
  }

  /**
   * Returns true if the strategy has at least one plugin with the given
   * callback.
   *
   * @param {string} name The name of the callback to check for.
   * @return {boolean}
   */
  hasCallback<C extends keyof WorkboxPlugin>(name: C): boolean {
    for (const plugin of this._strategy.plugins) {
      if (name in plugin) {
        return true;
      }
    }
    return false;
  }

  /**
   * Runs all plugin callbacks matching the given name, in order, passing the
   * given param object (merged ith the current plugin state) as the only
   * argument.
   *
   * Note: since this method runs all plugins, it's not suitable for cases
   * where the return value of a callback needs to be applied prior to calling
   * the next callback. See
   * {@link workbox-strategies.StrategyHandler#iterateCallbacks}
   * below for how to handle that case.
   *
   * @param {string} name The name of the callback to run within each plugin.
   * @param {Object} param The object to pass as the first (and only) param
   *     when executing each callback. This object will be merged with the
   *     current plugin state prior to callback execution.
   */
  async runCallbacks<C extends keyof NonNullable<WorkboxPlugin>>(
    name: C,
    param: Omit<WorkboxPluginCallbackParam[C], 'state'>,
  ): Promise<void> {
    for (const callback of this.iterateCallbacks(name)) {
      // TODO(philipwalton): not sure why `any` is needed. It seems like
      // this should work with `as WorkboxPluginCallbackParam[C]`.
      await callback(param as any);
    }
  }

  /**
   * Accepts a callback and returns an iterable of matching plugin callbacks,
   * where each callback is wrapped with the current handler state (i.e. when
   * you call each callback, whatever object parameter you pass it will
   * be merged with the plugin's current state).
   *
   * @param {string} name The name fo the callback to run
   * @return {Array<Function>}
   */
  *iterateCallbacks<C extends keyof WorkboxPlugin>(
    name: C,
  ): Generator<NonNullable<WorkboxPlugin[C]>> {
    for (const plugin of this._strategy.plugins) {
      if (typeof plugin[name] === 'function') {
        const state = this._pluginStateMap.get(plugin);
        const statefulCallback = (
          param: Omit<WorkboxPluginCallbackParam[C], 'state'>,
        ) => {
          const statefulParam = {...param, state};

          // TODO(philipwalton): not sure why `any` is needed. It seems like
          // this should work with `as WorkboxPluginCallbackParam[C]`.
          return plugin[name]!(statefulParam as any);
        };
        yield statefulCallback as NonNullable<WorkboxPlugin[C]>;
      }
    }
  }

  /**
   * Adds a promise to the
   * [extend lifetime promises]{@link https://w3c.github.io/ServiceWorker/#extendableevent-extend-lifetime-promises}
   * of the event event associated with the request being handled (usually a
   * `FetchEvent`).
   *
   * Note: you can await
   * {@link workbox-strategies.StrategyHandler~doneWaiting}
   * to know when all added promises have settled.
   *
   * @param {Promise} promise A promise to add to the extend lifetime promises
   *     of the event that triggered the request.
   */
  waitUntil<T>(promise: Promise<T>): Promise<T> {
    this._extendLifetimePromises.push(promise);
    return promise;
  }

  /**
   * Returns a promise that resolves once all promises passed to
   * {@link workbox-strategies.StrategyHandler~waitUntil}
   * have settled.
   *
   * Note: any work done after `doneWaiting()` settles should be manually
   * passed to an event's `waitUntil()` method (not this handler's
   * `waitUntil()` method), otherwise the service worker thread my be killed
   * prior to your work completing.
   */
  async doneWaiting(): Promise<void> {
    let promise;
    while ((promise = this._extendLifetimePromises.shift())) {
      await promise;
    }
  }

  /**
   * Stops running the strategy and immediately resolves any pending
   * `waitUntil()` promises.
   */
  destroy(): void {
    this._handlerDeferred.resolve(null);
  }

  /**
   * This method will call cacheWillUpdate on the available plugins (or use
   * status === 200) to determine if the Response is safe and valid to cache.
   *
   * @param {Request} options.request
   * @param {Response} options.response
   * @return {Promise<Response|undefined>}
   *
   * @private
   */
  async _ensureResponseSafeToCache(
    response: Response,
  ): Promise<Response | undefined> {
    let responseToCache: Response | undefined = response;
    let pluginsUsed = false;

    for (const callback of this.iterateCallbacks('cacheWillUpdate')) {
      responseToCache =
        (await callback({
          request: this.request,
          response: responseToCache,
          event: this.event,
        })) || undefined;
      pluginsUsed = true;

      if (!responseToCache) {
        break;
      }
    }

    if (!pluginsUsed) {
      if (responseToCache && responseToCache.status !== 200) {
        responseToCache = undefined;
      }
      // if (process.env.NODE_ENV !== 'production') {
      //   if (responseToCache) {
      //     if (responseToCache.status !== 200) {
      //       if (responseToCache.status === 0) {
      //         logger.warn(
      //           `The response for '${this.request.url}' ` +
      //             `is an opaque response. The caching strategy that you're ` +
      //             `using will not cache opaque responses by default.`,
      //         );
      //       } else {
      //         logger.debug(
      //           `The response for '${this.request.url}' ` +
      //             `returned a status code of '${response.status}' and won't ` +
      //             `be cached as a result.`,
      //         );
      //       }
      //     }
      //   }
      // }
    }

    return responseToCache;
  }
}