import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { obstacles } from '../shared/physics.js';
const base=process.env.TEST_URL||'http://localhost:3100';
await fs.mkdir('test-results',{recursive:true});
const browser=process.env.BROWSER_CDP?await chromium.connectOverCDP(process.env.BROWSER_CDP):await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
const errors=[];
const a=await browser.newContext({viewport:{width:1366,height:768}}),b=await browser.newContext({viewport:{width:1366,height:768}}),pa=await a.newPage(),pb=await b.newPage();
for(const page of [pa,pb]){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
async function state(page){return page.evaluate(()=>window.__game.state);}
async function panel(page,name,data={}){await page.evaluate(([name,data])=>window.__game.ui.show(name,data),[name,data]);}
async function waitState(page,name,timeout=15000){await page.waitForFunction(s=>window.__game.state?.state===s,name,{timeout});}
async function walk(page,x,z){
 await page.evaluate(()=>{const g=window.__game;g.ui.panel='';g.ui.root.innerHTML='';g.yaw=0;g.pitch=0;g.keys.clear();});
 const s=await state(page),id=await page.evaluate(()=>window.__game.playerId),me=s.players.find(p=>p.id===id),world=obstacles(s.state==='CASINO'?'casino':'hub',s.tables),blocked=(x,z)=>world.some(o=>Math.abs(x-o.x)<o.w/2+.45&&Math.abs(z-o.z)<o.d/2+.45),key=(x,z)=>x+','+z;
 const start=[Math.round(me.x),Math.round(me.z)],queue=[start],previous=new Map([[key(...start),null]]);let goal;
 for(let i=0;i<queue.length;i++){const [px,pz]=queue[i];if(Math.hypot(px-x,pz-z)<1.2){goal=[px,pz];break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=px+dx,nz=pz+dz,k=key(nx,nz);if(Math.abs(nx)>22||Math.abs(nz)>22||blocked(nx,nz)||previous.has(k))continue;previous.set(k,[px,pz]);queue.push([nx,nz]);}}
 assert.ok(goal,'A walkable route must exist');const path=[];for(let q=goal;q;q=previous.get(key(...q)))path.unshift(q);path.shift();
 await page.evaluate(async path=>{const g=window.__game;for(const [x,z] of path){const at=performance.now();while(Math.hypot(g.me.x-x,g.me.z-z)>.5){if(performance.now()-at>6000)throw Error('Browser walking timeout');const dx=x-g.me.x,dz=z-g.me.z;g.intent={right:dx>.2,left:dx<-.2,back:dz>.2,forward:dz<-.2,sprint:true};await new Promise(r=>setTimeout(r,50));}}g.intent={};},path);
}
async function voteContinue(){for(const p of [pa,pb]){await panel(p,'results');await p.click('[data-action="continue"]');}}
async function board(){for(const p of [pa,pb]){await walk(p,0,-17);await panel(p,'shuttle');await p.click('[data-action="ready"]');}await Promise.all([waitState(pa,'CASINO'),waitState(pb,'CASINO')]);}
try{
 await Promise.all([pa.goto(base),pb.goto(base)]);
 await Promise.all([pa.waitForSelector('[data-action="play"]'),pb.waitForSelector('[data-action="play"]')]);
 await pa.screenshot({path:'test-results/menu.png'});
 await pa.click('[data-action="play"]');await pa.click('[data-action="host"]');await pa.fill('#name','Hazel');await pa.click('[data-slot="1"]');await pa.fill('[name="shiftSeconds"]','60');await pa.fill('[name="startingTickets"]','100');await pa.fill('[name="quotaMultiplier"]','0.1');await pa.selectOption('[name="difficulty"]','Relaxed');await pa.fill('[name="seed"]','load-campaign0');await pa.click('[data-action="create"]');
 await pa.waitForFunction(()=>window.__game?.state?.code);const code=await pa.evaluate(()=>window.__game.state.code);assert.match(code,/^[A-Z2-9]{6}$/);
 await pb.click('[data-action="play"]');await pb.click('[data-action="join"]');await pb.fill('#name','Otto');await pb.fill('#code',code);await pb.click('[data-action="join-submit"]');
 await Promise.all([pa.waitForFunction(()=>window.__game.state.players.length===2),pb.waitForFunction(()=>window.__game.state.players.length===2)]);
 await pa.evaluate(()=>{window.__game.ui.panel='';window.__game.ui.root.innerHTML='';});await pb.evaluate(()=>{window.__game.ui.panel='';window.__game.ui.root.innerHTML='';});
 await pa.waitForTimeout(1000);await pa.screenshot({path:'test-results/hub.png'});
 const visible=await pb.evaluate(()=>window.__game.world.avatars.size);assert.equal(visible,1);
 console.log('PASS: two browser sessions host/join and render the same hub with remote avatars.');
 await walk(pa,-14,-7);await panel(pa,'items');const offer=(await state(pa)).shop.find(o=>!['cover','hot','stamp'].includes(o.id));await pa.click(`[data-action="buy"][data-id="${offer.id}"]`);await pb.waitForFunction(id=>window.__game.state.props.some(p=>p.item===id),offer.id);const pickup=(await state(pa)).props.find(p=>p.item===offer.id);await pa.evaluate(async id=>window.__game.action('pickup',{id}),pickup.id);await pb.waitForFunction(id=>window.__game.state.players.some(p=>p.held?.item===id),offer.id);
 await walk(pa,-6,-17);await panel(pa,'challenge');await pa.click('[data-action="challenge-select"][data-id="together"]');await board();
 const sa=await state(pa),sb=await state(pb);assert.deepEqual(sa.tables.map(t=>[t.id,t.type,t.rotation]),sb.tables.map(t=>[t.id,t.type,t.rotation]));await pa.screenshot({path:'test-results/casino.png'});
 const bj=sa.tables.find(t=>t.type==='blackjack'),rou=sa.tables.find(t=>t.type==='roulette');await walk(pa,bj.x,bj.z+3);await panel(pa,'table',{id:bj.id});await pa.click('[data-action="bet"]');await pb.waitForFunction(id=>window.__game.state.tables.find(t=>t.id===id).round,bj.id);
 await walk(pb,rou.x,rou.z+3);await panel(pb,'table',{id:rou.id});await pb.click('[data-action="bet"]');const bjRound=(await state(pa)).tables.find(t=>t.id===bj.id).round;if(bjRound.phase==='playing')await pa.click('[data-action="game-stand"]');
 await pa.waitForFunction(id=>window.__game.state.tables.find(t=>t.id===id).round?.settled,rou.id);await pb.waitForFunction(()=>window.__game.state.challenge?.done);assert.equal((await state(pa)).bank,(await state(pb)).bank);
 console.log('PASS: physical purchase, transport, shared layout, spectated blackjack/roulette and shared dare.');
 await Promise.all([waitState(pa,'DAY_RESULTS',70000),waitState(pb,'DAY_RESULTS',70000)]);assert.deepEqual((await state(pa)).results,(await state(pb)).results);await pa.screenshot({path:'test-results/results.png'});await voteContinue();await Promise.all([waitState(pa,'INTERMISSION'),waitState(pb,'INTERMISSION')]);const checkpoint=await state(pa);
 await Promise.all([pa.reload(),pb.reload()]);await Promise.all([pa.waitForFunction(()=>window.__game?.state?.day===2),pb.waitForFunction(()=>window.__game?.state?.day===2)]);assert.equal((await state(pa)).bank,checkpoint.bank);assert.equal((await state(pb)).tickets,checkpoint.tickets);
 console.log('PASS: timed results, return to hub and both browser refreshes preserve campaign state.');
 if(process.env.TEST_FAST_CAMPAIGN==='1'){
  for(let day=2;day<=12;day++){await board();await pa.evaluate(async()=>{const g=window.__game;await g.action('admin',{command:'quota complete'});await g.action('admin',{command:'timer 1'});});await Promise.all([waitState(pa,'DAY_RESULTS'),waitState(pb,'DAY_RESULTS')]);await voteContinue();if(day<12)await Promise.all([waitState(pa,'INTERMISSION'),waitState(pb,'INTERMISSION')]);}
  await waitState(pa,'ENDING');await pa.click('[data-action="ending-safe"]');await pa.waitForFunction(()=>window.__game.state.ending?.type==='debtfree');await pa.screenshot({path:'test-results/ending.png'});console.log('PASS: accelerated development twelve-day campaign and original safe ending (clock/bank advanced explicitly).');
  await pa.evaluate(()=>window.__game.leave());await pa.click('[data-action="play"]');await pa.click('[data-action="host"]');await pa.click('[data-slot="2"]');await pa.check('[name="endless"]');await pa.click('[data-action="create"]');assert.equal((await state(pa)).rules.endless,true);console.log('PASS: separate endless save launches; extended endless progression is covered by server tests.');
 }
 console.log('BROWSER_ERRORS',JSON.stringify(errors));assert.equal(errors.length,0);
}finally{await browser.close();}
