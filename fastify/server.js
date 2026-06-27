import fastify from "fastify";
const app = fastify({ logger: true });
app.get("/", function health() {
  return { hello: "world" };
});
try {
  await app.listen({ port: process.env.PORT, host: process.env.BINDING });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
