/**
 * Shared APIs
 */



export function isMethod(request: Request, methods: string[]): boolean {
  return methods.includes(request.method.toLowerCase());
}

export function isAssetRequest(request: Request): boolean {
  return (
    isMethod(request, ["get"]) &&
    ["/build/", "/icons"].some((publicPath) =>
      request.url.includes(publicPath)
    )
  );
}

export function isDocumentRequest(request: Request): boolean {
  return isMethod(request, ["get"]) && request.mode === "navigate";
}

export function isLoaderRequest(request: Request): string | false | null {
  const url = new URL(request.url);
  return isMethod(request, ["get"]) && url.searchParams.get("_data");
}
