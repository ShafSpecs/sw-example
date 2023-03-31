/**
 * This is contains internal APIs for `sw` modules like `logger` - which is based on
 * Workbox logger
 */

export function debug(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
}

export function isMethod(request: Request, methods: string[]): boolean {
  return methods.includes(request.method.toLowerCase());
}