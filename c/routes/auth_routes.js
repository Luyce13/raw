import { compileRoute } from "./index.js";
import * as c from "../controllers/controllers.js";

export const POST = [
  {
    ...compileRoute("/auth/register"),
    function: c.register,
  },
  {
    ...compileRoute("/auth/login"),
    function: c.login,
  },
];
