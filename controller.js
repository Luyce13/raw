import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const usersEmailMap = new Map();
const usersIdMap = new Map();
const sessionsMap = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function userExists(identifier) {
  return usersEmailMap.has(identifier) || usersIdMap.has(identifier);
}

export async function register(req, res) {
  const { email, password } = JSON.parse(await readBody(req));
  if (userExists(email)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ message: "user with email already exists" }),
    );
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = { id: randomUUID(), email, passwordHash: hashedPassword };
  usersEmailMap.set(user.email, user);
  usersIdMap.set(user.id, user);
  res.writeHead(201, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ id: user.id }));
}

export async function login(req, res) {
  const { email, password } = JSON.parse(await readBody(req));
  const user = usersEmailMap.get(email);
  if (!user) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "invalid credentials" }));
  }
  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ message: "invalid credentials" }));
  }
  const sessionId = randomUUID();
  sessionsMap.set(sessionId, { userId: user.id, createdAt: Date.now() });
  res.writeHead(201, {
    "Content-Type": "application/json",
    SetCookie: `session-${sessionId} HttpOnly`,
  });
  return res.end(JSON.stringify({ id: user.id }));
}

export function getUsers(req, res) {
  console.log(req.query);
  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(JSON.stringify([...usersEmailMap.values()]));
}

export function getUserById(req, res) {
  const { id } = req.params;
  const user = usersIdMap.get(id);
  console.log(user);
  if (!user) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ error: `${id} does not resolve to any user` }),
    );
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(JSON.stringify(user));
}

export function health(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ message: "all good" }));
}

export function notFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  return res.end(`No matching route found for ${req.method} ${req.url}\n`);
}
