/**
 * Fetch Handlers
 *
 * This is a confusing module tbh, asides `defaultFetchHandler`, now sure what I'm gonna do
 * with this one. I don't want to hard-code everything for the user. Just a few helpers here and
 * there.
 */

import {
  isAssetRequest,
  isDocumentRequest,
  isLoaderRequest,
} from "../core/common";

import type { CacheStrategy } from "./strategy";

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

export const defaultFetchHandler = async (
  event: FetchEvent
): Promise<Response> => {
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

export const handleFetchRequest = (
  request: Request,
  strategy: CacheStrategy
) => {
  return strategy.handle(request);
};