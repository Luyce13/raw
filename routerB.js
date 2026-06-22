import { URL } from "url";
import routes from "./routes.js";
import { notFound } from "./controller.js";

function matchRoute(pattern, pathname) {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i]; // e.g. :id → { id: "123" }
    } else if (patternParts[i] !== pathParts[i]) {
      return null; // static segment mismatch
    }
  }
  return params;
}

export default function router(req, res) {
  const { pathname, searchParams } = new URL(req.url, "http://localhost");
  console.log({ pathname, searchParams, url: req.url, newURL: new URL(req.url, "http://localhost") });
  for (const route of routes) {
    if (route.method !== req.method) continue;
    const params = matchRoute(route.pattern, pathname);
    if (params !== null) {
      req.params = params;
      req.query = searchParams;
      return route.handler(req, res);
    }
  }
  return notFound(req, res);
}
