import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const stages = ['intake', 'reproduce', 'test', 'fix', 'pr_ready', 'review'];
export function validateTask(task) {
  if (typeof task.title !== 'string' || !task.title.trim()) throw Object.assign(new Error('任务标题不能为空'), { status: 400 });
  if (!['todo', 'doing', 'done'].includes(task.status)) throw Object.assign(new Error('任务状态无效'), { status: 400 });
  if (task.stage && !stages.includes(task.stage)) throw Object.assign(new Error('流程阶段无效'), { status: 400 });
  if (!['S','M','L'].includes(task.difficulty)) throw Object.assign(new Error('难度无效'), { status: 400 });
  if (task.link) {
    let url; try { url = new URL(task.link); } catch {}
    if (!url || !['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error('链接必须是 HTTP 或 HTTPS'), { status: 400 });
  }
  return task;
}

// One server process per data directory. Queue the complete read-modify-write operation.
export function taskStore(file) {
  let queue = Promise.resolve();
  return function mutate(change) {
    const job = queue.then(async () => {
      const original = await readFile(file, 'utf8');
      const rows = JSON.parse(original);
      if (!Array.isArray(rows)) throw new Error('任务文件损坏；原记录保留，请先恢复副本');
      const result = change(rows);
      const history = path.join(path.dirname(file), 'history');
      await mkdir(history, { recursive: true });
      await writeFile(path.join(history, `${Date.now()}-${randomUUID()}.json`), original, { flag: 'wx', mode: 0o600 });
      const temp = `${file}.${randomUUID()}.tmp`;
      try {
        await writeFile(temp, JSON.stringify(rows, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
        await rename(temp, file);
      } finally { await unlink(temp).catch(() => {}); }
      return result;
    });
    queue = job.catch(() => {});
    return job;
  };
}
