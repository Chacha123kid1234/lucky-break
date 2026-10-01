export function money(value) {
  const n=BigInt(value??0), sign=n<0n?'-':'',v=n<0n?-n:n;
  const units=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
  let unit=0,scale=1n; while(v>=scale*1000n){scale*=1000n;unit++;}
  if(!unit)return `${sign}$${v}`;
  const tenth=v*10n/scale;
  return `${sign}$${tenth/10n}${tenth%10n?'.'+tenth%10n:''}${units[unit]??'e'+unit*3}`;
}
export const multiply=(amount,multiplier)=>BigInt(amount)*BigInt(Math.round(multiplier*10000))/10000n;
export function parseMoney(value){ if(!/^\d{1,90}$/.test(String(value)))throw Error('INVALID_AMOUNT');return BigInt(value); }
