import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(d=>d.isDirectory()?files(`${dir}/${d.name}`):d.name.endsWith('.js')?[`${dir}/${d.name}`]:[]))).flat();}
for(const f of await files('server').then(async a=>[...a,...await files('client'),...await files('shared')])){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}}
console.log('All JavaScript modules parse.');
