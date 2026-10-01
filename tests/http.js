import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://localhost:3100';
const response=await fetch(base),html=await response.text();assert.equal(response.status,200);const map=html.match(/<script type="importmap">([^<]+)<\/script>/)[1],hash=createHash('sha256').update(map).digest('base64');assert.ok(response.headers.get('content-security-policy').includes(`'sha256-${hash}'`),'Import map must be authorized by CSP');
for(const url of ['/client/main.js','/client/style.css','/client/world.js','/client/lang/en.js','/vendor/three/build/three.module.js','/vendor/three/examples/jsm/postprocessing/EffectComposer.js','/vendor/socket/socket.io.esm.min.js','/shared/config.js','/assets/favicon.svg','/health']){const r=await fetch(base+url);assert.equal(r.status,200,url);}
for(const url of ['/data/store.json','/server/index.js','/node_modules/package.json','/.env'])assert.equal((await fetch(base+url)).status,404,url);
console.log('PASS static modules, import map CSP, health endpoint, and private-path protection.');
