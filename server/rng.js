import { createHash,randomBytes } from 'node:crypto';
export class RNG {
  constructor(seed){this.state=createHash('sha256').update(String(seed)).digest().readUInt32LE(0)||1;}
  next(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state/4294967296;}
  int(n){return Math.floor(this.next()*n);}
  pick(list){return list[this.int(list.length)];}
  shuffle(list){let a=[...list];for(let i=a.length-1;i>0;i--){let j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
}
export const seed=()=>randomBytes(16).toString('hex');
export const subSeed=(master,...parts)=>createHash('sha256').update([master,...parts].join(':')).digest('hex');
