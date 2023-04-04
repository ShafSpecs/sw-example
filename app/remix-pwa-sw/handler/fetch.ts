/**
 * Fetch Handlers
 * 
 * This is a confusing module tbh, asides `defaultFetchHandler`, now sure what I'm gonna do 
 * with this one. I don't want to hard-code everything for the user. Just a few helpers here and 
 * there.
 */

import { isAssetRequest, isDocumentRequest, isLoaderRequest } from "../core/common";
import type {
  CacheQueryMatchOptions,
  NetworkFirstOptions,
  NetworkOnlyOptions,
  Strategy,
} from "./strategy";
import { NetworkFirst } from "./strategy";

export type MatchResponse = "loader" | "document" | "asset" | null;
export type MatchRequest = (request: Request) => MatchResponse;

export const matchRequest: MatchRequest = (request: Request): MatchResponse => {
  if (isAssetRequest(request)) {
    return "asset";
  } else if (isDocumentRequest(request)) {
    return "document";
  } else if (isLoaderRequest(request)) {
    return "loader";
  } else {
    return null;
  }
};

export const defaultFetchHandler = async (event: FetchEvent): Promise<Response> => {
  const { request } = event;

  if (request.method !== "GET") {
    // (ShafSpecs) todo: return an error or smthg like void.
    // by default, only handle GET requests
    // Devs can override this in their own service worker but
    // we are handling only `GET` requests.
  }

  const match = matchRequest(request);
  switch (match) {
    case "asset":
      return fetch(request);
    case "document":
      return fetch(request);
    case "loader":
      return fetch(request);
    case null:
    default:
      return fetch(request.clone());
  }
};

export interface FetchHandlerOptions {
  cacheStrategy?: Strategy;
  matchOptions?:
    | CacheQueryMatchOptions
    | NetworkOnlyOptions
    | NetworkFirstOptions;
}

export interface FetchHandlerParams {
  request: Request;
  options?: FetchHandlerOptions;
}

export interface AssetFetchHandlerParams extends FetchHandlerParams {
  assetUrls: string[];
}

export const handleLoaderFetch = ({
  request,
  options,
}: FetchHandlerParams): Promise<Response> => {
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

export const handleDocumentFetch = ({
  request,
  options,
}: FetchHandlerParams): Promise<Response> => {
  const { cacheStrategy = null, matchOptions = {} } = options || {};

  if (cacheStrategy === null) {
    return fetch(request.clone());
  }

  return fetch(request.clone());
};

export const handleAssetFetch = ({
  request,
  options,
  assetUrls,
}: AssetFetchHandlerParams): Promise<Response> => {
  const { cacheStrategy = null, matchOptions = {} } = options || {};

  if (cacheStrategy === null) {
    return fetch(request.clone());
  }

  return fetch(request.clone());
};