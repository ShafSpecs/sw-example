export interface CacheQueryMatchOptions
  extends Omit<CacheQueryOptions, "cacheName" | "ignoreMethod"> {}

export interface StrategyOptions {
  cacheName: string;
  isLoader?: boolean;
  plugins?: any[]; // (ShafSpecs) todo: change this to a proper type later
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

export abstract class Strategy {
  protected cacheName: string;
  protected plugins: any[];
  protected matchOptions?: CacheQueryMatchOptions;
  protected isLoader: boolean;

  constructor({
    cacheName,
    isLoader = false,
    plugins = [],
    matchOptions,
  }: StrategyOptions) {
    this.cacheName = cacheName;
    this.plugins = plugins || [];
    this.matchOptions = matchOptions || {};
    this.isLoader = isLoader;
  }

  protected abstract _handle(request: Request): Promise<Response>;

  async handle(request: Request): Promise<Response> {
    if (!isHttpRequest(request)) {
      // (ShafSpecs) todo: Handle this better. Can't be throwing errors
      // all over the user app if the SW intercepts an extension request
      throw new Error("The request is not an HTTP request");
    }

    return this._handle(request);
  }
}

export class CacheFirst extends Strategy {
  async _handle(request: Request) {
    try {
      const cache = await caches.open(this.cacheName);

      const cachedResponse = await cache.match(request, {
        ignoreVary: this.matchOptions?.ignoreVary || false,
        ignoreSearch: this.matchOptions?.ignoreSearch || false,
      });
      if (cachedResponse) {
        return cachedResponse;
      }

      const response = await fetch(request.clone());
      await cache.put(request, response.clone());

      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request, {
        ignoreVary: this.matchOptions?.ignoreVary || false,
        ignoreSearch: this.matchOptions?.ignoreSearch || false,
      });

      if (cachedResponse) {
        this.isLoader && cachedResponse.headers.set("X-Remix-Worker", "yes");
        return cachedResponse;
      }

      const headers = { "X-Remix-Catch": "yes", "X-Remix-Worker": "yes" };

      return new Response(JSON.stringify({ message: "Network Error" }), {
        status: 500,
        ...(this.isLoader ? { headers } : {}),
      });
    }
  }
}

export interface NetworkFirstOptions extends StrategyOptions {
  networkTimeoutSeconds?: number;
}

export class NetworkFirst extends Strategy {
  private readonly _networkTimeoutSeconds: number;

  constructor(options: NetworkFirstOptions) {
    super(options);

    // (ShafSpecs) todo: give _networkTimeoutSeconds an implementation later
    this._networkTimeoutSeconds = options.networkTimeoutSeconds || 30;
  }

  async _handle(request: Request) {
    try {
      const cache = await caches.open(this.cacheName);

      const response = await fetch(request.clone());
      await cache.put(request, response.clone());

      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request, {
        ignoreVary: this.matchOptions?.ignoreVary || false,
        ignoreSearch: this.matchOptions?.ignoreSearch || false,
      });

      if (cachedResponse) {
        this.isLoader && cachedResponse.headers.set("X-Remix-Worker", "yes");
        return cachedResponse;
      }

      const headers = { "X-Remix-Catch": "yes", "X-Remix-Worker": "yes" };

      return new Response(JSON.stringify({ message: "Network Error" }), {
        status: 500,
        ...(this.isLoader ? { headers } : {}),
      });
    }
  }
}

export interface NetworkOnlyOptions
  extends Omit<StrategyOptions, "cacheName" | "matchOptions"> {
  // (ShafSpecs) todo: give _networkTimeoutSeconds an implementation later
  networkTimeoutSeconds?: number;
}

export class NetworkOnly extends Strategy {
  private readonly _networkTimeoutSeconds: number;

  constructor(options: NetworkOnlyOptions = {}) {
    super({ cacheName: "", ...options });

    // (ShafSpecs) todo: give _networkTimeoutSeconds an implementation later
    this._networkTimeoutSeconds = options.networkTimeoutSeconds || 30;
  }

  async _handle(request: Request) {
    try {
      const response = fetch(request.clone());
      return response;
    } catch (error) {
      const headers = { "X-Remix-Catch": "yes", "X-Remix-Worker": "yes" };

      return new Response(JSON.stringify({ message: "Network Error" }), {
        status: 500,
        ...(this.isLoader ? { headers } : {}),
      });
    }
  }
}

export class CacheOnly extends Strategy {
  async _handle(request: Request) {
    const cache = await caches.open(this.cacheName);

    const cachedResponse = await cache.match(request, {
      ignoreVary: this.matchOptions?.ignoreVary || false,
      ignoreSearch: this.matchOptions?.ignoreSearch || false,
    });
    if (cachedResponse) {
      this.isLoader && cachedResponse.headers.set("X-Remix-Worker", "yes");
      return cachedResponse;
    }

    const headers = { "X-Remix-Catch": "yes", "X-Remix-Worker": "yes" };

    return new Response(JSON.stringify({ message: "Not Found" }), {
      status: 404,
      ...(this.isLoader ? { headers } : {}),
    });
  }
}
