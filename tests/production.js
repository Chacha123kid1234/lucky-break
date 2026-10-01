import { io } from 'socket.io-client';
import assert from 'node:assert/strict';
import { VERSION,RULE_DEFAULTS } from '../shared/config.js';
const base=process.env.TEST_URL||'http://localhost:3101';
const config=await fetch(base+'/runtime-config').then(r=>r.json());assert.equal(config.dev,false);
const socket=io(base,{transports:['websocket'],reconnection:false});
const request=(event,data)=>new Promise((resolve,reject)=>socket.timeout(5000).emit(event,data,(error,result)=>error?reject(error):resolve(result)));
try{await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});assert.equal((await request('hello',{version:'wrong'})).error,'VERSION_MISMATCH');const hello=await request('hello',{version:VERSION});assert.equal(hello.ok,true);const host=await request('host',{slot:1,name:'<script>Test</script>',rules:RULE_DEFAULTS});assert.equal(host.ok,true);assert.ok(!host.state.players[0].name.includes('<'));const admin=await request('action',{id:crypto.randomUUID(),type:'admin',payload:{command:'money 999999999'}});assert.equal(admin.error,'ADMIN_DISABLED');const fakeWin=await request('action',{id:crypto.randomUUID(),type:'won',payload:{payout:'999999999'}});assert.equal(fakeWin.error,'INVALID_ACTION');const sync=await request('sync',{});assert.equal(sync.state.bank,'1000');console.log('PASS production blocks admin commands, fake payouts and version mismatch; usernames sanitized.');}finally{socket.disconnect();}
