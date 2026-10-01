import test from 'node:test';
import assert from 'node:assert/strict';
import { movePlayer,obstacles } from '../shared/physics.js';
import { Room } from '../server/room.js';
import { RULE_DEFAULTS } from '../shared/config.js';
test('Server movement rejects wall penetration and lands on table tops',()=>{const p={x:22.7,z:0,y:0,vy:0,yaw:0};for(let i=0;i<100;i++)movePlayer(p,{right:true,sprint:true,yaw:0},.05,obstacles('hub'));assert.ok(p.x<=22.8);const table={x:0,z:0,w:4,d:2,h:1.25},q={x:0,z:0,y:1.4,vy:-2};for(let i=0;i<10;i++)movePlayer(q,{},.05,[table],'casino');assert.equal(q.y,1.25);});
test('Looking upward gives a physics throw upward velocity',()=>{const r=new Room('ABCDEF','a',1,RULE_DEFAULTS,{db:{saves:{}},flush:async()=>{}}),p=r.join({id:'a',colour:'#ffba53',owned:[],equipped:{},achievements:[]},'A','a');p.x=-8;p.z=17;p.pitch=1;r.pickup(p,'basketball');r.drop(p,true);assert.equal(r.props.find(p=>p.id==='basketball').vy,7);});
test('A canonical downward hoop crossing scores once',()=>{const r=new Room('ABCDEF','a',1,RULE_DEFAULTS,{db:{saves:{}},flush:async()=>{}}),p=r.join({id:'a',colour:'#ffba53',owned:[],equipped:{},achievements:[]},'A','a'),ball=r.props.find(p=>p.id==='basketball');Object.assign(ball,{x:-20,z:18,y:3.5,vy:-3,thrower:'a',throwFrom:{x:0,z:0}});const tickets=r.tickets;r.tick(.05);assert.equal(r.tickets,tickets+1);assert.ok(p.profile.achievements.includes('longbasket'));r.tick(.05);assert.equal(r.tickets,tickets+1);});
