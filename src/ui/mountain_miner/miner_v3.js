
let scene;
function paintScene(c) {
  if(!scene&&typeof Image!=='undefined'){
    scene=new Image();
    scene.src=new URL('../../../assets/ui/mountain_miner_v2.webp',import.meta.url).href;
  }
  if(scene?.naturalWidth){c.drawImage(scene,0,0,560,560);return;}
  c.fillStyle='#6d9bae';c.fillRect(0,0,560,185);
  c.fillStyle='#47465b';c.fillRect(0,185,560,375);
  box(c,0,174,560,14,'#a86940');
  box(c,246,118,69,57,'#875036');
  box(c,355,132,49,41,'#4e6960');box(c,345,169,64,10,'#624735');
  c.fillStyle='#edba86';c.beginPath();c.arc(378,117,21,0,Math.PI*2);c.fill();
  box(c,353,96,50,14,'#55754b');box(c,310,133,55,15,'#eeac67');
}
function polygon(c, points, fill) {
  c.beginPath();points.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x,y));
  c.closePath();c.fillStyle=fill;c.fill();
}
function drawObject(c,o,x,y,t) {
  const {kind,r,seed}=o;
  c.save();c.translate(x,y);c.scale(r,r);
  c.fillStyle='#18152264';c.beginPath();c.ellipse(.1,.68,1.03,.31,0,0,Math.PI*2);c.fill();
  if(kind==='strength'){
    c.shadowColor='#a9fab1';c.shadowBlur=18;
    polygon(c,[[-.31,-.77],[.36,-.77],[.71,-.2],[.83,.52],[.5,.85],[-.5,.84],[-.83,.5],[-.68,-.22]],'#487359');
    c.shadowBlur=0;
    polygon(c,[[-.54,-1],[0,-.84],[.53,-1],[.36,-.67],[-.36,-.67]],'#e9d69f');
    polygon(c,[[-.4,-.72],[.4,-.72],[.4,-.58],[-.4,-.58]],'#d9ae69');
    c.lineWidth=.075;c.setLineDash([.1,.09]);c.strokeStyle='#edd69b';
    c.beginPath();c.ellipse(0,.15,.64,.54,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
    c.fillStyle='#204b44';c.beginPath();c.arc(0,.15,.43,0,Math.PI*2);c.fill();
    polygon(c,[[.12,-.27],[-.28,.18],[-.02,.18],[-.12,.53],[.30,.02],[.04,.02]],'#e4ffb4');
    polygon(c,[[-.4,-.62],[-1,-.69],[-.78,-.43],[-.35,-.53]],'#f7bf78');
    c.restore();return;
  }
  const palette=kind==='rock'?['#636879','#919ba5','#b3bdc3','#434956']:kind==='gem'?['#286f82','#73d3d9','#c7fcf1','#337eaa']:['#b56b21','#efa83c','#ffe29a','#7e451e'];
  if(kind==='gem'){
    const a=[-.95,-.34],b=[-.54,-.77],d=[.54,-.77],e=[.95,-.34],tip=[0,.81];
    polygon(c,[a,b,d,e,tip],'#79e7ef');
    polygon(c,[a,[-.32,-.34],tip],'#2785b2');
    polygon(c,[e,[.31,-.34],tip],'#399ec8');
    polygon(c,[b,[-.32,-.34],[.31,-.34],d],'#c9ffff');
    polygon(c,[[-.32,-.34],[.31,-.34],tip],'#61cbe9');
    c.restore();return;
  }
  const rim=Array.from({length:7},(_,i)=>{
    const a=i*2*Math.PI/7+seed,rr=.79+.21*Math.sin(i*9+seed*14)**2;
    return [Math.cos(a)*rr,Math.sin(a)*rr*.83];
  });
  polygon(c,rim,palette[0]);
  rim.forEach((p,i)=>polygon(c,[p,rim[(i+1)%rim.length],[-.16,-.19]],palette[[1,0,3,3,1,2,2][i]]));
  if(kind!=='rock'&&Math.sin(t*4+seed*20)>.66){
    polygon(c,[[-.42,-.56],[-.32,-.74],[-.26,-.56],[-.08,-.48],[-.26,-.41],[-.32,-.25],[-.4,-.41],[-.56,-.48]],'#fff9df');
  }
  c.restore();
}
function drawWinch(c,angle,length,closed,t) {
  c.save();c.translate(280,originY);c.rotate(t);
  c.strokeStyle='#f1bd71';c.lineWidth=3;c.beginPath();c.arc(0,0,13,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(-10,0);c.lineTo(10,0);c.moveTo(0,-10);c.lineTo(0,10);c.stroke();c.restore();
  const x=280+Math.sin(angle)*length,y=originY+Math.cos(angle)*length;
  c.strokeStyle='#392b29';c.lineWidth=6;c.beginPath();c.moveTo(280,originY);c.lineTo(x,y);c.stroke();
  c.strokeStyle='#e5b776';c.lineWidth=2.5;c.stroke();
  c.save();c.translate(x,y);c.rotate(-angle);
  const steel=c.createLinearGradient(-18,0,20,16);steel.addColorStop(0,'#638293');steel.addColorStop(.48,'#f0f4e3');steel.addColorStop(1,'#5c728b');
  polygon(c,[[-5,-13],[5,-13],[10,-3],[5,5],[-5,5],[-10,-3]],'#384958');
  for(const side of [-1,1]){
    c.save();c.scale(side,1);c.rotate(closed?-.28:.19);
    c.beginPath();c.moveTo(5,-4);c.bezierCurveTo(18,-2,22,10,15,18);c.lineTo(6,24);c.lineTo(8,14);c.bezierCurveTo(12,8,10,4,4,4);c.closePath();
    c.lineWidth=2;c.strokeStyle='#252e38';c.stroke();c.fillStyle=steel;c.fill();c.restore();
  }
  c.fillStyle='#efbf70';c.beginPath();c.arc(0,0,3.5,0,Math.PI*2);c.fill();c.restore();
  return [x,y];
}
function makeSound() {
  let ctx, muted=false, tick=0;
  function activate(){
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio||muted)return;
    try{ctx??=new Audio();if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}
  }
  function play(type){
    if(muted||ctx?.state!=='running')return;
    const notes={launch:[440,235],grab:[150,225],reel:[112],ore:[490,660],strength:[392,523,659,784],correct:[523,659,784],win:[523,659,784,1046],wrong:[246,196]};
    notes[type].forEach((hz,i)=>{
      const at=ctx.currentTime+i*.075,o=ctx.createOscillator(),g=ctx.createGain();
      o.type=['reel','grab'].includes(type)?'triangle':'sine';o.frequency.value=hz;
      g.gain.setValueAtTime(.001,at);g.gain.linearRampToValueAtTime(type==='reel'?.017:.055,at+.012);
      g.gain.exponentialRampToValueAtTime(.001,at+.12);o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+.13);
    });
  }
  return {activate,play,muted:()=>muted,toggle(){muted=!muted;activate();},reel(t){
    if(t>=tick||t<tick-.5){tick=t+.16;play('reel');}
  }};
}

export function vocabulary(cards=[]) {
  const seen=new Set(), meanings=new Set(), out=[];
  const basic=[['gold','vàng'],['stone','đá'],['rope','dây'],['lamp','đèn'],['bag','túi'],['mountain','núi']];
  for(const c of [...cards,...basic.map(([word,vi])=>({id:'miner_basic:'+word,word,vi}))]) {
    if(typeof c?.word!=='string'||typeof c.vi!=='string')continue;
    const word=c.word.trim(),vi=c.vi.trim(),a=word.toLowerCase(),b=vi.toLowerCase();
    if(!a||!b||seen.has(a)||meanings.has(b))continue;
    seen.add(a);meanings.add(b);out.push({...c,word,vi});
  }
  return out;
}
function shuffle(a,rnd) {
  a=[...a];
  for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(rnd()*(i+1))));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function box(c,x,y,w,h,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();}
function label(c,t,x,y,size=20,color='#ffedc4',width=520){
  c.font='700 '+size+'px system-ui';c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y,width);
}

const originY=132;
const largestGold=50;
export function vein(round,rnd,diamondRound) {
  const shift=(rnd()-.5)*.13, mirror=rnd()<.5?-1:1;
  const angles=[-.94,-.64,-.39,-.10,.20,.48,.78,.98]
    .map(angle=>mirror*(angle+shift+(rnd()-.5)*.035));
  const protectedIndex=[2,4,5][round];
  const bagIndex=[5,1,3][round];
  const objects=[];
  function put(kind,index,distance,radius){
    const angle=angles[index];
    objects.push({kind,r:radius,seed:rnd(),x:280+Math.sin(angle)*distance,y:originY+Math.cos(angle)*distance,taken:false});
  }
  angles.forEach((_,index)=>{
    if(index===bagIndex){
      put('strength',index,275+rnd()*27,21);return;
    }
    if(index===protectedIndex){
      put('rock',index,190+rnd()*27,28);
      put('gold',index,345+rnd()*15,33);return;
    }
    if(index===1||index===6){
      put('rock',index,226+rnd()*44,15+rnd()*10);
      if(index===6&&round===diamondRound)put('gem',index,Math.min(354,248/Math.abs(Math.sin(angles[index]))),17);
      else put('gold',index,306+rnd()*30,17+rnd()*9);
      return;
    }
    const distance=248+rnd()*89;
    put('gold',index,Math.min(distance,241/Math.max(.01,Math.abs(Math.sin(angles[index])))),17+rnd()*12);
  });
  return objects;
}
export function castTarget(objects,angle){
  const dx=Math.sin(angle),dy=Math.cos(angle);
  const edge=Math.min(418/dy,dx===0?Infinity:270/Math.abs(dx));
  let length=edge, object=null;
  for(const o of objects){
    if(o.taken)continue;
    const x=o.x-280,y=o.y-originY;
    const along=x*dx+y*dy, perpendicular=x*dy-y*dx;
    const radius=o.r+3;
    if(Math.abs(perpendicular)>=radius||along<0)continue;
    const entry=along-Math.sqrt(radius*radius-perpendicular*perpendicular);
    if(entry>=22&&entry<length){length=entry;object=o;}
  }
  return {length,object};
}

export function mountainMinerV3(cards=[],rnd=Math.random) {
  const pool=vocabulary(cards), supplied=cards.some(c=>c?.word&&c?.vi);
  const sound=makeSound(), goals=[140,160,180];
  let s, round=0, total=0, words=[], diamondRound=Math.floor(rnd()*3);
  function reset(){
    s={boost:false, stamina:75, capacity:100, spin:0, time:65,score:0,phase:'ready',angle:0,length:22,t:0,load:null,quiz:null,words:[],end:null,claim:false,note:'Nhấp hoặc chạm để phóng móc.',objects:vein(round,rnd,diamondRound), sparks:[]};
  }
  reset();
  function finish(){s.end=s.score<goals[round]?'Hết giờ':round===2?'Đã qua ba vòng!':'Đã đủ quặng!';sound.play(round===2&&s.score>=goals[round]?'win':s.score>=goals[round]?'ore':'wrong');s.quiz=null;}
  function answer(i){
    const q=s.quiz;if(!q?.options[i])return;
    sound.play(q.options[i].word===q.card.word?'correct':'wrong');
    s.note=q.card.word+' = '+q.card.vi;
    if(q.options[i].word===q.card.word){s.score+=15;s.note+=' · +15';}
    s.quiz=null;s.phase='ready';if(s.score>=goals[round])finish();
  }
  function click(x,y){
    sound.activate();
    if(y>=43&&y<=70&&x>=485){sound.toggle();return;}
    if(s.end){if(x>=120&&x<=440&&y>=320&&y<=375){if(s.score<goals[round]){round=0;total=0;words=[];diamondRound=Math.floor(rnd()*3);reset();}else if(round===2)s.claim=true;else{total+=s.score;round++;reset();}}return;}
    if(s.quiz){if(x>=35&&x<=525&&y>=275&&y<455&&(y-275)%60<50)answer(Math.floor((y-275)/60));return;}
    if(s.phase==='ready'){
      s.cast=castTarget(s.objects,s.angle);
      s.phase='out';sound.play('launch');
    }
  }
  return {
    title:'Mỏ vàng sương núi',help:'Nhấp chuột trái hoặc chạm để phóng móc. Dọn đá để mở đường tới vàng. Kim cương đáng gấp đôi cục vàng lớn nhất.',directTouch:true,
    info:()=>Math.ceil(s.time)+' giây · '+s.score+'/'+goals[round],
    click,down(){},drag(){},up(){},
    key(code){
      sound.activate();
      if(code==='KeyM'){sound.toggle();return;}
      if(code==='Enter'&&s.end)click(280,345);
      else if(s.quiz&&/^Digit[1-3]$/.test(code))answer(Number(code.at(-1))-1);
      else if(!s.end&&!s.quiz&&(code==='Space'||code==='ArrowDown'))click(280,400);
    },
    update(dt){
      if(s.end||s.quiz||!Number.isFinite(dt)||dt<=0)return;
      let left=Math.min(dt,1);
      while(left>0&&!s.end&&!s.quiz){
        const step=Math.min(.016,left);left-=step;s.time=Math.max(0,s.time-step);s.t+=step;
        for(const particle of s.sparks)particle.age+=step;
        s.sparks=s.sparks.filter(p=>p.age<.48);
        if(s.phase==='ready'){s.angle=Math.sin(s.t*1.25)*1.08;s.stamina=Math.min(s.capacity,s.stamina+step*16);}
        if(s.phase==='out'){
          s.length=Math.min(s.cast.length,s.length+270*step);s.spin+=7*step;
          if(s.length===s.cast.length){
            const hit=s.cast.object;
            if(hit){
              hit.taken=true;s.load=hit;sound.play('grab');
              s.sparks=Array.from({length:9},(_,i)=>({x:hit.x,y:hit.y,a:i*2.4,age:0,color:hit.kind==='rock'?'#d5c7b2':hit.kind==='gem'?'#a6f9ff':'#ffe098'}));
            }
            s.phase='back';
          }
        }
        if(s.phase==='back'){
          const base=s.load?.kind==='rock'?75-s.load.r:s.load?.kind==='gold'?167-2*s.load.r:190;
          const speed=base*(s.boost?3:1)*(s.stamina===0?.7:1);
          if(s.load)s.stamina=Math.max(0,s.stamina-step*(s.load.kind==='rock'?14:8));
          sound.reel(s.t);s.spin-=step*speed/19;
          s.length=Math.max(22,s.length-speed*step);
          if(s.length===22){
            if(s.load?.kind==='strength'){
              s.boost=true;s.capacity=150;s.stamina=150;s.load=null;
              s.note='Túi sức mạnh · đầy thể lực và kéo ×3 đến hết vòng';sound.play('strength');
            }else if(s.load){
              const o=s.load;s.load=null;sound.play('ore');
              s.score+=o.kind==='rock'?5:o.kind==='gem'?largestGold*2:Math.round(17+o.r);
              s.note=o.kind==='rock'?'Đã dọn tảng đá.':o.kind==='gem'?'Kim cương! Giá trị gấp đôi vàng lớn nhất.':'Quặng đã lên giỏ.';
              if(s.score>=goals[round])finish();
              else if(o.kind!=='rock'){
                const card=pool[words.length%pool.length];words.push(card);
                s.quiz={card,options:shuffle([card,...shuffle(pool.filter(v=>v.vi!==card.vi),rnd).slice(0,2)],rnd)};
              }
            }
            s.phase='ready';
          }
        }
        if(s.time<=0&&!s.end)finish();
      }
    },
    done:()=>s.claim?{id:'mountain_miner',score:total+s.score,text:s.end,words:[...new Map(words.map(c=>[c.word,c])).values()]}:null,
    draw(c,w,h,t=0){
      c.save();
      try{

        c.scale(w/560,h/560);paintScene(c);
        box(c,12,12,536,60,'#142534ec');
        label(c,'Vòng '+(round+1)+' / 3',83,31,19);
        label(c,s.score+' / '+goals[round]+' điểm',281,31,21);
        label(c,Math.ceil(s.time)+' giây',480,31,19);
        label(c,s.boost?'Thể lực · Kéo ×3':'Thể lực',91,54,14,'#b7efbc');
        box(c,157,49,248,10,'#334856');
        if(s.stamina>0)box(c,157,49,248*s.stamina/s.capacity,10,s.boost?'#bde88a':'#76ccaf');
        if(!supplied){box(c,14,82,233,25,'#142534de');label(c,'Unit chưa được soạn · Từ cơ bản',130,94,13);}
        for(const o of s.objects)if(!o.taken)drawObject(c,o,o.x,o.y,t);
        const [hx,hy]=drawWinch(c,s.angle,s.length,Boolean(s.load),s.spin);
        if(s.load)drawObject(c,s.load,hx+13*Math.sin(s.angle),hy+14*Math.cos(s.angle),t);
        for(const p of s.sparks){
          c.globalAlpha=Math.max(0,1-p.age/.48);c.fillStyle=p.color;
          c.beginPath();c.arc(p.x+Math.cos(p.a)*p.age*72,p.y+Math.sin(p.a)*p.age*60+p.age*p.age*90,2.4,0,Math.PI*2);c.fill();
        }
        c.globalAlpha=1;
        box(c,492,45,43,22,'#314652');
        label(c,sound.muted()?'🔇':'🔊',513,56,15);
        if(s.note!=='Nhấp hoặc chạm để phóng móc.'){
          box(c,25,523,510,29,'#142534d9');label(c,s.note,280,538,15);
        }
        if(s.quiz){
          box(c,18,177,524,299,'#142b3f');label(c,'TÚI TỪ · đồng hồ tạm dừng',280,207,18,'#99dfc8');label(c,s.quiz.card.vi,280,246,24,'#fff1ce',475);
          s.quiz.options.forEach((v,i)=>{box(c,35,275+i*60,490,50,'#ecd6ad');label(c,v.word,280,300+i*60,21,'#233d46',460);});
        }
        if(s.end){c.fillStyle='#142b3fed';c.fillRect(0,0,560,560);label(c,s.end,280,235,23);label(c,s.score+' điểm',280,280,26);box(c,120,320,320,55,'#efca7e');label(c,s.score<goals[round]?'Chơi lại':round===2?'Nhận thưởng':'Vòng tiếp theo',280,348,23,'#233d46');}
      }finally{c.restore();}
    }
  };
}


