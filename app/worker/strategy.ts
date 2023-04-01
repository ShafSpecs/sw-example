export type StrategyOptions = {
  cacheName: string;
  plugins: any[];
};

export abstract class Strategy {
  protected cacheName: string;
  protected plugins: any[];

  constructor({
    cacheName = `cache-${Math.random() * 10_000}`,
    plugins = [],
  }: StrategyOptions) {
    this.cacheName = cacheName;
    this.plugins = plugins;
  }

  abstract _handle({ request }: { request: Request }): Promise<Response>;
}

export class CacheFirst extends Strategy {
  async _handle({ request }: { request: Request }) {
    const cache = await caches.open(this.cacheName);

    const cachedResponse = await cache.match(request);
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

export class NetworkFirst extends Strategy {
  async _handle({ request }: { request: Request }) {
    const cache = await caches.open(this.cacheName);

    try {
      const response = await fetch(request.clone());
      await cache.put(request, response.clone());

      return response;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    }
  }
}

export class NetworkOnly extends Strategy {
  async _handle({ request }: { request: Request }) {
    return fetch(request.clone());
  }
}

export class CacheOnly extends Strategy {
  async _handle({ request }: { request: Request }) {
    const cache = await caches.open(this.cacheName);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw new Error("No cached response found");
  }
}