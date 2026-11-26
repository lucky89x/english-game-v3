
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
export function mountainMiner(cards=[],rnd=Math.random) {
  const pool=vocabulary(cards), supplied=cards.some(c=>c?.word&&c?.vi);
  let s;
  function reset(){
    s={time:65,score:0,phase:'ready',angle:0,length:22,t:0,load:null,quiz:null,words:[],end:null,claim:false,paused:false,note:'Canh hướng móc rồi chạm Thả móc.',objects:[]};
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const kind=row===0?'gold':rnd()<.28?'rock':rnd()<.35?'gem':'gold';
      s.objects.push({x:70+105*col+(rnd()-.5)*12,y:235+94*row+(rnd()-.5)*12,kind,r:kind==='rock'?25:21,taken:false});
    }
  }
  reset();
  function finish(){s.end=s.score>=180?'Đã thu đủ quặng!':'Hết giờ. Thử chọn quặng nhẹ hơn nhé.';s.quiz=null;}
  function answer(i){
    const q=s.quiz;if(!q?.options[i])return;
    s.note=q.card.word+' = '+q.card.vi;
    if(q.options[i].word===q.card.word){s.score+=15;s.note+=' · +15';}
    s.quiz=null;s.phase='ready';if(s.score>=180)finish();
  }
  function click(x,y){
    if(s.end){if(x>=120&&x<=440&&y>=320&&y<=375){if(s.score>=180)s.claim=true;else reset();}return;}
    if(s.quiz){if(x>=35&&x<=525&&y>=275&&y<455&&(y-275)%60<50)answer(Math.floor((y-275)/60));return;}
    if(y<500||y>550)return;
    if(x<125)s.paused=!s.paused;
    else if(x>410&&s.phase==='back'){s.load=null;s.note='Đã thả vật nặng.';}
    else if(x>=140&&x<=395&&s.phase==='ready'&&!s.paused)s.phase='out';
  }
  return {
    title:'Mỏ vàng sương núi',help:'Thu 180 điểm trong 65 giây. Canh móc để kéo vàng, tránh đá. Giải túi từ để thêm điểm.',directTouch:true,
    info:()=>Math.ceil(s.time)+' giây · '+s.score+'/180',
    click,down(){},drag(){},up(){},
    key(code){
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
        if(s.phase==='ready')s.angle=Math.sin(s.t*1.25)*1.08;
        if(s.phase==='out'){
          s.length+=235*step;
          const x=280+Math.sin(s.angle)*s.length,y=151+Math.cos(s.angle)*s.length;
          const hit=s.objects.find(o=>!o.taken&&Math.hypot(o.x-x,o.y-y)<o.r+7);
          if(hit){hit.taken=true;s.load=hit;s.phase='back';}
          if(x<15||x>545||y>475)s.phase='back';
        }
        if(s.phase==='back'){
          const speed=s.load?.kind==='rock'?52:s.load?.kind==='gold'?103:200;
          s.length=Math.max(22,s.length-speed*step);
          if(s.length===22){
            if(s.load){
              s.score+=s.load.kind==='rock'?5:s.load.kind==='gem'?60:35;s.load=null;
              if(s.score>=180)finish();
              else{
                const card=pool[s.words.length%pool.length];s.words.push(card);
                s.quiz={card,options:shuffle([card,...shuffle(pool.filter(v=>v.vi!==card.vi),rnd).slice(0,2)],rnd)};
              }
            }
            s.phase='ready';
          }
        }
        if(s.time<=0&&!s.end)finish();
      }
    },
    done:()=>s.claim?{id:'mountain_miner',score:s.score,text:s.end,words:[...s.words]}:null,
    draw(c,w,h){
      c.save();
      try{
        c.scale(w/560,h/560);c.fillStyle='#1b3446';c.fillRect(0,0,560,560);
        c.fillStyle='#4f7481';c.beginPath();c.moveTo(0,165);c.lineTo(130,62);c.lineTo(225,145);c.lineTo(365,40);c.lineTo(560,170);c.fill();
        box(c,0,178,560,315,'#604535');
        for(let i=0;i<38;i++){c.strokeStyle='#805c40';c.beginPath();const x=i*83%560,y=198+i*43%280;c.moveTo(x,y);c.lineTo(x+24,y-8);c.stroke();}
        box(c,16,12,528,65,'#142b3f');label(c,'MỎ VÀNG SƯƠNG NÚI',280,35,25);label(c,Math.ceil(s.time)+' giây · '+s.score+'/180',280,62,16,'#99dfc8');
        if(!supplied)label(c,'Unit chưa được soạn · luyện từ cơ bản',280,92,13);
        box(c,254,109,52,47,'#efbd5a');label(c,'⚙',280,133,30,'#4f3a28');
        c.fillStyle='#9d774c';c.fillRect(218,158,124,17);
        for(const o of s.objects){
          if(o.taken)continue;
          c.fillStyle=o.kind==='rock'?'#899392':o.kind==='gem'?'#91e3e4':'#ebbf55';
          c.beginPath();
          for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=o.r*(i%2?.83:1);c[i?'lineTo':'moveTo'](o.x+Math.cos(a)*r,o.y+Math.sin(a)*r);}
          c.closePath();c.fill();label(c,o.kind==='rock'?'5':o.kind==='gem'?'60':'35',o.x,o.y,13,'#2c3e43');
        }
        const hx=280+Math.sin(s.angle)*s.length,hy=151+Math.cos(s.angle)*s.length;
        c.strokeStyle='#dec798';c.lineWidth=3;c.beginPath();c.moveTo(280,151);c.lineTo(hx,hy);c.stroke();
        c.strokeStyle='#d7e2db';c.lineWidth=5;c.beginPath();c.arc(hx,hy,12,0,Math.PI);c.stroke();
        if(s.load){c.fillStyle=s.load.kind==='rock'?'#899392':s.load.kind==='gem'?'#91e3e4':'#ebbf55';c.beginPath();c.arc(hx,hy+15,17,0,Math.PI*2);c.fill();}
        box(c,10,460,540,32,'#193447');label(c,s.note,280,476,15);
        for(const [x,width,t] of [[12,110,s.paused?'Tiếp tục':'Dừng'],[142,253,'Thả móc'],[413,135,'Thả vật']]){box(c,x,501,width,44,'#efca7e');label(c,t,x+width/2,523,18,'#233d46');}
        if(s.paused){box(c,100,215,360,95,'#142b3f');label(c,'Đang tạm dừng',280,262,28);}
        if(s.quiz){
          box(c,18,177,524,299,'#142b3f');label(c,'TÚI TỪ · đồng hồ tạm dừng',280,207,18,'#99dfc8');label(c,s.quiz.card.vi,280,246,24,'#fff1ce',475);
          s.quiz.options.forEach((v,i)=>{box(c,35,275+i*60,490,50,'#ecd6ad');label(c,v.word,280,300+i*60,21,'#233d46',460);});
        }
        if(s.end){c.fillStyle='#142b3fed';c.fillRect(0,0,560,560);label(c,s.end,280,235,23);label(c,s.score+' điểm',280,280,26);box(c,120,320,320,55,'#efca7e');label(c,s.score>=180?'Nhận thưởng':'Chơi lại',280,348,23,'#233d46');}
      }finally{c.restore();}
    }
  };
}
