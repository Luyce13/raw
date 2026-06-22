import * as c from "./controller.js"
export default function router(req, res) {
  const { url, method } = req;
  console.log({ url, method });
  switch (`${method} ${url}`) {
    case "GET /":
      return c.health(res);
    case "POST /register":
      return c.register(req, res);
    case "POST /login":
      return c.login(req, res);
    case "GET /users":
      return c.getUsers(res);
    default:
      return c.notFound(res);
  }
}
