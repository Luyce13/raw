import { randomUUID } from "node:crypto";
import env from "./env.js";
import routes from "./routes/index.js";

async function readBody(req, res) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        res.writeHead(400, "bad request", {
          "Content-Type": "application/json",
        });
        return res.end(JSON.stringify({ error: "parsing to json failed" }));
      }
    });
    req.on("error", () => reject);
  });
}

export default async function router(req, res) {
  const releventRoutes = routes.get(req.method) || [];
  const { searchParams, pathname } = new URL(
    req.url,
    `http://${env.bind}:${env.port}`,
  );

  for (const route of releventRoutes) {
    const reqParts = pathname.split("/").filter(Boolean);
    const reqPartsLen = reqParts.length;
    const params = {};

    const matched =
      reqPartsLen === route.length &&
      route.parts.every((part, i) => {
        if (part.startsWith(":")) {
          const key = part.slice(1);
          params[key] = reqParts[i];
          return true;
        }
        return part === reqParts[i];
      });
    if (matched) {
      req.params = params;
      req.query = Object.fromEntries(searchParams.entries());
      req.id = randomUUID();
      console.log(req.method, req.url, req.id, req.params, req.query);
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        req.body = await readBody(req, res);
      }
      return route.function(req, res);
    }
  }
  console.log(req.method, req.url);
  res.writeHead(404, "not found", {
    "Content-Type": "application/json",
  });
  res.end(
    JSON.stringify({
      message: `no handler matched for ${req.method} ${req.url}`,
    }),
  );
}
