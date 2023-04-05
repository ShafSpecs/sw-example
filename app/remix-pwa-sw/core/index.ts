export { logger } from "./logger";
export { handlePush } from "./push";
export { handleMessage, handleSyncRemixManifest } from "./message";

export function isMethod(request: Request, methods: string[]): boolean {
  return methods.includes(request.method.toLowerCase());
}

export function isAssetRequest(request: Request, assetUrls: string[]): boolean {
  return (
    isMethod(request, ["get"]) &&
    assetUrls.some((publicPath) => request.url.includes(publicPath))
  );
}

export function isDocumentRequest(request: Request): boolean {
  return isMethod(request, ["get"]) && request.mode === "navigate";
}

export function isLoaderRequest(request: Request): string | false | null {
  const url = new URL(request.url);
  return isMethod(request, ["get"]) && url.searchParams.get("_data");
}
