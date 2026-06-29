import { compileRoute } from "./index.js";
import * as c from "../controllers/controllers.js";
export const GET = [
  {
    ...compileRoute("/"),
    function: c.health,
  },
  {
    ...compileRoute("/users"),
    function: c.getUsers,
  },
  {
    ...compileRoute("/users/:id"),
    function: c.getUsers,
  },
];
