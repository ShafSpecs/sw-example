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
import { useSWEffect } from "./remix-pwa-sw/react/hooks/useSW";

import type { LinksFunction, MetaFunction } from "@remix-run/node";

import style from "./styles/index.css";
import { Fragment, useEffect } from "react";

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
  // useEffect(() => {
  //   if ("serviceWorker" in navigator) {
  //     if (navigator.serviceWorker.controller) {
  //       navigator.serviceWorker.controller?.postMessage({
  //         type: "ping",
  //         name: "remix"
  //       });

  //       navigator.serviceWorker.addEventListener('message', event => {
  //         // Handle the response from the service worker
  //         const responseData = event.data;
  //         console.log('Received response from service worker:', responseData);
  //       });
  //     } else {
  //       let listener = async () => {
  //         await navigator.serviceWorker.ready;
  //         navigator.serviceWorker.controller?.postMessage({
  //           type: "ping",
  //           name: "remix",
  //         });
  //       };
  //       navigator.serviceWorker.addEventListener("controllerchange", listener);

  //       navigator.serviceWorker.addEventListener('message', event => {
  //         // Handle the response from the service worker
  //         const responseData = event.data;
  //         console.log('Received response from service worker:', responseData);
  //       });

  //       return () => {
  //         navigator.serviceWorker.removeEventListener("controllerchange", listener);
  //       };
  //     }
  //   }
  // }, [location]);

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
  return <Fragment>
    <h1>{error.message}</h1>
  </Fragment>
}
