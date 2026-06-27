import http from "node:http";
import { randomUUID } from "node:crypto";

// --- env with safe defaults ---
const bind = process.env.BINDING ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

// --- routing table ---
const routes = new Map();

routes.set("GET", [
  {
    ...compileRoute("/"),
    function: async function (req, res) {
      res.writeHead(200, "ok", { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "all good" }));
    },
  },
]);

function compileRoute(pattern) {
  const parts = pattern.split("/").filter(Boolean);
  return {
    pattern,
    parts,
    length: parts.length,
  };
}

// Reads the request stream and attaches parsed body to req.body.
// Supports JSON and URL-encoded form data; falls back to raw string.
// Rejects payloads over maxBytes to avoid memory exhaustion.
async function parseBody(req, maxBytes = 1_048_576 /* 1 MiB */) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;

    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        req.destroy();
        return reject(
          Object.assign(new Error("Payload too large"), { status: 413 }),
        );
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);

      const contentType = req.headers["content-type"] ?? "";

      if (contentType.includes("application/json")) {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
        }
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        resolve(Object.fromEntries(new URLSearchParams(raw).entries()));
      } else {
        resolve(raw);
      }
    });

    req.on("error", reject);
  });
}

// Wraps route.function in a promise so async handlers' rejections are caught
// and turned into 500 responses rather than unhandled rejection crashes.
async function dispatch(route, req, res) {
  try {
    await route.function(req, res);
  } catch (err) {
    const status = err.status ?? 500;
    console.error(req.id, err);
    if (!res.headersSent) {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: err.message ?? "Internal server error" }),
      );
    }
  }
}

async function handleRequest(req, res) {
  const { searchParams, pathname } = new URL(req.url, `http://${bind}:${port}`);

  // HEAD falls back to GET routes; response body is suppressed below.
  const isHead = req.method === "HEAD";
  const lookupMethod = isHead ? "GET" : req.method;
  const relevantRoutes = routes.get(lookupMethod) ?? [];

  for (const route of relevantRoutes) {
    const reqParts = pathname.split("/").filter(Boolean);
    const params = {};

    const matched =
      reqParts.length === route.length &&
      route.parts.every((part, i) => {
        if (part.startsWith(":")) {
          params[part.slice(1)] = reqParts[i];
          return true;
        }
        return part === reqParts[i];
      });

    if (!matched) continue;

    req.params = params;
    req.query = Object.fromEntries(searchParams.entries());
    req.id = randomUUID();

    const bodyMethods = new Set(["POST", "PUT", "PATCH"]);
    if (bodyMethods.has(req.method)) {
      try {
        req.body = await parseBody(req);
      } catch (err) {
        const status = err.status ?? 400;
        console.error(req.method, req.url, err.message);
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: err.message }));
        return;
      }
    }

    console.log(req.method, req.url, req.id, req.params, req.query);

    if (isHead) {
      res.write = () => true;
      res.end = (
        (_original) =>
        (data, ...rest) =>
          _original(undefined, ...rest)
      )(res.end.bind(res));
      await dispatch(route, req, res);
    } else {
      await dispatch(route, req, res);
    }

    return;
  }

  console.log(req.method, req.url, "— no match");
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: `no handler matched for ${req.method} ${req.url}`,
    }),
  );
}

async function main() {
  try {
    const server = http.createServer((req, res) => {
      handleRequest(req, res).catch((err) => {
        console.error("Unhandled error in handleRequest", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Internal server error" }));
        }
      });
    });

    server.listen(port, bind, () => {
      console.log(`listening at http://${bind}:${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
