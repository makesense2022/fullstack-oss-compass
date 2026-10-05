import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { taskStore, validateTask } from '../src/task-store.js';

test('concurrent additions preserve all records and every pre-write snapshot', async () => {
 const dir = await mkdtemp(path.join(tmpdir(), 'oss-compass-'));
 try {
  const file = path.join(dir, 'tasks.json'); await writeFile(file,'[]');const change=taskStore(file);
  await Promise.all(Array.from({length:12},(_,id)=>change(rows=>{rows.push({id});return id;})));
  const rows=JSON.parse(await readFile(file,'utf8'));assert.equal(rows.length,12);assert.equal(new Set(rows.map(r=>r.id)).size,12);
  assert.equal((await readdir(path.join(dir,'history'))).length,12);
 } finally { await rm(dir,{recursive:true,force:true}); }
});
test('corrupt or failed changes preserve previous bytes and later queued writes can recover', async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'oss-compass-'));
 try {
  const file=path.join(dir,'tasks.json');await writeFile(file,'{broken');const change=taskStore(file);
  await assert.rejects(change(rows=>rows.push({id:1})));assert.equal(await readFile(file,'utf8'),'{broken');
  await writeFile(file,'[]');await assert.rejects(change(()=>{throw Error('validation failed')}));assert.equal(await readFile(file,'utf8'),'[]');
  await change(rows=>rows.push({id:2}));assert.equal(JSON.parse(await readFile(file,'utf8'))[0].id,2);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('blank title, invalid workflow state and non-web links are rejected',()=>{
 const row={title:'Existing task',status:'todo',difficulty:'M',stage:'intake',link:'https://github.com/vueuse/vueuse/issues/5314'};
 for(const patch of [{title:'  '},{status:'invented'},{stage:'merged'},{difficulty:'impossible'},{link:'javascript:alert(1)'}]) assert.throws(()=>validateTask({...row,...patch}));
 assert.equal(validateTask(row),row);
});
