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
  filters: [...document.querySelectorAll(".filter")]
};

async function request(path, options, retried = false) {
  const adminKey = localStorage.getItem("ossAdminKey") || "";
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(adminKey ? { "x-admin-key": adminKey } : {}) },
    ...options
  });

  // 写接口被保护且未带 key/key 错误时,弹窗输入后重试一次
  if (response.status === 401 && !retried) {
    const key = window.prompt("请输入管理密钥(OSS_ADMIN_KEY):");
    if (key) {
      localStorage.setItem("ossAdminKey", key.trim());
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
    ["完成", summary.done]
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
          <p>${escapeHtml(task.notes || "No notes yet.")}</p>
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
      const current = button.dataset.status;
      await request(`/api/tasks/${button.dataset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus(current) })
      });
      await load();
    });
  });
}

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
  await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  elements.form.reset();
  await load();
});

load().catch((error) => {
  elements.projects.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
});
