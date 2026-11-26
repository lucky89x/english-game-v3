
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
    polygon(c,[[.12,-.47],[-.36,.14],[-.04,.14],[-.18,.62],[.39,-.04],[.05,-.04]],'#e4ffb4');
    c.restore();return;
  }
  const palette=kind==='rock'?['#636879','#919ba5','#b3bdc3','#434956']:kind==='gem'?['#286f82','#73d3d9','#c7fcf1','#337eaa']:['#b56b21','#efa83c','#ffe29a','#7e451e'];
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
  c.save();c.translate(280,150);c.rotate(t);
  c.strokeStyle='#f1bd71';c.lineWidth=3;c.beginPath();c.arc(0,0,13,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(-10,0);c.lineTo(10,0);c.moveTo(0,-10);c.lineTo(0,10);c.stroke();c.restore();
  const x=280+Math.sin(angle)*length,y=176+Math.cos(angle)*length;
  c.strokeStyle='#392b29';c.lineWidth=6;c.beginPath();c.moveTo(280,150);c.lineTo(280,176);c.lineTo(x,y);c.stroke();
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
export function mountainMinerV2(cards=[],rnd=Math.random) {
  const pool=vocabulary(cards), supplied=cards.some(c=>c?.word&&c?.vi);
  const sound=makeSound(), goals=[140,160,180];
  let s, round=0, total=0, words=[];
  function reset(){
    s={boost:false, stamina:75, capacity:100, spin:0, time:65,score:0,phase:'ready',angle:0,length:22,t:0,load:null,quiz:null,words:[],end:null,claim:false,paused:false,note:'Canh hướng móc rồi chạm Thả móc.',objects:[]};
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const bagCol=[1,3,2][round];
      if(row===0&&col===bagCol)continue;
      const kind=row===1&&col===bagCol?'strength':row===0||row===1&&col%2===0?'gold':rnd()<.38?'rock':rnd()<.42?'gem':'gold';
      const seed=rnd();
      s.objects.push({x:70+105*col+(rnd()-.5)*12,y:kind==='strength'?305:245+84*row,kind,seed,r:kind==='strength'?18:kind==='gem'?15:16+seed*(kind==='rock'?17:14),taken:false});
    }
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
    if(y>=500&&y<=550&&x>=490){sound.toggle();return;}
    if(s.end){if(x>=120&&x<=440&&y>=320&&y<=375){if(s.score<goals[round]){round=0;total=0;words=[];reset();}else if(round===2)s.claim=true;else{total+=s.score;round++;reset();}}return;}
    if(s.quiz){if(x>=35&&x<=525&&y>=275&&y<455&&(y-275)%60<50)answer(Math.floor((y-275)/60));return;}
    if(y<500||y>550)return;
    if(x<125)s.paused=!s.paused;
    else if(x>=365&&x<480&&s.phase==='back'&&!s.paused){s.load=null;s.note='Đã thả vật nặng.';}
    else if(x>=132&&x<=352&&s.phase==='ready'&&!s.paused){s.phase='out';sound.play('launch');}
  }
  return {
    title:'Mỏ vàng sương núi',help:'Qua 3 vòng. Canh càng kẹp và kéo túi sức mạnh để tăng thể lực, kéo nhanh gấp ba.',directTouch:true,
    info:()=>Math.ceil(s.time)+' giây · '+s.score+'/'+goals[round],
    click,down(){},drag(){},up(){},
    key(code){
      sound.activate();
      if(code==='KeyM'){sound.toggle();return;}
      if(code==='Enter'&&s.end)click(280,345);
      else if(s.quiz&&/^Digit[1-3]$/.test(code))answer(Number(code.at(-1))-1);
      else if(code==='Space'||code==='ArrowDown')click(280,522);
      else if(code==='KeyP')click(60,522);
    },
    update(dt){
      if(s.end||s.quiz||s.paused||!Number.isFinite(dt)||dt<=0)return;
      let left=Math.min(dt,1);
      while(left>0&&!s.end&&!s.quiz){
        const step=Math.min(.016,left);left-=step;s.time=Math.max(0,s.time-step);s.t+=step;
        if(s.phase==='ready'){s.angle=Math.sin(s.t*1.25)*1.08;s.stamina=Math.min(s.capacity,s.stamina+step*16);}
        if(s.phase==='out'){
          s.length+=255*step;s.spin+=7*step;
          const x=280+Math.sin(s.angle)*s.length,y=176+Math.cos(s.angle)*s.length;
          const hit=s.objects.find(o=>!o.taken&&Math.hypot(o.x-x,o.y-y)<o.r+7);
          if(hit){hit.taken=true;s.load=hit;s.phase='back';sound.play('grab');}
          if(x<15||x>545||y>475)s.phase='back';
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
              s.score+=o.kind==='rock'?5:o.kind==='gem'?58:Math.round(17+o.r);
              s.note=o.kind==='rock'?'Đá nặng vừa lên giỏ.':'Quặng đã lên giỏ.';
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
        box(c,10,465,540,30,'#142534ec');label(c,s.note,280,480,16);
        for(const [x,width,title,color] of [[12,104,s.paused?'Tiếp tục':'Dừng','#d6e1d9'],[132,220,'Thả móc','#f8cb76'],[365,113,'Nhả vật','#d6e1d9'],[490,58,sound.muted()?'Im':'Loa','#d6e1d9']]){
          box(c,x,502,width,45,color);label(c,title,x+width/2,525,18,'#24333d');
        }
        if(s.paused){box(c,100,215,360,95,'#142b3f');label(c,'Đang tạm dừng',280,262,28);}
        if(s.quiz){
          box(c,18,177,524,299,'#142b3f');label(c,'TÚI TỪ · đồng hồ tạm dừng',280,207,18,'#99dfc8');label(c,s.quiz.card.vi,280,246,24,'#fff1ce',475);
          s.quiz.options.forEach((v,i)=>{box(c,35,275+i*60,490,50,'#ecd6ad');label(c,v.word,280,300+i*60,21,'#233d46',460);});
        }
        if(s.end){c.fillStyle='#142b3fed';c.fillRect(0,0,560,560);label(c,s.end,280,235,23);label(c,s.score+' điểm',280,280,26);box(c,120,320,320,55,'#efca7e');label(c,s.score<goals[round]?'Chơi lại':round===2?'Nhận thưởng':'Vòng tiếp theo',280,348,23,'#233d46');}
      }finally{c.restore();}
    }
  };
}

