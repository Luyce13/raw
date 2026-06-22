import * as c from "./controller.js";

const routes = [
  { method: "GET", pattern: "/", handler: c.health },
  { method: "POST", pattern: "/register", handler: c.register },
  { method: "POST", pattern: "/login", handler: c.login },
  { method: "GET", pattern: "/users/:id", handler: c.getUserById },
  { method: "GET", pattern: "/users", handler: c.getUsers },
];

export default routes;
