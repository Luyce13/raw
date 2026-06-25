import http from "node:http";
import mongoose from "mongoose";
import router from "./routerB.js";

async function main() {
  try {
    //await mongoose.connect(process.env.MONGO_URI);
    //console.log("MongoDB connected")
    const server = http.createServer((req, res) => {
      router(req, res);
    });
    server.listen(3000, "127.0.0.1", () =>
      console.log("listening on http://127.0.0.1:3000"),
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
main();
