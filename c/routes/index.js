const routes = new Map();
import * as auth from "./auth_routes.js";
import * as users from "./user_routes.js";

routes.set("GET", [...users.GET]);
routes.set("POST", [...auth.POST]);
routes.set("PUT", [{}]);
routes.set("PATCH", [{}]);
routes.set("DELETE", [{}]);

export function compileRoute(pattern) {
  const parts = pattern.split("/").filter(Boolean);
  return {
    pattern,
    parts,
    length: parts.length,
  };
}

export default routes;
