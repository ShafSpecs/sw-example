import { isAssetRequest, isDocumentRequest, isLoaderRequest } from "../core";

export { remixLoaderPlugin } from "./plugin";

type WBProps = {
  url: URL;
  request: Request;
  event: Event;
};

export function matchAssetRequest({ request }: WBProps, assetUrls: string[]) {
  return isAssetRequest(request, assetUrls);
}

export function matchDocumentRequest({ request }: WBProps) {
  return isDocumentRequest(request);
}

export function matchLoaderRequest({ request }: WBProps) {
  return isLoaderRequest(request);
}
