//////////////////////////////////////////
//# Global typings for the `sw` module #//
//////////////////////////////////////////

//////// CORE ////////

/**
 * `core.ts` typings
 */

//////// LOADER ////////

/**
 * `loader.ts` typings
 */

export type LoadServiceWorkerOptions = {
  scope?: string;
  serviceWorkerUrl?: string;
  skipWaiting?: boolean;
};

//////// ROUTING ////////

/**
 * `routing.ts` typings
 */

export interface MatchRequestProps {
  url: URL;
  request: Request;
  event: Event;
}

export interface MatchAssetRequestProps extends MatchRequestProps {
  paths?: string[];
}

export interface RouteMatchCallback {
  (options: RouteMatchCallbackOptions): any;
}

export interface RouteMatchCallbackOptions {
  request: Request;
  url: URL;
  event: ExtendableEvent;
  sameOrigin: boolean;
}

export interface RouteHandlerCallback {
  (options: {
    request: Request;
    url: URL;
    event: ExtendableEvent;
    params?: any;
  }): Promise<Response>;
}

export interface RouteHandlerCallbackObject {
  handle: RouteHandlerCallback;
}

export interface CustomMapObject {
  [key: string]: any;
}

export declare interface RouteHandlerCallbackOptions {
  event: ExtendableEvent;
  request: Request;
  url: URL;
  params?: string[] | CustomMapObject;
}

export type RouteHandler_ = RouteHandlerCallbackObject | RouteHandlerCallback;

export type HTTPMethod = "DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT";

export type RequestArgs = string | [string, RequestInit?];

export interface CacheURLsMessageData {
  type: string;
  payload: {
    urlsToCache: RequestArgs[];
  };
}

//////// STRATEGY ////////

/**
 * `strategy.ts` typings
 */

export interface StrategyOptions {
  cacheName?: string;
  plugins?: Plugin[];
  fetchOptions?: RequestInit;
  matchOptions?: CacheQueryOptions;
}

export interface ManualHandlerCallbackOptions {
  event: ExtendableEvent;
  request: Request | string;
}

export type HandlerCallbackOptions =
  | RouteHandlerCallbackOptions
  | ManualHandlerCallbackOptions;

//////// TYPES ////////

/**
 * weird typings used all over the place (I'm too tired to classify them)
 * These are the types that are commonly used in the `sw` module.
 */

export type PluginState = CustomMapObject;

export interface HandlerWillStartCallbackParam {
  request: Request;
  event: ExtendableEvent;
  state?: PluginState;
}

export interface HandlerWillStartCallback {
  (param: HandlerWillStartCallbackParam): Promise<void | null | undefined>;
}

export interface CacheDidUpdateCallbackParam {
  cacheName: string;
  newResponse: Response;
  request: Request;
  event: ExtendableEvent;
  oldResponse?: Response | null;
  state?: PluginState;
}

export interface CacheDidUpdateCallback {
  (param: CacheDidUpdateCallbackParam): Promise<void | null | undefined>;
}

export interface CacheKeyWillBeUsedCallbackParam {
  mode: string;
  request: Request;
  event: ExtendableEvent;
  params?: any;
  state?: PluginState;
}

export interface CacheKeyWillBeUsedCallback {
  (param: CacheKeyWillBeUsedCallbackParam): Promise<Request | string>;
}

export interface CacheWillUpdateCallbackParam {
  request: Request;
  response: Response;
  event: ExtendableEvent;
  state?: PluginState;
}

export interface CacheWillUpdateCallback {
  (param: CacheWillUpdateCallbackParam): Promise<
    Response | void | null | undefined
  >;
}

export interface CachedResponseWillBeUsedCallbackParam {
  cacheName: string;
  request: Request;
  cachedResponse?: Response;
  event: ExtendableEvent;
  matchOptions?: CacheQueryOptions;
  state?: PluginState;
}

export interface CachedResponseWillBeUsedCallback {
  (param: CachedResponseWillBeUsedCallbackParam): Promise<
    Response | void | null | undefined
  >;
}

export interface FetchDidFailCallbackParam {
  error: Error;
  originalRequest: Request;
  request: Request;
  event: ExtendableEvent;
  state?: PluginState;
}

export interface FetchDidFailCallback {
  (param: FetchDidFailCallbackParam): Promise<void | null | undefined>;
}

export interface FetchDidSucceedCallbackParam {
  request: Request;
  response: Response;
  event: ExtendableEvent;
  state?: PluginState;
}

export interface FetchDidSucceedCallback {
  (param: FetchDidSucceedCallbackParam): Promise<Response>;
}

export interface RequestWillFetchCallbackParam {
  request: Request;
  event: ExtendableEvent;
  state?: PluginState;
}

export interface RequestWillFetchCallback {
  (param: RequestWillFetchCallbackParam): Promise<Request>;
}

export interface HandlerWillRespondCallbackParam {
  request: Request;
  response: Response;
  event: ExtendableEvent;
  state?: PluginState;
}

export interface HandlerWillRespondCallback {
  (param: HandlerWillRespondCallbackParam): Promise<Response>;
}

export interface HandlerDidErrorCallbackParam {
  request: Request;
  event: ExtendableEvent;
  error: Error;
  state?: PluginState;
}

export interface HandlerDidErrorCallback {
  (param: HandlerDidErrorCallbackParam): Promise<Response | undefined>;
}

export interface HandlerDidRespondCallbackParam {
  request: Request;
  event: ExtendableEvent;
  response?: Response;
  state?: PluginState;
}

export interface HandlerDidRespondCallback {
  (param: HandlerDidRespondCallbackParam): Promise<void | null | undefined>;
}

export interface HandlerDidCompleteCallbackParam {
  request: Request;
  error?: Error;
  event: ExtendableEvent;
  response?: Response;
  state?: PluginState;
}

export interface HandlerDidCompleteCallback {
  (param: HandlerDidCompleteCallbackParam): Promise<void | null | undefined>;
}

/**
 * An object with optional lifecycle callback properties for the fetch and
 * cache operations.
 */
export declare interface Plugin {
  cacheDidUpdate?: CacheDidUpdateCallback;
  cachedResponseWillBeUsed?: CachedResponseWillBeUsedCallback;
  cacheKeyWillBeUsed?: CacheKeyWillBeUsedCallback;
  cacheWillUpdate?: CacheWillUpdateCallback;
  fetchDidFail?: FetchDidFailCallback;
  fetchDidSucceed?: FetchDidSucceedCallback;
  handlerDidComplete?: HandlerDidCompleteCallback;
  handlerDidError?: HandlerDidErrorCallback;
  handlerDidRespond?: HandlerDidRespondCallback;
  handlerWillRespond?: HandlerWillRespondCallback;
  handlerWillStart?: HandlerWillStartCallback;
  requestWillFetch?: RequestWillFetchCallback;
}

export interface PluginCallbackParam {
  cacheDidUpdate: CacheDidUpdateCallbackParam;
  cachedResponseWillBeUsed: CachedResponseWillBeUsedCallbackParam;
  cacheKeyWillBeUsed: CacheKeyWillBeUsedCallbackParam;
  cacheWillUpdate: CacheWillUpdateCallbackParam;
  fetchDidFail: FetchDidFailCallbackParam;
  fetchDidSucceed: FetchDidSucceedCallbackParam;
  handlerDidComplete: HandlerDidCompleteCallbackParam;
  handlerDidError: HandlerDidErrorCallbackParam;
  handlerDidRespond: HandlerDidRespondCallbackParam;
  handlerWillRespond: HandlerWillRespondCallbackParam;
  handlerWillStart: HandlerWillStartCallbackParam;
  requestWillFetch: RequestWillFetchCallbackParam;
}
