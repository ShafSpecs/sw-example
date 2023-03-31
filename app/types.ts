export interface MapLikeObject {
  [key: string]: any;
}

export type PluginState = MapLikeObject;

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
export declare interface WorkboxPlugin {
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

export interface WorkboxPluginCallbackParam {
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