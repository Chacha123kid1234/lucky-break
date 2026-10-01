import { io } from 'socket.io-client';
import assert from 'node:assert/strict';
import { VERSION,RULE_DEFAULTS } from '../shared/config.js';
import { obstacles } from '../shared/physics.js';
const base=process.env.TEST_URL||'http://localhost:3100';
const clients=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function client(token){const socket=io(base,{transports:['websocket'],reconnection:false});const c={socket,state:null,seq:0,effects:[]};clients.push(c);socket.on('state',s=>c.state=s);socket.on('effects',es=>c.effects.push(...es));await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});c.request=(event,payload)=>new Promise((resolve,reject)=>socket.timeout(5000).emit(event,payload,(err,data)=>err?reject(err):resolve(data)));const hello=await c.request('hello',{version:VERSION,token});assert.equal(hello.ok,true);c.profile=hello.profile;return c;}
async function action(c,type,payload={},id=crypto.randomUUID()){const r=await c.request('action',{id,type,payload});if(!r.ok)throw Error(`${type}: ${r.error}`);return r;}
async function wait(c,fn,timeout=10000){const at=Date.now();while(!c.state||!fn(c.state)){if(Date.now()-at>timeout)throw Error('State wait timed out');await sleep(50);}return c.state;}
function input(c,keys={}){c.socket.emit('input',{seq:++c.seq,yaw:0,pitch:0,...keys});}
async function walk(c,x,z){
 const start=c.state.players.find(p=>p.id===c.profile.id),world=obstacles(c.state.state==='CASINO'?'casino':'hub',c.state.tables),blocked=(x,z)=>world.some(o=>Math.abs(x-o.x)<o.w/2+.45&&Math.abs(z-o.z)<o.d/2+.45),key=(x,z)=>`${x},${z}`;
 const sx=Math.round(start.x),sz=Math.round(start.z),queue=[[sx,sz]],previous=new Map([[key(sx,sz),null]]);let goal=null;
 for(let i=0;i<queue.length;i++){const [px,pz]=queue[i];if(Math.hypot(px-x,pz-z)<1.2){goal=[px,pz];break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=px+dx,nz=pz+dz,k=key(nx,nz);if(Math.abs(nx)>22||Math.abs(nz)>22||blocked(nx,nz)||previous.has(k))continue;previous.set(k,[px,pz]);queue.push([nx,nz]);}}
 if(!goal)throw Error('No walkable path');const path=[];for(let q=goal;q;q=previous.get(key(...q)))path.unshift(q);path.shift();
 let started=Date.now(),index=0;while(Date.now()-started<22000){const p=c.state.players.find(p=>p.id===c.profile.id);while(index<path.length&&Math.hypot(p.x-path[index][0],p.z-path[index][1])<.48)index++;if(index>=path.length||Math.hypot(x-p.x,z-p.z)<1.25){input(c,{});return;}const dx=path[index][0]-p.x,dz=path[index][1]-p.z;input(c,{right:dx>.2,left:dx<-.2,back:dz>.2,forward:dz<-.2,sprint:true});await sleep(50);}input(c,{});throw Error('Walking timeout');
}
try{
 const a=await client(),host=await a.request('host',{slot:1,name:'Load Hazel',rules:{...RULE_DEFAULTS,shiftSeconds:60,startingTickets:100,difficulty:'Relaxed',quotaMultiplier:.1,seed:'load-campaign0'}});assert.equal(host.ok,true);a.state=host.state;
 for(let i=1;i<6;i++){const c=await client();const joined=await c.request('join',{code:a.state.code,name:`Load ${i}`});assert.equal(joined.ok,true);c.state=joined.state;}
 await wait(a,s=>s.players.filter(p=>p.connected).length===6);
 const seventh=await client();const full=await seventh.request('join',{code:a.state.code,name:'Too Many'});assert.equal(full.error,'ROOM_FULL');seventh.socket.disconnect();
 console.log('PASS six real socket clients; seventh rejected.');
 const b=clients[1];await walk(a,-14,-7);const item=a.state.shop.find(i=>!['cover','hot','stamp'].includes(i.id));assert.ok(item);const before=a.state.tickets;
 const messageId=crypto.randomUUID();await action(a,'buy',{item:item.id},messageId);await action(a,'buy',{item:item.id},messageId);await wait(b,s=>s.props.some(p=>p.item===item.id));assert.equal(b.state.tickets,before-item.cost);assert.equal(b.state.props.filter(p=>p.item===item.id).length,1);
 console.log('PASS authoritative purchase visible to peers; duplicate request charged once.');
 await action(a,'pickup',{id:a.state.props.find(p=>p.item===item.id).id});await wait(b,s=>s.players.find(p=>p.id===a.profile.id).held?.item===item.id);
 const token=a.profile.token,roomCode=a.state.code,heldId=a.state.players.find(p=>p.id===a.profile.id).held.id;a.socket.disconnect();await wait(b,s=>!s.players.find(p=>p.id===a.profile.id).connected);const recovered=await client(token);const rejoined=await recovered.request('join',{code:roomCode,name:'Load Hazel'});assert.equal(rejoined.ok,true);recovered.state=rejoined.state;assert.equal(rejoined.playerId,a.profile.id);assert.equal(rejoined.state.players.find(p=>p.id===a.profile.id).held.id,heldId);assert.equal(rejoined.state.players.length,6);
 console.log('PASS reconnect restores identity, held item and bank without duplicate players.');
 await walk(recovered,-6,-17);await action(recovered,'challenge',{id:'together'});await wait(b,s=>s.challenge?.id==='together');
 const active=[recovered,...clients.slice(1,6)];for(const c of active.slice(0,4)){await walk(c,0,-17);await action(c,'ready');}await wait(b,s=>s.state==='CASINO',12000);await wait(recovered,s=>s.state==='CASINO');
 assert.deepEqual(recovered.state.tables.map(t=>[t.id,t.type,t.rotation]),b.state.tables.map(t=>[t.id,t.type,t.rotation]));console.log('PASS majority boarding, travel and deterministic shared layout.');
 const bj=b.state.tables.find(t=>t.type==='blackjack'),rou=b.state.tables.find(t=>t.type==='roulette');await walk(recovered,bj.x,bj.z+3);await walk(b,rou.x,rou.z+3);
 await Promise.all([action(recovered,'bet',{tableId:bj.id,amount:'10'}),action(b,'bet',{tableId:rou.id,amount:'10',options:{kind:'red'}})]);
 await wait(b,s=>s.tables.find(t=>t.id===bj.id).round);const round=b.state.tables.find(t=>t.id===bj.id).round;if(round.phase==='playing')await action(recovered,'game',{tableId:bj.id,action:'stand'});
 await wait(b,s=>s.tables.find(t=>t.id===rou.id).round?.settled);await wait(recovered,s=>s.tables.find(t=>t.id===rou.id).round?.settled);assert.equal(b.state.bank,recovered.state.bank);assert.equal(b.state.tables.find(t=>t.id===bj.id).round.owner,a.profile.id);assert.equal(b.state.challenge.done,true);assert.equal(recovered.state.challenge.progress,2);console.log('PASS simultaneous blackjack/roulette; matching results, balances and two-player dare completion.');
 await wait(b,s=>s.state==='DAY_RESULTS',70000);await wait(recovered,s=>s.state==='DAY_RESULTS');assert.deepEqual(b.state.results,recovered.state.results);assert.equal(b.state.results.passed,true);console.log('PASS timer, results and ticket awards match on six clients.');
 for(const c of active.slice(0,4))await action(c,'continue');await wait(b,s=>s.state==='INTERMISSION',12000);assert.equal(b.state.day,2);const savedBank=b.state.bank,savedTickets=b.state.tickets;recovered.socket.disconnect();const refreshed=await client(token);const restore=await refreshed.request('join',{code:roomCode,name:'Load Hazel'});assert.equal(restore.ok,true);assert.equal(restore.state.day,2);assert.equal(restore.state.bank,savedBank);assert.equal(restore.state.tickets,savedTickets);assert.equal(restore.state.players.find(p=>p.id===a.profile.id).held.id,heldId);console.log('PASS return journey, next-day checkpoint and refreshed client preserve bank/tickets/item.');
 console.log('LOAD TEST PASS');
}finally{for(const c of clients)c.socket.disconnect();}
