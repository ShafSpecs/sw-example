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

export type MatchResponse = "loader" | "document" | "asset" | null;
export type MatchRequest = (
  request: Request,
  assetUrls: string[]
) => MatchResponse;

export const matchRequest: MatchRequest = (
  request: Request,
  assetUrls = ["/build/", "/icons"]
): MatchResponse => {
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

export const handleLoaderRequest = (
  request: Request,
  strategy: Strategy
): Promise<Response> => {
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
