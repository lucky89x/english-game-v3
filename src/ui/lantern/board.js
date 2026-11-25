export const ink = '#172a3a', paper = '#ffeecb', gold = '#ffd075', mint = '#8de3bd';
// Source rectangles are in fractions of the illustrated sheet (two scenes above,
// a road below left and four card emblems below right). Load on the first play.
const frames = {
  forest: [0, 0, .5, .5], vault: [.5, 0, .5, .5], road: [.075, .5, .35, .5],
  key: [.5, .5, .25, .25], potion: [.75, .5, .25, .25],
  shield: [.5, .75, .25, .25], bat: [.75, .75, .25, .25]
};
let sheet;
export function art(c,frame,x=0,y=0,w=560,h=560) {
  if(!sheet && typeof Image !== 'undefined') {
    sheet = new Image();
    sheet.src = new URL('../../../assets/ui/lantern_fair.webp',import.meta.url).href;
  }
  if(!sheet?.naturalWidth) return false;
  const [sx,sy,sw,sh] = frames[frame], iw=sheet.naturalWidth, ih=sheet.naturalHeight;
  c.drawImage(sheet,sx*iw+1,sy*ih+1,sw*iw-2,sh*ih-2,x,y,w,h);
  return true;
}
export function panel(c,x,y,w,h,color,r=15,stroke=null) {
  c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=color; c.fill();
  if(stroke){ c.lineWidth=2; c.strokeStyle=stroke; c.stroke(); }
}
export function oval(c,x,y,rx,ry,color,rot=0) {
  c.beginPath(); c.ellipse(x,y,rx,ry,rot,0,Math.PI*2); c.fillStyle=color; c.fill();
}
export function label(c,text,x,y,size=20,color=paper,width=520,weight=700) {
  c.save(); c.font=weight+' '+size+'px "Trebuchet MS", system-ui, sans-serif';
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=color;
  c.fillText(String(text),x,y,width); c.restore();
}
export function lines(c,text,x,y,width,size=19,color=ink) {
  c.save(); c.font='600 '+size+'px "Trebuchet MS",system-ui,sans-serif';
  let line=''; const rows=[];
  for(const word of text.split(' ')){
    const next=line?line+' '+word:word;
    if(line && c.measureText(next).width>width){rows.push(line);line=word;}else line=next;
  }
  rows.push(line); rows.forEach((s,i)=>label(c,s,x,y+i*(size+5),size,color,width,600)); c.restore();
}
export function button(c,x,y,w,h,caption,fill=mint){
  panel(c,x,y+3,w,h,'#142431',12);panel(c,x,y,w,h,fill,12);
  label(c,caption,x+w/2,y+h/2,18,ink,w-14);
}
export function backdrop(c,a,b,t=0){
  const ramp=c.createLinearGradient(0,0,0,560);ramp.addColorStop(0,a);ramp.addColorStop(1,b);
  c.fillStyle=ramp;c.fillRect(0,0,560,560);
  for(let i=0;i<34;i++){const x=(i*113)%560,y=(i*73)%560;oval(c,x,y+3*Math.sin(t+i),1.5,1.5,'#ffffff40');}
}
export function shuffle(array,rnd){
  const a=[...array]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
const fallback=[
  ['lamp','đèn'],['boat','thuyền'],['fish','cá'],['star','ngôi sao'],['leaf','chiếc lá'],['desk','bàn học']
].map(([word,vi])=>({word,vi}));
export function deck(cards,rnd){
  const seen=new Set(),meanings=new Set(),out=[];
  for(const c of [...shuffle(cards||[],rnd),...fallback]){
    if(!c?.word || !c.vi || seen.has(c.word) || meanings.has(c.vi))continue;
    out.push(c);seen.add(c.word);meanings.add(c.vi);
  }
  return out;
}
export function neighbours(a,b){
  return a!==b && Math.abs(a%5-b%5)<=1 && Math.abs(Math.floor(a/5)-Math.floor(b/5))<=1;
}
// Success returns through the village's existing reward/save pipeline. A failed run
// stays on the board so retrying or leaving cannot consume a paid play.
export function session(id,title,help,reset,play) {
  let state=reset(),end=null,claim=false;
  const finish=(won,summary,score,words=[])=>{
    if(end)return;
    end={won,summary,score,words:words.filter(c=>c.id)};
  };
  const act=()=>{if(end.won)claim=true;else{state=reset();end=null;}};
  return {
    title,help,directTouch:true,info:()=>end?'':play.info(state),
    update(dt,held){if(!end)play.update?.(state,Math.min(.12,dt),held,finish);},
    click(x,y){if(end){if(x>=148&&x<=412&&y>=326&&y<=387)act();}else play.click?.(state,x,y,finish);},
    key(code){if(end){if(code==='Enter'||code==='Space')act();}else play.key?.(state,code,finish);},
    down(x,y){if(!end)play.down?.(state,x,y,finish);},drag(x,y){if(!end)play.drag?.(state,x,y,finish);},
    up(x,y){if(!end)play.up?.(state,x,y,finish);},
    draw(c,w,h,t){
      c.save();try{
        play.draw(state,c,t);
        if(end){
          c.fillStyle='#10202bca';c.fillRect(0,0,w,h);
          panel(c,43,158,474,252,paper,22);
          label(c,end.won?'Hoàn thành!':'Thử một đường khác',280,211,32,ink);
          lines(c,end.summary,280,264,416,20);
          button(c,148,326,264,61,end.won?'Nhận thưởng':'Chơi lại',end.won?mint:gold);
        }
      }finally{c.restore();}
    },
    done(){return claim?{id,score:end.score,gold:Math.min(22,6+Math.floor(end.score/12)),exp:Math.min(32,10+Math.floor(end.score/9)),text:end.summary,words:end.words}:null;}
  };
}

