import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
} from "@remix-run/react";
import { useSWEffect } from "~/remix-pwa-sw/react";

import type { LinksFunction, MetaFunction } from "@remix-run/node";

import style from "./styles/index.css";

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

useSWEffect()

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
