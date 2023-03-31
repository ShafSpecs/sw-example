/// <reference lib="WebWorker" />

import type { MatchAssetRequestProps, MatchRequestProps } from "./sw2";

export type {};

interface RouteMatchCallback {
  (options: RouteMatchCallbackOptions): any;
}

interface RouteMatchCallbackOptions {
  request: Request;
  url: URL;
  event: ExtendableEvent;
  sameOrigin: boolean;
}

/**
 * `RouteHandler` interface
 */
export interface HandlerCBCallback {
  (options: {
    request: Request;
    url: URL;
    event: ExtendableEvent;
    params?: any;
  }): Promise<Response>;
}

export interface MapLikeObject {
  [key: string]: any;
}

export declare interface RouteHandlerCallbackOptions {
  event: ExtendableEvent;
  request: Request;
  url: URL;
  params?: string[] | MapLikeObject;
}

type RouteHandler_ =
  | {
      handle: HandlerCBCallback;
    }
  | HandlerCBCallback;

export type HTTPMethod = "DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT";

export const defaultMethod: HTTPMethod = "GET";

export const validMethods: HTTPMethod[] = [
  "DELETE",
  "GET",
  "HEAD",
  "PATCH",
  "POST",
  "PUT",
];

export const normalizeHandler = (
  handler: RouteHandler_
): { handle: HandlerCBCallback } => {
  if (handler && typeof handler === "object") {
    return handler;
  } else {
    return { handle: handler };
  }
};

export class Route {
  handler: { handle: HandlerCBCallback }; // `RouteHandlerObject`
  match: RouteMatchCallback;
  method: HTTPMethod;
  catchHandler?: { handle: HandlerCBCallback }; // `RouteHandlerObject`

  constructor(
    match: RouteMatchCallback,
    handler: RouteHandler_,
    method: HTTPMethod = defaultMethod
  ) {
    this.handler = normalizeHandler(handler);
    this.match = match;
    this.method = method;
  }

  setCatchHandler(handler: RouteHandler_) {
    this.catchHandler = normalizeHandler(handler);
  }
}

type RequestArgs = string | [string, RequestInit?];

interface CacheURLsMessageData {
  type: string;
  payload: {
    urlsToCache: RequestArgs[];
  };
}

export class Router {
  private readonly _routes: Map<HTTPMethod, Route[]>;
  private readonly _defaultHandlerMap: Map<
    HTTPMethod,
    { handle: HandlerCBCallback }
  >;
  private _catchHandler?: { handle: HandlerCBCallback };

  /**
   * Initializes a new Router.
   */
  constructor() {
    this._routes = new Map();
    this._defaultHandlerMap = new Map();
  }

  /**
   * @return {Map<string, Array<workbox-routing.Route>>} routes A `Map` of HTTP
   * method name ('GET', etc.) to an array of all the corresponding `Route`
   * instances that are registered.
   */
  get routes(): Map<HTTPMethod, Route[]> {
    return this._routes;
  }

  /**
   * Adds a fetch event listener to respond to events when a route matches
   * the event's request.
   */
  addFetchListener(): void {
    // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
    self.addEventListener("fetch", ((event: FetchEvent) => {
      const { request } = event;
      const responsePromise = this.handleRequest({ request, event });
      if (responsePromise) {
        event.respondWith(responsePromise);
      }
    }) as EventListener);
  }

  /**
   * Adds a message event listener for URLs to cache from the window.
   * This is useful to cache resources loaded on the page prior to when the
   * service worker started controlling it.
   *
   * The format of the message data sent from the window should be as follows.
   * Where the `urlsToCache` array may consist of URL strings or an array of
   * URL string + `requestInit` object (the same as you'd pass to `fetch()`).
   *
   * ```
   * {
   *   type: 'CACHE_URLS',
   *   payload: {
   *     urlsToCache: [
   *       './script1.js',
   *       './script2.js',
   *       ['./script3.js', {mode: 'no-cors'}],
   *     ],
   *   },
   * }
   * ```
   */
  addCacheListener(): void {
    // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
    self.addEventListener("message", ((event: ExtendableMessageEvent) => {
      // event.data is type 'any'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (event.data && event.data.type === "CACHE_URLS") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { payload }: CacheURLsMessageData = event.data;

        // if (process.env.NODE_ENV !== 'production') {
        //   logger.debug(`Caching URLs from the window`, payload.urlsToCache);
        // }

        const requestPromises = Promise.all(
          payload.urlsToCache.map((entry: string | [string, RequestInit?]) => {
            if (typeof entry === "string") {
              entry = [entry];
            }

            const request = new Request(...entry);
            return this.handleRequest({ request, event });

            // TODO(philipwalton): TypeScript errors without this typecast for
            // some reason (probably a bug). The real type here should work but
            // doesn't: `Array<Promise<Response> | undefined>`.
          }) as any[]
        ); // TypeScript

        event.waitUntil(requestPromises);

        // If a MessageChannel was used, reply to the message on success.
        if (event.ports && event.ports[0]) {
          void requestPromises.then(() => event.ports[0].postMessage(true));
        }
      }
    }) as EventListener);
  }

  /**
   * Apply the routing rules to a FetchEvent object to get a Response from an
   * appropriate Route's handler.
   *
   * @param {Object} options
   * @param {Request} options.request The request to handle.
   * @param {ExtendableEvent} options.event The event that triggered the
   *     request.
   * @return {Promise<Response>|undefined} A promise is returned if a
   *     registered route can handle the request. If there is no matching
   *     route and there's no `defaultHandler`, `undefined` is returned.
   */
  handleRequest({
    request,
    event,
  }: {
    request: Request;
    event: ExtendableEvent;
  }): Promise<Response> | undefined {
    // if (process.env.NODE_ENV !== 'production') {
    //   assert!.isInstance(request, Request, {
    //     moduleName: 'workbox-routing',
    //     className: 'Router',
    //     funcName: 'handleRequest',
    //     paramName: 'options.request',
    //   });
    // }

    const url = new URL(request.url, location.href);
    // if (!url.protocol.startsWith('http')) {
    //   if (process.env.NODE_ENV !== 'production') {
    //     logger.debug(
    //       `Workbox Router only supports URLs that start with 'http'.`,
    //     );
    //   }
    //   return;
    // }

    const sameOrigin = url.origin === location.origin;
    const { params, route } = this.findMatchingRoute({
      event,
      request,
      sameOrigin,
      url,
    });
    let handler = route && route.handler;

    const debugMessages = [];
    if (process.env.NODE_ENV !== "production") {
      if (handler) {
        debugMessages.push([`Found a route to handle this request:`, route]);

        if (params) {
          debugMessages.push([
            `Passing the following params to the route's handler:`,
            params,
          ]);
        }
      }
    }

    // If we don't have a handler because there was no matching route, then
    // fall back to defaultHandler if that's defined.
    const method = request.method as HTTPMethod;
    if (!handler && this._defaultHandlerMap.has(method)) {
      if (process.env.NODE_ENV !== "production") {
        debugMessages.push(
          `Failed to find a matching route. Falling ` +
            `back to the default handler for ${method}.`
        );
      }
      handler = this._defaultHandlerMap.get(method);
    }

    // if (!handler) {
    //   if (process.env.NODE_ENV !== 'production') {
    //     // No handler so Workbox will do nothing. If logs is set of debug
    //     // i.e. verbose, we should print out this information.
    //     logger.debug(`No route found for: ${getFriendlyURL(url)}`);
    //   }
    //   return;
    // }

    // if (process.env.NODE_ENV !== 'production') {
    //   // We have a handler, meaning Workbox is going to handle the route.
    //   // print the routing details to the console.
    //   logger.groupCollapsed(`Router is responding to: ${getFriendlyURL(url)}`);

    //   debugMessages.forEach((msg) => {
    //     if (Array.isArray(msg)) {
    //       logger.log(...msg);
    //     } else {
    //       logger.log(msg);
    //     }
    //   });

    //   logger.groupEnd();
    // }

    // Wrap in try and catch in case the handle method throws a synchronous
    // error. It should still callback to the catch handler.
    let responsePromise;
    try {
      responsePromise = handler?.handle({ url, request, event, params });
    } catch (err) {
      responsePromise = Promise.reject(err);
    }

    // Get route's catch handler, if it exists
    const catchHandler = route && route.catchHandler;

    if (
      responsePromise instanceof Promise &&
      (this._catchHandler || catchHandler)
    ) {
      responsePromise = responsePromise.catch(async (err) => {
        // If there's a route catch handler, process that first
        if (catchHandler) {
          // if (process.env.NODE_ENV !== 'production') {
          //   // Still include URL here as it will be async from the console group
          //   // and may not make sense without the URL
          //   logger.groupCollapsed(
          //     `Error thrown when responding to: ` +
          //       ` ${getFriendlyURL(
          //         url,
          //       )}. Falling back to route's Catch Handler.`,
          //   );
          //   logger.error(`Error thrown by:`, route);
          //   logger.error(err);
          //   logger.groupEnd();
          // }

          try {
            return await catchHandler.handle({ url, request, event, params });
          } catch (catchErr) {
            if (catchErr instanceof Error) {
              err = catchErr;
            }
          }
        }

        if (this._catchHandler) {
          // if (process.env.NODE_ENV !== 'production') {
          //   // Still include URL here as it will be async from the console group
          //   // and may not make sense without the URL
          //   logger.groupCollapsed(
          //     `Error thrown when responding to: ` +
          //       ` ${getFriendlyURL(
          //         url,
          //       )}. Falling back to global Catch Handler.`,
          //   );
          //   logger.error(`Error thrown by:`, route);
          //   logger.error(err);
          //   logger.groupEnd();
          // }
          return this._catchHandler.handle({ url, request, event });
        }

        throw err;
      });
    }

    return responsePromise;
  }

  /**
   * Checks a request and URL (and optionally an event) against the list of
   * registered routes, and if there's a match, returns the corresponding
   * route along with any params generated by the match.
   *
   * @param {Object} options
   * @param {URL} options.url
   * @param {boolean} options.sameOrigin The result of comparing `url.origin`
   *     against the current origin.
   * @param {Request} options.request The request to match.
   * @param {Event} options.event The corresponding event.
   * @return {Object} An object with `route` and `params` properties.
   *     They are populated if a matching route was found or `undefined`
   *     otherwise.
   */
  findMatchingRoute({
    url,
    sameOrigin,
    request,
    event,
  }: RouteMatchCallbackOptions): {
    route?: Route;
    params?: RouteHandlerCallbackOptions["params"];
  } {
    const routes = this._routes.get(request.method as HTTPMethod) || [];
    for (const route of routes) {
      let params: Promise<any> | undefined;
      // route.match returns type any, not possible to change right now.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const matchResult = route.match({ url, sameOrigin, request, event });
      if (matchResult) {
        // if (process.env.NODE_ENV !== 'production') {
        //   // Warn developers that using an async matchCallback is almost always
        //   // not the right thing to do.
        //   if (matchResult instanceof Promise) {
        //     logger.warn(
        //       `While routing ${getFriendlyURL(url)}, an async ` +
        //         `matchCallback function was used. Please convert the ` +
        //         `following route to use a synchronous matchCallback function:`,
        //       route,
        //     );
        //   }
        // }

        // See https://github.com/GoogleChrome/workbox/issues/2079
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        params = matchResult;
        if (Array.isArray(params) && params.length === 0) {
          // Instead of passing an empty array in as params, use undefined.
          params = undefined;
        } else if (
          matchResult.constructor === Object && // eslint-disable-line
          Object.keys(matchResult).length === 0
        ) {
          // Instead of passing an empty object in as params, use undefined.
          params = undefined;
        } else if (typeof matchResult === "boolean") {
          // For the boolean value true (rather than just something truth-y),
          // don't set params.
          // See https://github.com/GoogleChrome/workbox/pull/2134#issuecomment-513924353
          params = undefined;
        }

        // Return early if have a match.
        return { route, params };
      }
    }
    // If no match was found above, return and empty object.
    return {};
  }

  /**
   * Define a default `handler` that's called when no routes explicitly
   * match the incoming request.
   *
   * Each HTTP method ('GET', 'POST', etc.) gets its own default handler.
   *
   * Without a default handler, unmatched requests will go against the
   * network as if there were no service worker present.
   *
   * @param {workbox-routing~handlerCallback} handler A callback
   * function that returns a Promise resulting in a Response.
   * @param {string} [method='GET'] The HTTP method to associate with this
   * default handler. Each method has its own default.
   */
  setDefaultHandler(
    handler: RouteHandler_,
    method: HTTPMethod = defaultMethod
  ): void {
    this._defaultHandlerMap.set(method, normalizeHandler(handler));
  }

  /**
   * If a Route throws an error while handling a request, this `handler`
   * will be called and given a chance to provide a response.
   *
   * @param {workbox-routing~handlerCallback} handler A callback
   * function that returns a Promise resulting in a Response.
   */
  setCatchHandler(handler: RouteHandler_): void {
    this._catchHandler = normalizeHandler(handler);
  }

  /**
   * Registers a route with the router.
   *
   * @param {workbox-routing.Route} route The route to register.
   */
  registerRoute(route: Route): void {
    if (!this._routes.has(route.method)) {
      this._routes.set(route.method, []);
    }

    // Give precedence to all of the earlier routes by adding this additional
    // route to the end of the array.
    this._routes.get(route.method)!.push(route);
  }

  /**
   * Unregisters a route with the router.
   *
   * @param {workbox-routing.Route} route The route to unregister.
   */
  unregisterRoute(route: Route): void {
    if (!this._routes.has(route.method)) {
      throw new Error("unregister-route-but-not-found-with-method");
      // throw new WorkboxError('unregister-route-but-not-found-with-method', {
      // method: route.method,
      // });
    }

    const routeIndex = this._routes.get(route.method)!.indexOf(route);
    if (routeIndex > -1) {
      this._routes.get(route.method)!.splice(routeIndex, 1);
    } else {
      throw new Error("unregister-route-route-not-registered");
    }
  }
}

/**
 * Easily register a RegExp, string, or function with a caching
 * strategy to a singleton Router instance.
 *
 * This method will generate a Route for you if needed and
 * call {@link workbox-routing.Router#registerRoute}.
 *
 * @param {RegExp|string|workbox-routing.Route~matchCallback|workbox-routing.Route} capture
 * If the capture param is a `Route`, all other arguments will be ignored.
 * @param {workbox-routing~handlerCallback} [handler] A callback
 * function that returns a Promise resulting in a Response. This parameter
 * is required if `capture` is not a `Route` object.
 * @param {string} [method='GET'] The HTTP method to match the Route
 * against.
 * @return {workbox-routing.Route} The generated `Route`.
 *
 * @memberof workbox-routing
 */
export function registerRoute(
  capture: RegExp | string | RouteMatchCallback | Route,
  handler?: RouteHandler_,
  method?: HTTPMethod
): Route {
  let route: Route | undefined;

  // console.log(typeof capture, handler);

  if (typeof capture === "string") {
    const captureUrl = new URL(capture, location.href);

    if (process.env.NODE_ENV !== "production") {
      if (!(capture.startsWith('/') || capture.startsWith('http'))) {
        throw new Error("invalid-string")
        // throw new WorkboxError('invalid-string', {
        //   moduleName: 'workbox-routing',
        //   funcName: 'registerRoute',
        //   paramName: 'capture',
        // });
      }

      // We want to check if Express-style wildcards are in the pathname only.
      // TODO: Remove this log message in v4.
      const valueToCheck = capture.startsWith("http")
        ? captureUrl.pathname
        : capture;

      // See https://github.com/pillarjs/path-to-regexp#parameters
      const wildcards = "[*:?+]";
      // if (new RegExp(`${wildcards}`).exec(valueToCheck)) {
      //   logger.debug(
      //     `The '$capture' parameter contains an Express-style wildcard ` +
      //       `character (${wildcards}). Strings are now always interpreted as ` +
      //       `exact matches; use a RegExp for partial or wildcard matches.`,
      //   );
      // }
    }

    const matchCallback: RouteMatchCallback = ({ url }) => {
      // if (process.env.NODE_ENV !== 'production') {
      //   if (
      //     url.pathname === captureUrl.pathname &&
      //     url.origin !== captureUrl.origin
      //   ) {
      //     logger.debug(
      //       `${capture} only partially matches the cross-origin URL ` +
      //         `${url.toString()}. This route will only handle cross-origin requests ` +
      //         `if they match the entire URL.`,
      //     );
      //   }
      // }

      return url.href === captureUrl.href;
    };

    // If `capture` is a string then `handler` and `method` must be present.
    route = new Route(matchCallback, handler!, method);
  } else if (capture instanceof RegExp) {
    // If `capture` is a `RegExp` then `handler` and `method` must be present.
    // route = new RegExpRoute(capture, handler!, method);
  } else if (typeof capture === "function") {
    // If `capture` is a function then `handler` and `method` must be present.
    console.log("In the conditional!");
    route = new Route(capture, handler!, method ? method : defaultMethod);
  } else if (capture instanceof Route) {
    route = capture;
  } else {
    // throw new WorkboxError('unsupported-route-type', {
    //   moduleName: 'workbox-routing',
    //   funcName: 'registerRoute',
    //   paramName: 'capture',
    // });
  }

  const defaultRouter = getOrCreateDefaultRouter();
  defaultRouter.registerRoute(route!);

  return route!;
}

export function setDefaultHandler(handler: RouteHandler_): void {
  const defaultRouter = getOrCreateDefaultRouter();
  defaultRouter.setDefaultHandler(handler);
}

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

export function setCatchHandler(handler: RouteHandler_): void {
  const defaultRouter = getOrCreateDefaultRouter();
  defaultRouter.setCatchHandler(handler);
}