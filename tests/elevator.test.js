import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/room.js';
import { RULE_DEFAULTS } from '../shared/config.js';
test('Upper-floor boarding includes a server-timed elevator journey',()=>{const r=new Room('ABCDEF','a',1,RULE_DEFAULTS,{db:{saves:{}},flush:async()=>{}}),p=r.join({id:'a',colour:'#ffba53',owned:[],equipped:{},achievements:[]},'A','a');r.day=4;r.prepareDay();p.x=0;p.z=-17;const at=Date.now();r.readiness(p);assert.equal(r.floor,2);assert.ok(r.transitionAt-at>=9000);r.tick(.05,at+7000);assert.equal(r.state,'TRAVELLING');r.tick(.05,at+9100);assert.equal(r.state,'CASINO');});
