const state = {
  filter: "all",
  projects: [],
  tasks: [],
  summary: null
};

const elements = {
  metrics: document.querySelector("#metrics"),
  projects: document.querySelector("#projects"),
  tasks: document.querySelector("#tasks"),
  projectCount: document.querySelector("#projectCount"),
  taskCount: document.querySelector("#taskCount"),
  form: document.querySelector("#taskForm"),
  feedback: document.querySelector("#taskFeedback"),
  filters: [...document.querySelectorAll(".filter")]
};

let memoryAdminKey = "";
async function request(path, options, retried = false) {
  let adminKey = memoryAdminKey;
  try { adminKey = localStorage.getItem("ossAdminKey") || adminKey; } catch {}
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(adminKey ? { "x-admin-key": adminKey } : {}) },
    ...options
  });

  // 写接口被保护且未带 key/key 错误时,弹窗输入后重试一次
  if (response.status === 401 && !retried) {
    const key = window.prompt("请输入管理密钥(OSS_ADMIN_KEY):");
    if (key) {
      memoryAdminKey = key.trim();
      try { localStorage.setItem("ossAdminKey", memoryAdminKey); } catch {}
      return request(path, options, true);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function load() {
  const [projects, tasks, summary] = await Promise.all([
    request("/api/projects"),
    request("/api/tasks"),
    request("/api/summary")
  ]);
  state.projects = projects;
  state.tasks = tasks;
  state.summary = summary;
  render();
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMetrics() {
  const summary = state.summary || { projects: 0, tasks: 0, done: 0 };
  elements.metrics.innerHTML = [
    ["项目", summary.projects],
    ["任务", summary.tasks],
    ["完成任务（自记）", summary.done]
  ]
    .map(
      ([label, value]) => `
        <div class="metric">
          <strong>${value}</strong>
          <span>${label}</span>
        </div>
      `
    )
    .join("");
}

function renderProjects() {
  const projects =
    state.filter === "all"
      ? state.projects
      : state.projects.filter((project) => project.track === state.filter);

  elements.projectCount.textContent = `${projects.length} 个项目`;
  elements.projects.innerHTML = projects
    .map((project) => {
      const issues = project.entryIssues.length
        ? project.entryIssues
            .map(
              (issue) => `
                <li><a href="${escapeHtml(issue.url)}" target="_blank" rel="noreferrer">${escapeHtml(issue.title)}</a></li>
              `
            )
            .join("")
        : "<li>先从 docs、examples、tests 或最小复现切入</li>";

      return `
        <article class="project-card">
          <header>
            <h3><a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">${escapeHtml(project.repo)}</a></h3>
            <div class="project-meta">
              <span class="pill track">${project.track}</span>
              <span class="pill">${formatNumber(project.stars)} stars</span>
              <span class="pill">${project.openIssues} issues</span>
            </div>
          </header>
          <p>${escapeHtml(project.fit)}</p>
          <div class="project-meta">
            ${project.skills.map((skill) => `<span class="pill">${escapeHtml(skill)}</span>`).join("")}
          </div>
          <ul class="issue-list">${issues}</ul>
        </article>
      `;
    })
    .join("");
}

function nextStatus(status) {
  if (status === "todo") return "doing";
  if (status === "doing") return "done";
  return "todo";
}

function renderTasks() {
  elements.taskCount.textContent = `${state.tasks.length} 个任务`;
  elements.tasks.innerHTML = state.tasks
    .map(
      (task) => `
        <article class="task-card">
          <header>
            <h3>${escapeHtml(task.title)}</h3>
            <button class="task-status" data-id="${escapeHtml(task.id)}" data-status="${escapeHtml(task.status)}">
              ${escapeHtml(task.status)}
            </button>
          </header>
          <p>阶段：${escapeHtml(task.stage || "intake")}</p><p style="white-space:pre-wrap">${escapeHtml(task.notes || "No notes yet.")}</p><button class="edit-task" data-id="${escapeHtml(task.id)}">编辑记录</button>
          <footer>
            <div class="project-meta">
              <span class="pill track">${escapeHtml(task.track)}</span>
              <span class="pill">${escapeHtml(task.project)}</span>
              <span class="pill">${escapeHtml(task.difficulty)}</span>
            </div>
            ${task.link ? `<a href="${escapeHtml(task.link)}" target="_blank" rel="noreferrer">打开</a>` : ""}
          </footer>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".task-status").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
      const current = button.dataset.status;
      const task = state.tasks.find(task => task.id === button.dataset.id);
      await request(`/api/tasks/${button.dataset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus(current), expectedRevision: task.revision || "legacy" })
      });
      await load();
      elements.feedback.textContent = "任务状态已保存；这不代表 PR 已提交或合并。";
      } catch (error) { elements.feedback.textContent = error.message; } finally { button.disabled = false; }
    });
  });
}

document.querySelector("#tasks").addEventListener("click", event => {
  const button = event.target.closest(".edit-task"); if (!button) return;
  const task = state.tasks.find(row => row.id === button.dataset.id);
  for (const name of ["id","title","project","track","difficulty","link","notes","stage"]) elements.form.elements.namedItem(name).value = task[name] || (name === "stage" ? "intake" : "");
  elements.form.elements.namedItem("expectedRevision").value = task.revision || "legacy";
  elements.form.elements.namedItem("title").focus();
  elements.feedback.textContent = "正在编辑现有任务；原记录将在保存前保留历史副本。";
});
document.querySelector("#cancelEdit").onclick = () => { elements.form.reset(); elements.form.elements.namedItem("id").value = ""; elements.form.elements.namedItem("expectedRevision").value = ""; };

function render() {
  elements.filters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
  renderMetrics();
  renderProjects();
  renderTasks();
}

elements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    render();
  });
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const payload = Object.fromEntries(formData.entries());
  const id = payload.id; delete payload.id;
  if (!id) delete payload.expectedRevision;
  const submit = elements.form.querySelector('[type="submit"]'); submit.disabled = true;
  try {
    await request(id ? `/api/tasks/${encodeURIComponent(id)}` : "/api/tasks", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
    elements.form.reset(); elements.form.elements.namedItem("id").value = ""; elements.form.elements.namedItem("expectedRevision").value = "";
    await load(); elements.feedback.textContent = "任务记录已保存。";
  } catch(error) { elements.feedback.textContent = `保存失败，输入已保留：${error.message}`; }
  finally { submit.disabled = false; }
});

load().catch((error) => {
  elements.projects.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
});
