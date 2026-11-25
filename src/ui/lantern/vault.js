import {ink,paper,gold,mint,art,panel,oval,label,lines,button,backdrop,deck,shuffle,session} from './board.js';
const kinds={
  key:['Chìa khóa','#edbf61'], potion:['Bình hồi sức','#ec937f'],
  shield:['Khiên','#79d7bd'], bat:['Dơi canh cửa','#ad9adf']
};
function emblem(c,kind,x,y,a){
  c.save();c.translate(x,y);
  c.beginPath();c.roundRect(-39,-35,78,74,10);c.clip();
  if(art(c,kind,-39,-35,78,74)){c.restore();return;}
  if(kind==='key'){c.strokeStyle='#715229';c.lineWidth=9;c.beginPath();c.arc(-12,-7,11,0,Math.PI*2);c.stroke();panel(c,-4,-4,34,8,'#715229',3);panel(c,12,1,7,12,'#715229',2);panel(c,23,1,7,9,'#715229',2);}
  if(kind==='potion'){panel(c,-8,-21,16,18,'#67475e',3);oval(c,0,10,18,19,'#fff2cb');oval(c,0,12,14,13,'#ce5c70');oval(c,-6,6,4,5,'#ffcdb4');}
  if(kind==='shield'){c.fillStyle='#24736c';c.beginPath();c.moveTo(-21,-15);c.lineTo(0,-21);c.lineTo(21,-15);c.quadraticCurveTo(20,14,0,25);c.quadraticCurveTo(-20,14,-21,-15);c.fill();label(c,'✧',0,-1,25,paper);}
  if(kind==='bat'){for(const s of [-1,1]){c.save();c.scale(s,1);c.fillStyle='#533e73';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(14,-24+a,31,-16+a);c.quadraticCurveTo(25,-9,29,4);c.quadraticCurveTo(17,-3,15,12);c.lineTo(0,5);c.fill();c.restore();}oval(c,0,2,11,14,'#443558');oval(c,-4,0,2,2,gold);oval(c,4,0,2,2,gold);}
  c.restore();
}
export function vault(cards,rnd=Math.random){
  const reset=()=>({piles:shuffle([['bat','key','shield'],['shield','bat','key'],['potion','bat'],['shield','potion']],rnd).map(types=>({types,open:false})),hp:4,armor:0,keys:0,solved:0,focus:0,quiz:null,notice:'Chọn chồng đầu tiên. Muốn rời hầm phải dọn hết chồng đã mở.',pool:deck(cards,rnd),seen:[]});
  function choose(s,i){
    const p=s.piles[i];if(!p?.types.length)return;
    p.open=true;s.focus=i;const word=s.pool[s.solved%s.pool.length];
    s.quiz={word,i,options:shuffle([word,...shuffle(s.pool.filter(c=>c.vi!==word.vi),rnd).slice(0,2)],rnd)};
    s.notice='Chọn nghĩa của từ để dùng lá bài.';
  }
  function answer(s,i,finish){
    const q=s.quiz;if(!q||!q.options[i])return;
    if(q.options[i]!==q.word){s.hp--;s.notice='Sai ấn, mất 1 tim. Đọc lại từ và thử tiếp.';}
    else{
      const effect=s.piles[q.i].types.shift();
      if(effect==='bat'){if(s.armor)s.armor--;else s.hp--;}
      if(effect==='potion')s.hp=Math.min(5,s.hp+2);
      if(effect==='shield')s.armor++;
      if(effect==='key')s.keys++;
      s.notice={bat:'Dơi tấn công, mất một khiên hoặc một tim.',potion:'Bình thuốc hồi tối đa 2 tim.',shield:'Đã nhặt một khiên đỡ đòn.',key:'Đã nhặt một chìa khóa.'}[effect];
      s.solved++;s.seen.push(q.word);s.quiz=null;
    }
    if(s.hp<=0)finish(false,'Hết tim. Thử lấy khiên trước khi gặp dơi.',0);
    else if(s.keys===2&&!s.piles.some(p=>p.open&&p.types.length))finish(true,'Hai chìa khóa đã mở cửa hầm.',s.solved*9+s.hp*4,s.seen);
  }
  const select=(s,i,finish)=>s.quiz?answer(s,i,finish):choose(s,i);
  return session('lantern_vault','Hầm thẻ đồng','Lấy 2 chìa khóa và dọn hết các chồng đã mở. Dơi lấy 1 tim hoặc 1 khiên. Chạm lá bài hay bấm số tương ứng.',reset,{
    info:s=>'♥ '+s.hp+'   ·   Khiên '+s.armor+'   ·   Khóa '+s.keys+'/2',
    click(s,x,y,finish){
      if(s.quiz){if(x>=36&&x<=524&&y>=324&&y<498){const j=Math.floor((y-324)/58);if((y-324)%58<49)answer(s,j,finish);}return;}
      const i=Math.floor((x-17)/133);if(x>=17&&i<4&&(x-17)%133<=125&&y>=176&&y<=354)choose(s,i);
    },
    key(s,k,f){if(/^(Digit|Numpad)[1-4]$/.test(k))select(s,Number(k.at(-1))-1,f);},
    draw(s,c,t){
      if(!art(c,'vault'))backdrop(c,'#252240','#393451',t);
      panel(c,74,34,412,96,'#29223ce8',16);
      label(c,'✧   THE BRASS VAULT   ✧',280,65,28,gold);label(c,'Hai chìa khóa mở cổng',280,109,17,paper);
      const plates=s.quiz?.i;
      s.piles.forEach((p,i)=>{
        const x=17+i*133,k=p.types[0];panel(c,x,187,124,169,'#201e35',13,'#70617c');
        if(!k){label(c,'✓',x+62,250,38,mint);return;}
        for(let j=p.types.length-1;j>=0;j--)panel(c,x,175+j*5,124,164,j?'#7e6a82':kinds[k][1],12,plates===i?'#fff9cf':'#3d3347');
        label(c,(i+1)+'',x+18,193,14,ink);emblem(c,k,x+62,232,Math.sin(t*4)*3);
        label(c,kinds[k][0],x+62,284,16,ink,117);label(c,p.types.length+' lá',x+62,313,14,ink);
        if(p.open){panel(c,x+20,365,84,29,'#272034ec',8);label(c,'Đã mở',x+62,380,15,gold);}
      });
      if(s.quiz){
        panel(c,18,173,524,357,'#2a2945',17,'#ad98ac');
        label(c,kinds[s.piles[s.quiz.i].types[0]][0]+'   ·   Giải ấn',280,209,18,gold);
        label(c,s.quiz.word.word,280,256,31,paper,485);label(c,s.notice,280,295,15,mint);
        s.quiz.options.forEach((v,i)=>button(c,36,324+i*58,488,49,(i+1)+'.   '+v.vi,paper));
      }else{panel(c,14,402,532,133,'#29223cf2',15);lines(c,s.notice,280,430,470,20,paper);label(c,'Dơi −1    ·    Thuốc +2    ·    Khiên chặn 1 đòn',280,510,16,mint);}
    }
  });
}

