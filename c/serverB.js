import http from "node:http";
import router from "./router.js";
import env from "./env.js";

async function main() {
  try {
    const server = http.createServer(function (req, res) {
      return router(req, res);
    });
    server.listen(env.port, env.bind, function () {
      console.log(`listening at http://${env.bind}:${env.port}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
main();
