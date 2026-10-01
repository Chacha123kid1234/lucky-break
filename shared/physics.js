export function obstacles(zone='hub',tables=[]) {
  const walls=[{x:-24,z:0,w:1,d:50,h:7},{x:24,z:0,w:1,d:50,h:7},{x:0,z:-24,w:48,d:1,h:7},{x:0,z:24,w:48,d:1,h:7}];
  if(zone==='casino')return [...walls,...tables.map(t=>({x:t.x,z:t.z,w:Math.abs(Math.cos(t.rotation||0))*3.8+Math.abs(Math.sin(t.rotation||0))*2.3,d:Math.abs(Math.sin(t.rotation||0))*3.8+Math.abs(Math.cos(t.rotation||0))*2.3,h:1.25})),{x:0,z:21,w:8,d:2,h:1}];
  return [...walls,{x:-14,z:-10,w:8,d:3,h:6},{x:14,z:-10,w:8,d:3,h:6},{x:-14,z:10,w:8,d:3,h:6},{x:14,z:10,w:8,d:3,h:6},{x:0,z:7,w:5,d:5,h:0.5}];
}
export function groundHeight(x,z,zone='hub') { if(zone==='hub' && x>8&&x<12&&z>13&&z<20)return Math.max(0,(20-z)*0.18);return 0; }
export function movePlayer(p,input,dt,world=[],zone='hub') {
  dt=Math.min(dt,0.06); const speed=(input.crouch?2.3:input.sprint?7:4.8)*(p.body?.body===false?0.65:1);
  let sx=(input.right?1:0)-(input.left?1:0),sz=(input.back?1:0)-(input.forward?1:0),len=Math.hypot(sx,sz)||1;
  const yaw=input.yaw??p.yaw??0; p.yaw=yaw;p.pitch=input.pitch??0;p.crouch=!!input.crouch;
  const vx=(sx/len*Math.cos(yaw)+sz/len*Math.sin(yaw))*speed, vz=(-sx/len*Math.sin(yaw)+sz/len*Math.cos(yaw))*speed;
  p.vx=vx+(p.knockX??0);p.vz=vz+(p.knockZ??0);p.knockX=(p.knockX??0)*Math.exp(-dt*5);p.knockZ=(p.knockZ??0)*Math.exp(-dt*5);
  const prevY=p.y, floor=groundHeight(p.x,p.z,zone);
  if(input.jump&&!p.jumpHeld&&p.y<=floor+0.04){p.vy=6.2;}p.jumpHeld=!!input.jump;
  p.vy=(p.vy??0)-16*dt;p.y+=p.vy*dt;
  const collide=(x,z)=>world.some(o=>prevY<o.h-0.12&&Math.abs(x-o.x)<o.w/2+0.32&&Math.abs(z-o.z)<o.d/2+0.32);
  const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!collide(nx,p.z))p.x=nx;if(!collide(p.x,nz))p.z=nz;
  p.x=Math.max(-22.8,Math.min(22.8,p.x));p.z=Math.max(-22.8,Math.min(22.8,p.z));
  let g=groundHeight(p.x,p.z,zone);for(const o of world)if(Math.abs(p.x-o.x)<o.w/2&&Math.abs(p.z-o.z)<o.d/2&&prevY>=o.h-0.05&&p.vy<=0)g=Math.max(g,o.h);if(p.y<=g){p.y=g;p.vy=0;}p.moving=Math.hypot(vx,vz)>0.1;p.sprint=!!input.sprint;
  return p;
}
