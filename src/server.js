import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { taskStore, validateTask } from "./task-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const dataDir = process.env.OSS_DATA_DIR ? path.resolve(process.env.OSS_DATA_DIR) : path.join(rootDir, "data");
const tasksPath = path.join(dataDir, "tasks.json");
const projectsPath = path.join(dataDir, "projects.json");
const port = Number(process.env.PORT || 4321);
const mutateTasks = taskStore(tasksPath);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function ensureDataFiles() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(tasksPath)) {
    await writeJson(tasksPath, []);
  }
  if (!existsSync(projectsPath)) {
    await writeJson(projectsPath, []);
  }
}

async function readJson(filePath) {
  const source = await readFile(filePath, "utf8");
  return JSON.parse(source);
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

/**
 * 写接口鉴权:仅当配置了 OSS_ADMIN_KEY 时启用。
 * 未配置时放行(本地个人使用),并在启动时打印告警。
 * 部署到公网时务必设置 OSS_ADMIN_KEY,前端通过 x-admin-key 头携带。
 */
function requireWriteAuth(req, res) {
  const adminKey = process.env.OSS_ADMIN_KEY;
  if (!adminKey) {
    return true;
  }
  if (req.headers["x-admin-key"] === adminKey) {
    return true;
  }
  sendJson(res, 401, { error: "unauthorized: invalid or missing admin key" });
  return false;
}

async function readRequestBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw Object.assign(new Error("Request body is too large."), { status: 413 });
    }
  }
  try {
    const parsed = body ? JSON.parse(body) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch { throw Object.assign(new Error("需要有效 JSON 对象"), { status: 400 }); }
}

function summarize(projects, tasks) {
  const done = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "doing").length;
  const byTrack = tasks.reduce((memo, task) => {
    memo[task.track] = (memo[task.track] || 0) + 1;
    return memo;
  }, {});

  return {
    projects: projects.length,
    tasks: tasks.length,
    done,
    inProgress,
    byTrack
  };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/projects") {
    sendJson(res, 200, await readJson(projectsPath));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/tasks") {
    sendJson(res, 200, await readJson(tasksPath));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/summary") {
    const [projects, tasks] = await Promise.all([
      readJson(projectsPath),
      readJson(tasksPath)
    ]);
    sendJson(res, 200, summarize(projects, tasks));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/tasks") {
    if (!requireWriteAuth(req, res)) return true;
    const input = await readRequestBody(req);
    if (!input.title || typeof input.title !== "string") {
      sendJson(res, 400, { error: "title is required" });
      return true;
    }

    const task = {
      id: randomUUID(),
      title: input.title.trim(),
      project: String(input.project || "personal").trim(),
      track: String(input.track || "learning").trim(),
      difficulty: String(input.difficulty || "M").trim(),
      status: "todo",
      stage: input.stage || "intake",
      revision: randomUUID(),
      link: String(input.link || "").trim(),
      notes: String(input.notes || "").trim(),
      createdAt: new Date().toISOString()
    };
    validateTask(task);
    await mutateTasks(tasks => { tasks.unshift(task); return task; });
    sendJson(res, 201, task);
    return true;
  }

  const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (req.method === "PATCH" && taskMatch) {
    if (!requireWriteAuth(req, res)) return true;
    const input = await readRequestBody(req);
    const nextTask = await mutateTasks(tasks => {
    const index = tasks.findIndex((task) => task.id === taskMatch[1]);
    if (index === -1) {
      throw Object.assign(new Error("task not found"), { status: 404 });
    }

    if (input.expectedRevision !== undefined && input.expectedRevision !== (tasks[index].revision || "legacy")) throw Object.assign(new Error("另一窗口已修改任务，请刷新后合并；当前输入仍保留"), { status: 409 });
    const allowed = ["title", "project", "track", "difficulty", "status", "link", "notes", "stage"];
    const nextTask = { ...tasks[index] };
    for (const field of allowed) {
      if (Object.hasOwn(input, field)) {
        if (typeof input[field] !== "string") throw Object.assign(new Error("任务字段必须是文本"), { status: 400 });
        nextTask[field] = input[field].trim();
      }
    }
    validateTask(nextTask);
    nextTask.revision = randomUUID();
    nextTask.updatedAt = new Date().toISOString();
    tasks[index] = nextTask;
    return nextTask;
    });
    sendJson(res, 200, nextTask);
    return true;
  }

  return false;
}

async function serveStatic(req, res, url) {
  const rawPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const decodedPath = decodeURIComponent(rawPath);
  const filePath = path.normalize(path.join(publicDir, decodedPath));

  // 用 path.relative 判断是否仍在 publicDir 内,避免 public2 之类前缀误判
  const rel = path.relative(publicDir, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "content-type": contentTypes[ext] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch {
    const indexPath = path.join(publicDir, "index.html");
    const body = await readFile(indexPath);
    res.writeHead(200, { "content-type": contentTypes[".html"] });
    res.end(body);
  }
}

await ensureDataFiles();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (!handled) {
        sendJson(res, 404, { error: "not found" });
      }
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "internal server error" });
  }
});

server.listen(port, process.env.HOST || "127.0.0.1", () => {
  console.log(`Fullstack OSS Compass is running at http://localhost:${port}`);
  if (!process.env.OSS_ADMIN_KEY) {
    console.warn(
      "[warn] OSS_ADMIN_KEY 未设置,写接口(/api/tasks)无需鉴权。" +
      "部署到公网时请设置该环境变量以保护写接口。"
    );
  }
});
