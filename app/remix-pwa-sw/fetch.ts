/**
 * Fetch Handlers
 */

import { isAssetRequest, isDocumentRequest, isLoaderRequest } from "./core";
import type {
  CacheQueryMatchOptions,
  NetworkFirstOptions,
  NetworkOnlyOptions,
  Strategy,
} from "./strategy";
import { NetworkFirst } from "./strategy";

export type MatchResponse = "loader" | "document" | "asset" | null;
export type MatchRequest = (request: Request, { assetUrls }: { assetUrls: string[] }) => MatchResponse;

export const matchRequest: MatchRequest = (request: Request, { assetUrls = ["/build/", "/icons"] }): MatchResponse => {
  if (isAssetRequest(request, assetUrls)) {
    return "asset";
  } else if (isDocumentRequest(request)) {
    return "document";
  } else if (isLoaderRequest(request)) {
    return "loader";
  } else {
    return null;
  }
};

// export const handleRequest = async (event: FetchEvent): Promise<Response> => {
//   const { request } = event;

//   if (request.method !== "GET") {
//     // (ShafSpecs) todo: return an error or smthg like void.
//     // by default, only handle GET requests
//     // Devs can override this in their own service worker but
//     // we are handling only `GET` requests.
//   }

//   const match = matchRequest(request);
//   switch (match) {
//     case "asset":
//       return fetch(request);
//     case "document":
//       return fetch(request);
//     case "loader":
//       return fetch(request);
//     case null:
//     default:
//       return fetch(request.clone());
//   }
// };

export interface RequestHandlerOptions {
  cacheStrategy?: Strategy;
  matchOptions?:
    | CacheQueryMatchOptions
    | NetworkOnlyOptions
    | NetworkFirstOptions;
}

export interface RequestHandlerParams {
  request: Request;
  options?: RequestHandlerOptions;
}

export interface AssetRequestHandlerParams extends RequestHandlerParams {
  assetUrls: string[];
}

export const handleLoaderRequest = ({
  request,
  options,
}: RequestHandlerParams): Promise<Response> => {
  const defaultStrategy = new NetworkFirst({
    cacheName: "data-cache",
    plugins: [],
  });

  const { cacheStrategy = defaultStrategy, matchOptions = {} } = options || {};

  if (cacheStrategy === null) {
    return fetch(request.clone());
  }

  return fetch(request.clone());
};

export const handleDocumentRequest = ({
  request,
  options,
}: RequestHandlerParams): Promise<Response> => {
  const { cacheStrategy = null, matchOptions = {} } = options || {};

  if (cacheStrategy === null) {
    return fetch(request.clone());
  }

  return fetch(request.clone());
};

export const handleAssetRequest = ({
  request,
  options,
  assetUrls,
}: AssetRequestHandlerParams): Promise<Response> => {
  const { cacheStrategy = null, matchOptions = {} } = options || {};

  if (cacheStrategy === null) {
    return fetch(request.clone());
  }

  return fetch(request.clone());
};
