import { randomUUID } from "node:crypto";
import env from "./env.js";

const routes = new Map();
routes.set("GET", [
	{
		...compileRoute("/"),
		function: (req, res) => {
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

export default function router(req, res) {
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
