// Rename the whole game here. Branding is never duplicated in presentation files.
export const BRAND = { title: 'LUCKY BREAK', tagline: 'GOOD FRIENDS. TERRIBLE ODDS.', resort: 'The Oddlight Resort' };
export const VERSION = '1.0.0';
export const TICK_RATE = 20;
export const MAX_PLAYERS = 6;
export const RECONNECT_MS = 120000;
export const STATES = ['LOBBY','PREPARING_DAY','TRAVELLING','CASINO','DAY_RESULTS','INTERMISSION','ENDING','GAME_OVER'];
export const BODY_PARTS = ['leftEye','rightEye','mouth','leftArm','rightArm','body'];
export const COLOURS = ['#ffba53','#ff6686','#7bdacb','#9891fa','#c4e078','#70b8f1','#ef89d7','#ff8858','#e4dcc6','#b9a3d6','#66b58e','#c48a65'];
export const RULE_DEFAULTS = { timer:true,shiftSeconds:300,difficulty:'Normal',startingBank:'1000',startingTickets:12,quotaMultiplier:1,playerCollision:true,voice:true,friendlyEffects:true,endless:false,seed:'',vote:'majority',autoEnd:false };
export const DIFFICULTIES = { Relaxed:0.8,Normal:1,Hard:1.25,Brutal:1.6,Custom:1 };
export const ECONOMY = { quotaCurve:[1.2,1.38,1.6,2,2.4,2.9,3.6,4.5,5.8,7.5,10,14],minBet:1,maxBetFraction:0.5,lossCover:0.2,hotHand:1.25,itemPriceGrowth:0.25,rewindSeconds:60,snapshotSeconds:3 };
export const GAMES = ['blackjack','roulette','slots','craps','fortune','ducks','moneywheel','penguin','keno','crash','hilo','plinko','tower','mines','poker','baccarat','cascade'];
export const ROULETTE_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
export const RED_NUMBERS=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
export const GAME_BALANCE={fortune:[0,0,0,0,0,0,0.5,0.5,0.5,1,1,1,1.5,1.5,2,2,3,3,5,10],moneywheel:[2,3,5,12],penguin:[1.2,1.5,2,3,5,10,25,50,200,1000],plinko:[24,10,5,2,1,0.5,0.2,1,2,5,10,24],cascade:[0,0.25,0.5,1,2,3,8,20],keno:{1:[0,3],2:[0,0,12],3:[0,0,2,45],4:[0,0,1,8,90],5:[0,0,0,3,15,150],6:[0,0,0,1,5,30,200],7:[0,0,0,0,3,10,60,300],8:[0,0,0,0,2,8,30,100,600],9:[0,0,0,0,1,4,12,50,150,800],10:[0,0,0,0,1,3,10,30,80,200,1000]}};
export const FLOORS = [
  { id:1,name:'floor.velvet',colours:['#392035','#d6ad62','#192d48'],games:['blackjack','roulette','slots','craps','ducks','fortune'],style:'lounge' },
  { id:2,name:'floor.neon',colours:['#1c143b','#ef61d4','#55e5ed'],games:['penguin','keno','crash','hilo','moneywheel','plinko'],style:'neon' },
  { id:3,name:'floor.dragon',colours:['#123e36','#f1be62','#ae3647'],games:['tower','mines','poker','craps','hilo','fortune','baccarat'],style:'palace' },
  { id:4,name:'floor.sky',colours:['#171d35','#e8dbc3','#6199ff'],games:GAMES,style:'sky' }
];
export const SOCKETS = Array.from({length:18},(_,i)=>({ x:(i%6-2.5)*6,z:(Math.floor(i/6)-1)*10,y:0,rotation:Math.floor(i/6)%2?Math.PI:0 }));
export const HUB_POINTS = {
  shuttle:{x:0,z:-18},items:{x:-14,z:-7},cosmetics:{x:14,z:-7},clinic:{x:14,z:7},exchange:{x:-14,z:7},challenge:{x:-6,z:-17},tickets:{x:6,z:-17},arcade:{x:19,z:15},photo:{x:-19,z:15},scoreboard:{x:0,z:17},bell:{x:8,z:16},bench:{x:-7,z:13},vending:{x:20,z:0}
};
export function floorForDay(day,endless=false) { return endless?Math.min(4,1+Math.floor((day-1)/3)):Math.min(4,Math.ceil(day/3)); }
export function quotaFor(day,start,rules=RULE_DEFAULTS) {
  const index=day-1, curve=ECONOMY.quotaCurve;
  const multiplier=(curve[index] ?? curve.at(-1))*(DIFFICULTIES[rules.difficulty]??1)*rules.quotaMultiplier;
  // Exponentiation uses bounded integer fixed point, preserving enormous banks.
  const base=BigInt(start), bp=BigInt(Math.round((index<curve.length?multiplier:curve.at(-1)*(DIFFICULTIES[rules.difficulty]??1)*rules.quotaMultiplier)*10000));
  let value=base*bp/10000n;
  if(index>=curve.length) for(let i=curve.length;i<=index;i++) value=value*14n/10n;
  return (value>0n?value:1n).toString();
}
export const ITEM_DEFS = [
 ['mercy',3,'active'],['chaos',3,'active'],['volt',4,'active'],['crate',4,'active'],['sun',4,'active'],['blaster',5,'active'],['juice',5,'active'],['rewind',6,'active'],['photo',6,'active'],['amplifier',6,'active'],['mic',6,'active'],['cover',7,'passive'],['guardian',7,'active'],['hot',7,'passive'],['stamp',8,'passive']
].map(([id,cost,kind],i)=>({id,cost,kind,icon:['↶','⚖','ϟ','▣','☀','⌁','◒','↺','◉','⌘','♫','▱','♜','♨','✉'][i],colour:COLOURS[i%12],name:`item.${id}`,description:`item.${id}.desc`}));
const cosmetics = {
 hat:['cowpoke','bucket','crown','beanie','chef','visor','saturn','traffic','teacup','mushroom'],
 eyes:['sleepy','stars','dots','winking'], mouth:['grin','oops','zigzag','smirk'],
 hair:['tuft','curl','mohawk','cloud'],face:['moustache','nose','freckles','patch'],
 glasses:['party','hearts','monocle','round','shades','spirals'],neck:['bow','chain','scarf','ruff'],
 shirt:['raincoat','dealer','hoodie','stripes','tux','stars'],back:['cape','pack','wings','clock'],novelty:['foam','antenna','pinwheel','balloon']
};
export const COSMETICS = Object.entries(cosmetics).flatMap(([category,names])=>names.map((name,i)=>({id:`${category}_${name}`,category,name:`cosmetic.${name}`,rarity:['COMMON','ODD','RARE','RIDICULOUS','LEGENDARY'][i%5],cost:3+(i%5)*4,shape:name})));
export const CHALLENGES = [
 ['red','roulette','colour',1,6],['spender',null,'wager',10,4],['roller',null,'large',1,5],['underdog','blackjack','under15',1,6],['perfect','blackjack','streak',4,8],['jackpot','slots','mult10',1,8],['opening','craps','opening',1,4],['streak',null,'streak',3,6],['duck','ducks','duck',1,5],['country','penguin','mult3',2,7],['spinner','moneywheel','wins',3,5],['drop','plinko','mult24',1,12],['greed','crash','mult10',1,8],['poker','poker','nohold',1,6],['mines','mines','mult20',1,10],['tower','tower','losses',3,5],['keno','keno','profit',2,6],['hilo','hilo','mult10',1,8],['baccarat','baccarat','wins',3,5],['cascade','cascade','mult8',1,9],['fortune','fortune','mult5',1,6],['variety',null,'variety',4,5],['patient','blackjack','push',2,5],['rocket','crash','mult2',3,5],['ice','penguin','wins',2,5],['green','roulette','zero',1,12],['point','craps','point',1,6],['net',null,'profit',3,7],['together',null,'players',2,5],['wheel','moneywheel','gold',1,7]
].map(([id,game,metric,target,reward])=>({id,game,metric,target,reward,name:`challenge.${id}`,description:`challenge.${id}.desc`}));
export const ACHIEVEMENTS = [
 'arrival','firstbet','firstwin','firstloss','quota1','floor2','floor3','floor4','day12','debtfree','finalwin','finalloss','endless15','bank10k','bank1m','bank1b','bank1t','allin','blackjack','roulettezero','slots10','crapsopen','fortune10','duckwin','penguin10','keno5','crash10','hilo10','plinko24','tower8','mines20','royal','baccarattie','cascade20','games17','win5','lose5','challenge1','challenge10','item1','item10','rewind','sacrifice','allparts','restore','fashion10','party6','basket','longbasket','dummybasket','fountain','bell','forbidden','ducksky','photo','elevator'
].map((id,i)=>({id,name:`achievement.${id}`,description:`achievement.${id}.desc`,icon:['✦','♜','◈','☄','♛'][i%5]}));
export const SECRETS = ['fountain','bell','forbidden','ducksky','photo','elevator','longbasket','dummybasket','spincrate','arcade','vending','parkour','checker','sunrise','poster'];
export const EMOTES = ['wave','dance','point','laugh','cry','clap','angry','celebrate','shocked','sit'];
