// todo: (ShafSpecs) Standardize the custom headers for `remix-pwa`
// `X-Remix-Worker`, etc.

import { toError } from "../core/common";
import type { StrategyPlugin } from "../plugins/cache/plugin";

export interface CacheQueryMatchOptions
  extends Omit<CacheQueryOptions, "cacheName" | "ignoreMethod"> {}

export interface CacheStrategyOptions {
  cacheName?: string;
  plugins?: StrategyPlugin[];
  matchOptions?: CacheQueryMatchOptions;
}

export type StrategyHandlerParams = {
  request: Request;
  options?: CacheQueryMatchOptions;
};

// Helper function
const isHttpRequest = (request: Request): boolean => {
  return request.url.startsWith("http");
};

export abstract class CacheStrategy {
  protected cacheName: string;
  protected plugins: StrategyPlugin[];
  protected matchOptions?: CacheQueryMatchOptions;

  // todo: (ShafSpecs) Fix this!
  constructor({
    cacheName = `cache-${Math.random() * 10_000}`,
    plugins = [],
    matchOptions = {},
  }: CacheStrategyOptions) {
    this.cacheName = cacheName;
    this.plugins = plugins || [];
    this.matchOptions = matchOptions || {};
  }

  protected abstract _handle(request: Request): Promise<Response>;

  // Can you return null or a custom, handled error???
  async handle(request: Request): Promise<Response> {
    if (!isHttpRequest(request)) {
      // (ShafSpecs) todo: Handle this better. Can't be throwing errors
      // all over the user app if the SW intercepts an extension request
      throw new Error("The request is not an HTTP request");
    }

    return this._handle(request);
  }
}

export class CacheFirst extends CacheStrategy {
  async _handle(request: Request) {
    let response = await this.getFromCache(request);

    if (!response) {
      response = await this.getFromNetwork(request);

      if (response) {
        await this.updateCache(request, response.clone());
      }
    }

    return response || new Response("Not found", { status: 404 });
  }

  private async getFromCache(request: Request): Promise<Response | null> {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request, {
      ignoreVary: this.matchOptions?.ignoreVary || false,
      ignoreSearch: this.matchOptions?.ignoreSearch || false,
    });

    if (cachedResponse) {
      return cachedResponse;
    }

    return null;
  }

  private async getFromNetwork(request: Request): Promise<Response | null> {
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        return response;
      }
    } catch (error) {
      if (error instanceof Error) {
        // logger.error("Error while fetching", request.url, ":", error);
        this.handleFetchError(request, error);
      } else {
        // logger.error("Error while fetching", request.url, ":", error);
        const err = error as Error;
        this.handleFetchError(request, err);
      }
    }
    return null;
  }

  private async updateCache(
    request: Request,
    response: Response
  ): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const oldResponse = await cache.match(request);
    await cache.put(request, response.clone());
    await this.removeExpiredEntries(cache);
    this.notifyCacheUpdated(request, response, oldResponse);
  }

  private async handleFetchError(
    request: Request,
    error: Error
  ): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.fetchDidFail) {
        await plugin.fetchDidFail({ request, error });
      }
    }
  }

  private async removeExpiredEntries(cache: Cache): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.cacheWillExpire) {
        await plugin.cacheWillExpire({ cache });
      }
    }
  }

  private async notifyCacheUpdated(
    request: Request,
    response: Response,
    oldResponse: Response | undefined
  ): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.cacheDidUpdate)
        await plugin.cacheDidUpdate({
          request,
          oldResponse: oldResponse,
          newResponse: response,
          cacheName: this.cacheName,
        });
    }
  }
}

export interface FetchListenerEnvState extends Record<string, any> {
  fetcher?: typeof fetch;
}

export interface FetchListenerEnv {
  event?: FetchEvent;
  state?: FetchListenerEnvState;
}

export interface NetworkFirstOptions extends CacheStrategyOptions {
  networkTimeoutSeconds?: number;
}

export class NetworkFirst extends CacheStrategy {
  private fetchListenerEnv: FetchListenerEnv;
  private readonly _networkTimeoutSeconds: number;

  constructor(options: NetworkFirstOptions, env: FetchListenerEnv = {}) {
    super(options);

    this.fetchListenerEnv = env;
    // Default timeout of 10 seconds
    this._networkTimeoutSeconds = options.networkTimeoutSeconds || 10;
  }

  async _handle(request: Request) {
    const cache = await caches.open(this.cacheName);

    try {
      const response = await this.fetchAndCache(request);

      for (const plugin of this.plugins) {
        if (plugin.fetchDidSucceed)
          await plugin.fetchDidSucceed({ request, response });
      }

      return response;
    } catch (error) {
      // Cast error an `Error` type
      let err = toError(error);

      for (const plugin of this.plugins) {
        if (plugin.fetchDidFail)
          await plugin.fetchDidFail({ request, error: err });
      }

      const cachedResponse = await cache.match(request, this.matchOptions);

      if (cachedResponse) {
        cachedResponse.headers.set("X-Remix-Worker", "yes");
        return cachedResponse;
      }

      // throw error;
      return new Response(JSON.stringify({ message: "Network Error" }), {
        status: 500,
        headers: { "X-Remix-Catch": "yes", "X-Remix-Worker": "yes" },
      });
    }
  }

  private async fetchAndCache(request: Request): Promise<Response> {
    const cache = await caches.open(this.cacheName);

    const timeoutPromise = this._networkTimeoutSeconds
      ? new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Network timed out after ${this._networkTimeoutSeconds} seconds`
              )
            );
          }, this._networkTimeoutSeconds * 1000);
        })
      : null;

    const fetcher = this.fetchListenerEnv.state?.fetcher || fetch;

    const fetchPromise = fetcher(request);

    const response = timeoutPromise
      ? await Promise.race([fetchPromise, timeoutPromise])
      : await fetchPromise;

    await cache.put(request, response.clone());

    return response;
  }
}

export interface NetworkOnlyOptions
  extends Omit<CacheStrategyOptions, "cacheName" | "matchOptions"> {
  // (ShafSpecs) todo: give _networkTimeoutSeconds an implementation later
  networkTimeoutSeconds?: number;
}

export class NetworkOnly extends CacheStrategy {
  private fetchListenerEnv: FetchListenerEnv;
  private readonly _networkTimeoutSeconds: number;

  constructor(options: NetworkOnlyOptions = {}, env?: FetchListenerEnv) {
    super(options);

    this.fetchListenerEnv = env || {};
    this._networkTimeoutSeconds = options.networkTimeoutSeconds || 10;
  }

  async _handle(request: Request) {
    if (request.method !== "GET") {
      return fetch(request);
    }

    // `fetcher` is a custom fetch function that can de defined prior or just regular fetch 
    const fetcher = this.fetchListenerEnv.state!.fetcher || fetch;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Network request timed out after ${
              this._networkTimeoutSeconds * 1000
            } seconds`
          )
        );
      }, this._networkTimeoutSeconds * 1000);
    });

    try {
      const fetchPromise: Response = await fetcher(request);

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (response) {
        for (const plugin of this.plugins) {
          if (plugin.fetchDidSucceed) {
            await plugin.fetchDidSucceed({
              request,
              response,
            });
          }
        }

        return response;
      } else {
        for (const plugin of this.plugins) {
          if (plugin.fetchDidFail) {
            await plugin.fetchDidFail({
              request,
              error: new Error("Network request failed"),
            });
          }
        }

        // Re-throw error to be caught by catch block
        throw new Error("Network request failed");
      }
    } catch (error) {
      for (const plugin of this.plugins) {
        if (plugin.fetchDidFail) {
          await plugin.fetchDidFail({
            request,
            error: new Error("Network request failed"),
          });
        }
      }

      throw error;
    }
  }
}

export class CacheOnly extends CacheStrategy {
  async _handle(request: Request) {
    const cache = await caches.open(this.cacheName);

    let response = await cache.match(request);

    if (!response) {
      throw new Error(`Unable to find response in cache.`);
    }

    for (const plugin of this.plugins) {
      if (plugin.cacheWillExpire) {
        await plugin.cacheWillExpire({ cache });
      }
    }

    return response;
  }
}
