import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLocation,
  useMatches,
} from "@remix-run/react";
import { useSWEffect } from "./useSW";

import type { LinksFunction, MetaFunction } from "@remix-run/node";

import style from "./styles/index.css";
import { useEffect } from "react";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: style },
  ]
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  const matches = useMatches();
  const location = useLocation();

  function isPromise(p: any): boolean {
    if (typeof p === "object" && typeof p.then === "function") {
      return true;
    }

    return false;
  }

  useSWEffect();
  useEffect(() => {
    const manifest = window.__remixManifest;
    const match = matches.filter((route) => {
      if (route.data) {
        return (
          Object.values(route.data!).filter((elem) => {
            return isPromise(elem);
          }).length === 0
        );
      }
      return true;
    })

    let a = []

    for (const match of matches) {
      if (manifest.routes[match.id].hasLoader) {
        const params = new URLSearchParams(location.search);
        params.set("_data", match.id);
        let search = params.toString();
        search = search ? `?${search}` : "";
        const url = location.pathname + search + location.hash;
        a.push({ params, search, url })
      }
    }

    console.log(a)
  })

return (
  <html lang="en">
    <head>
      <Meta />
      <Links />
    </head>
    <body>
      <Outlet />
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
    </body>
  </html>
);
}

export function CatchBoundary() {
  const caught = useCatch()

  return <div>
    <h1>Something Went Wrong</h1>
    <h2>Server responded with {caught.status} {caught.statusText} {caught.data.message}</h2>
    <Link to='/'>Goto Home</Link>
  </div>
}

export function ErrorBoundary({ error }: { error: any }) {
  console.log(error)
  return <div>
    <h1>{error.message}</h1>
  </div>
}
