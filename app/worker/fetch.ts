/**
 * Fetch Handlers
 */

import { isAssetRequest, isDocumentRequest, isLoaderRequest } from "./common";

export type MatchResponse = 'loader' | 'document' | 'asset' | null
export type MatchRequest = (request: Request) => MatchResponse;

export const matchRequest: MatchRequest = (request: Request): MatchResponse => {
  if (isAssetRequest(request)) {
    return 'asset';
  } else if (isDocumentRequest(request)) {
    return 'document';
  } else if (isLoaderRequest(request)) {
    return 'loader';
  } else {
    return null;
  }
}

export const fetchHandler = async (event: FetchEvent): Promise<Response> => {
  const { request } = event;

  if (request.method !== 'GET') {
    // (ShafSpecs) todo: return an error or smthg like void.
    // by default, only handle GET requests
    // Devs can override this in their own service worker but 
    // we are handling only `GET` requests. 
  }

  const match = matchRequest(request);
  switch (match) {
    case 'asset':
      return fetch(request);
    case 'document':
      return fetch(request);
    case 'loader':
      return fetch(request);
    case null:
    default:
      return fetch(request.clone());
  }
}

type CacheStrategy = 'cacheFirst' | 'networkFirst' | 'networkOnly' | 'cacheOnly' | undefined;
type Plugin = any // (ShafSpecs) todo: change this to a proper type later

export interface FetchHandlerOptions {
  cacheStrategy?: CacheStrategy;
  plugins?: Plugin[];
  cacheName?: string;
}

export interface FetchHandlerParams {
  request: Request;
  options?: FetchHandlerOptions;
}

export interface AssetFetchHandlerParams extends FetchHandlerParams {
  assetUrls: string[];
}

export const handleLoaderFetch = ({ request, options }: FetchHandlerParams): Promise<Response> => {
  const { cacheStrategy = 'networkFirst', plugins = [], cacheName = "data-cache" } = options || {};
  // switch (cacheStrategy) {
  //   case 'cacheFirst':
  //     return new CacheFirst({ cacheName, plugins }).handle({ request });
  //   case 'networkFirst':
  //     return new NetworkFirst({ cacheName, plugins }).handle({ request });
  //   case 'networkOnly':
  //     return new NetworkOnly().handle({ request });
  //   case 'cacheOnly':
  //     return new CacheOnly({ cacheName }).handle({ request });
  //   default:
  //     return fetch(request.clone());
  // }
  return fetch(request.clone());
}

export const handleDocumentFetch = ({ request, options }: FetchHandlerParams): Promise<Response> => {
  const { cacheStrategy = 'networkFirst', plugins = [], cacheName = "page-cache" } = options || {};
  // switch (cacheStrategy) {
  //   case 'cacheFirst':
  //     return new CacheFirst({ cacheName, plugins }).handle({ request });
  //   case 'networkFirst':
  //     return new NetworkFirst({ cacheName, plugins }).handle({ request });
  //   case 'networkOnly':
  //     return new NetworkOnly().handle({ request });
  //   case 'cacheOnly':
  //     return new CacheOnly({ cacheName }).handle({ request });
  //   default:
  //     return fetch(request.clone());
  // }
  return fetch(request.clone());
}

export const handleAssetFetch = ({ request, options, assetUrls }: AssetFetchHandlerParams): Promise<Response> => {
  const { cacheStrategy = 'cacheFirst', plugins = [], cacheName = "asset-cache" } = options || {};
  // switch (cacheStrategy) {
  //   case 'cacheFirst':
  //     return new CacheFirst({ cacheName, plugins }).handle({ request });
  //   case 'networkFirst':
  //     return new NetworkFirst({ cacheName, plugins }).handle({ request });
  //   case 'networkOnly':
  //     return new NetworkOnly().handle({ request });
  //   case 'cacheOnly':
  //     return new CacheOnly({ cacheName }).handle({ request });
  //   default:
  //     return fetch(request.clone());
  // }
  return fetch(request.clone());
}