import {ink,paper,gold,mint,art,panel,oval,label,button,backdrop,deck,neighbours,shuffle,session} from './board.js';
const colors=['#ffaf70','#83e0c4','#afafff'];
const pos=i=>[94+(i%5)*93,147+Math.floor(i/5)*69];
function cell(x,y){
  const col=Math.round((x-94)/93),row=Math.round((y-147)/69);
  if(col<0||col>4||row<0||row>4)return -1;
  const i=row*5+col,[cx,cy]=pos(i);return Math.hypot(x-cx,y-cy)<35?i:-1;
}
function weave(s,rnd){
  const word=s.words[s.round].word.toUpperCase().replace(/[^A-Z]/g,'');
  const step=Math.ceil(word.length/7),chunks=word.match(new RegExp('.{1,'+step+'}','g'));
  // A random walk with backtracking plants a solution before adding decoys.
  function extend(path){
    if(path.length===chunks.length)return path;
    for(const n of shuffle(Array.from({length:25},(_,i)=>i),rnd)){
      if(!path.includes(n)&&(!path.length||neighbours(n,path.at(-1)))){
        const next=extend([...path,n]);if(next)return next;
      }
    }
    return null;
  }
  const route=extend([]),bridge=Math.floor(chunks.length/2),family=Math.floor(rnd()*3);
  s.tiles=Array.from({length:25},()=>({glyph:rnd()<.6?chunks[Math.floor(rnd()*chunks.length)]:String.fromCharCode(65+Math.floor(rnd()*26)),family:Math.floor(rnd()*3)}));
  route.forEach((n,i)=>{s.tiles[n]={glyph:chunks[i],family:i<=bridge?family:(family+1)%3,star:i===bridge};});
  Object.assign(s,{path:[],route,chunks,word,focus:route[0],hint:false,holding:false,flash:'',timer:0});
}
export function fireflies(cards,rnd=Math.random){
  function reset(){
    const spellable=(cards||[]).filter(c=>c?.word&&/^[a-z -]+$/i.test(c.word)&&c.word.replace(/[^a-z]/gi,'').length>=3&&c.word.length<=18);
    const s={words:deck(spellable,rnd).slice(0,4),round:0,score:0};
    weave(s,rnd);return s;
  }
  function pick(s,i){
    if(i<0||s.timer>0)return;
    s.focus=i;
    if(s.path.length>=2 && i===s.path.at(-2)){s.path.pop();return;}
    if(s.path.includes(i))return;
    const prev=s.path.at(-1),tile=s.tiles[i];
    if(prev!==undefined&&(!neighbours(prev,i)||(!s.tiles[prev].star&&s.tiles[prev].family!==tile.family))){
      s.flash='Nối ô cạnh nhau cùng màu, hoặc đổi màu sau ★';return;
    }
    if(tile.glyph!==s.chunks[s.path.length]){s.flash='Chữ này chưa khớp. Thử một ô khác.';return;}
    s.path.push(i);s.flash='';
    if(s.path.length===s.chunks.length){s.score+=s.hint?18:30;s.timer=1.15;s.flash=s.words[s.round].word+'  ·  '+s.words[s.round].vi;}
  }
  function hint(s){if(s.timer)return;s.hint=true;s.path=[];s.focus=s.route[0];s.flash=s.words[s.round].word+' · Theo các vòng sáng để ghép từ.';}
  return session('lantern_chain','Lối đom đóm','Chạm từng con hoặc kéo một nét. Nối cả đường chéo. Bàn phím: mũi tên và Space, H gợi ý, Backspace lùi.',reset,{
    info:s=>(s.round+1)+'/'+s.words.length+' từ · '+s.score+' điểm',
    down(s,x,y){s.holding=true;pick(s,cell(x,y));},drag(s,x,y){if(s.holding)pick(s,cell(x,y));},up(s){s.holding=false;},
    click(s,x,y){if(y>=500&&y<547){if(x>=300&&x<527)hint(s);else if(x>=33&&x<265&&!s.timer){s.path=[];s.flash='';}}},
    key(s,k){if(k==='KeyH')hint(s);if(k==='Backspace'&&!s.timer)s.path.pop();
      const d={ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5}[k];if(d)s.focus=Math.max(0,Math.min(24,s.focus+d));
      if(k==='Space'||k==='Enter')pick(s,s.focus);
    },
    update(s,dt,held,finish){if(s.timer>0&&(s.timer-=dt)<=0){
      if(s.round+1===s.words.length)finish(true,'Đã thắp sáng '+s.words.length+' từ trong rừng.',s.score,s.words);
      else{s.round++;weave(s,rnd);}
    }},
    draw(s,c,t){
      if(!art(c,'forest'))backdrop(c,'#102638','#34605a',t);
      panel(c,46,12,468,90,'#122c39dd',16);
      label(c,'✦   '+s.words[s.round].vi+'   ✦',280,40,29,gold,490);
      label(c,s.chunks.map((q,i)=>i<s.path.length?q:'＿'.repeat(q.length)).join(' '),280,84,25,paper);
      if(s.path.length){c.beginPath();s.path.forEach((i,k)=>{const [x,y]=pos(i);if(k)c.lineTo(x,y);else c.moveTo(x,y);});c.strokeStyle=gold;c.lineWidth=7;c.lineJoin='round';c.stroke();}
      for(let i=0;i<25;i++){
        const [x,y]=pos(i),tile=s.tiles[i],lit=s.path.includes(i),blink=2*Math.sin(t*3+i);
        oval(c,x,y+14,26,10,'#0f2935');
        for(const side of [-1,1]){
          oval(c,x+side*23,y-13+blink*side,16,7,'#c3ece9ae',side*.72);
          oval(c,x+side*24,y-2-blink*side,10,4,'#93c8c6a6',side*.12);
        }
        oval(c,x,y+20,8,5,lit?'#ffeb95':'#b8cfa0');
        oval(c,x,y,26,22,lit?gold:colors[tile.family]);label(c,tile.glyph,x,y+2,21,ink);
        if(tile.star)label(c,'★',x,y-24,18,gold);
        if(i===s.focus||s.hint&&s.route[s.path.length]===i){c.beginPath();c.arc(x,y,32,0,Math.PI*2);c.strokeStyle=paper;c.lineWidth=2;c.stroke();}
      }
      panel(c,28,454,504,34,'#122c39df',12);
      label(c,s.flash||'★ cho phép đường nối đổi màu',280,471,15,mint,484);
      button(c,33,500,232,44,'Nối lại',paper);button(c,300,500,227,44,'Soi đường',gold);
    }
  });
}

