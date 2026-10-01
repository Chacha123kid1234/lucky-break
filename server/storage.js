import fs from 'node:fs/promises';
import path from 'node:path';
export class Storage {
 constructor(dir=process.env.DATA_DIR||'data'){this.dir=path.resolve(dir);this.queue=Promise.resolve();this.db={profiles:{},saves:{}};}
 async load(){await fs.mkdir(this.dir,{recursive:true});try{this.db=JSON.parse(await fs.readFile(path.join(this.dir,'store.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('SAVE_COULD_NOT_LOAD');}return this;}
 flush(){const json=JSON.stringify(this.db);this.queue=this.queue.catch(()=>{}).then(async()=>{const tmp=path.join(this.dir,'store.json.tmp');const handle=await fs.open(tmp,'w');try{await handle.writeFile(json);await handle.sync();}finally{await handle.close();}await fs.rename(tmp,path.join(this.dir,'store.json'));});return this.queue;}
}
