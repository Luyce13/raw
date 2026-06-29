import http from "node:http";
import env from "./env.js";
import router from "./router.js";

async function main() {
	try {
		const server = http.createServer((req, res) => router(req, res));
		server.listen(env.port, env.bind, () => {
			console.log(`listening at http://${env.bind}:${env.port}`);
		});
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
}
main();
