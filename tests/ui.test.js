import test from 'node:test';
import assert from 'node:assert/strict';
import { UI } from '../client/ui.js';
import { loadSettings } from '../client/settings.js';
import { Room } from '../server/room.js';
import { RULE_DEFAULTS,GAMES,SOCKETS } from '../shared/config.js';
import { startGame,publicRound } from '../server/games.js';
const element=()=>({hidden:false,innerHTML:'',textContent:'',style:{},addEventListener(){},contains(){return false;}});
const elements=new Map();
const doc={activeElement:{matches:()=>false},querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s);}};
test('Every UI panel and all seventeen terminal views render',()=>{
 const prior=globalThis.document;globalThis.document=doc;globalThis.localStorage={getItem:()=>null};
 try{const profile={id:'a',name:'Hazel',token:'a',colour:'#ffba53',owned:[],equipped:{},achievements:[]},r=new Room('ABCDEF','a',1,RULE_DEFAULTS,{db:{saves:{}},flush:async()=>{}});r.join(profile,'Hazel','a');r.startShift();r.bank=r.quota;r.endShift();const s=r.serialize(),app={state:s,me:s.players[0],profile,slots:[],settings:loadSettings(),audio:{sound(){}},voice:{level:0,muted:new Set()},unlock(){},offset:0};const ui=new UI(app);
  for(const panel of ['main','play','slots','rules','join','lobby','pause','settings','customise','credits','achievements','players','stats','items','cosmetics','clinic','exchange','confirm-part','challenge','shuttle','results','travel','ending','gameover','emotes','elevator','arcade','photo','vending','poster','tickets','console']){ui.show(panel,{slot:1,part:'leftEye',rules:RULE_DEFAULTS});assert.ok(ui.root.innerHTML.length>30,panel);assert.ok(!ui.root.innerHTML.includes('undefined'),panel);}
  s.tables=GAMES.map((type,i)=>({id:String(i),type,...SOCKETS[i],round:null}));for(const table of s.tables){ui.show('table',{id:table.id});assert.ok(ui.root.innerHTML.includes('data-action="bet"'),table.type);table.round=publicRound({...startGame(table.type,'ui'),owner:'a',stake:'10',id:'round',at:Date.now()});ui.render();assert.ok(ui.root.innerHTML.length>100,table.type);assert.ok(!ui.root.innerHTML.includes('undefined'),table.type);}
 }finally{globalThis.document=prior;}
});
