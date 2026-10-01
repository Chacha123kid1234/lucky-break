import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
// Three's native import works in Node. World imports use browser import-map paths,
// which are also supplied by Three's exports map. Canvas is mocked only for mesh
// construction; this suite does not claim to validate rendered pixels or WebGL.
import { World } from '../client/world.js';
import { mascot,itemModel,animateMascot } from '../client/art.js';
import { FLOORS,SOCKETS,COSMETICS,ITEM_DEFS } from '../shared/config.js';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(){},save(){},restore(){},translate(){},rotate(){},beginPath(){},moveTo(){},arc(){},closePath(){},fill(){}})})};
function harness(){const w=Object.create(World.prototype);Object.assign(w,{settings:{textures:1},world:new THREE.Group(),scene:new THREE.Scene(),sun:new THREE.DirectionalLight(),tableMeshes:new Map(),props:new Map(),interactables:[],neons:[],doors:[],npcs:[]});w.scene.background=new THREE.Color();w.scene.fog=new THREE.FogExp2();return w;}
test('Original hub geometry builds without exceptions',()=>{const w=harness();w.buildHub();assert.ok(w.world.children.length>30);assert.ok(w.interactables.some(g=>g.userData.target.type==='shuttle'));assert.equal(w.npcs.length,6);});
test('All four original floors and every table build and animate outcomes',()=>{for(const floor of FLOORS){const w=harness(),tables=floor.games.map((type,i)=>({id:`t${i}`,type,...SOCKETS[i]}));w.buildCasino({floor:floor.id,tables});assert.equal(w.tableMeshes.size,tables.length);assert.ok(w.doors.length===2);}});
test('Transport, shared elevator interior and all ending sets build',()=>{const w=harness();w.buildTransport();assert.equal(w.travelStrips.length,10);w.buildLift(3);assert.equal(w.doors.length,2);for(const type of ['debtfree','finalwin','finalloss'])w.buildEnding({ending:{type},players:[]});});
test('All cosmetics and item/physics meshes construct',()=>{for(const c of COSMETICS){const m=mascot('#ffba53',{[c.category]:c.id});animateMascot(m,{moving:true,sprint:true,emote:'celebrate',emoteAt:Date.now()},1);assert.ok(m.children.length);}for(const item of ITEM_DEFS)assert.ok(itemModel(item.id).children.length);for(const prop of ['basketball','dummy','bat','duck','bottle','cup','dice','chair','checker'])assert.ok(itemModel(null,prop).children.length);});
