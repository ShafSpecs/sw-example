export interface CacheQueryMatchOptions extends Omit<CacheQueryOptions, "cacheName" | "ignoreMethod"> {}

export interface StrategyOptions {
  cacheName?: string;
  plugins?: any[];
  matchOptions?: CacheQueryMatchOptions;
};

export abstract class Strategy {
  protected cacheName: string;
  protected plugins: any[];
  protected matchOptions?: CacheQueryOptions

  constructor({
    cacheName = `cache-${Math.random() * 10_000}`,
    plugins = [],
    matchOptions
  }: StrategyOptions) {
    this.cacheName = cacheName;
    this.plugins = plugins;
    this.matchOptions = matchOptions || {};
  }

  abstract _handle({ request, options }: { request: Request, options?: CacheQueryMatchOptions }): Promise<Response>;
}

export class CacheFirst extends Strategy {
  async _handle({ request, options }: { request: Request, options: CacheQueryMatchOptions }) {
    const cache = await caches.open(this.cacheName);

    const cachedResponse = await cache.match(request, {
      ignoreVary: options?.ignoreVary || false,
      ignoreSearch: options?.ignoreSearch || false,
    });
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request.clone());
    if (response.status === 200) {
      await cache.put(request, response.clone());
    }

    return response;
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

  async _handle({ request, options }: { request: Request, options?: CacheQueryMatchOptions }) {
    const cache = await caches.open(this.cacheName);

    try {
      const response = await fetch(request.clone());
      await cache.put(request, response.clone());

      return response;
    } catch (error) {
      const cachedResponse = await cache.match(request, {
        ignoreVary: options?.ignoreVary || false,
        ignoreSearch: options?.ignoreSearch || false,
      });
      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    }
  }
}

export interface NetworkOnlyOptions extends Omit<StrategyOptions, "cacheName" | "matchOptions"> {
  // (ShafSpecs) todo: give _networkTimeoutSeconds an implementation later
  networkTimeoutSeconds?: number;
}

export class NetworkOnly extends Strategy {
  private readonly _networkTimeoutSeconds: number;

  constructor(options: NetworkOnlyOptions = {}) {
    super(options);

    // (ShafSpecs) todo: give _networkTimeoutSeconds an implementation later
    this._networkTimeoutSeconds = options.networkTimeoutSeconds || 30;
  }

  async _handle({ request }: { request: Request }) {
    return fetch(request.clone());
  }
}

export class CacheOnly extends Strategy {
  async _handle({ request, options }: { request: Request, options?: CacheQueryMatchOptions }) {
    const cache = await caches.open(this.cacheName);

    const cachedResponse = await cache.match(request, {
      ignoreVary: options?.ignoreVary || false,
      ignoreSearch: options?.ignoreSearch || false,
    });
    if (cachedResponse) {
      return cachedResponse;
    }

    throw new Error("No cached response found");
  }
}