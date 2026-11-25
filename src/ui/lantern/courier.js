import {ink,paper,gold,mint,art,panel,oval,label,button,deck,shuffle,session} from './board.js';
const track=[123,280,437],carY=416,leg=1150;
const pictures=new Map();
function vehicle(c,x,y,color,player=false){
  if(typeof Image!=='undefined'&&!pictures.has(color)){
    const image=new Image();image.src='./assets/ui/race_kart_'+color+'.png';pictures.set(color,image);
  }
  const im=pictures.get(color);oval(c,x+3,y+5,23,32,'#0f142c');
  if(im?.naturalWidth)c.drawImage(im,x-24,y-35,48,70);
  else panel(c,x-19,y-30,38,60,player?gold:'#7cc9d5',9);
  if(player){oval(c,x,y+30,3,6,gold);oval(c,x+9,y+30,2,4,'#fa8458');}
}
export function courier(cards,rnd=Math.random){
  function reset(){
    const pool=deck(cards,rnd),orders=pool.slice(0,5);
    const gates=orders.map((word,i)=>({at:leg*(i+1),word,lanes:shuffle([word,...shuffle(pool.filter(q=>q.word!==word.word),rnd).slice(0,2)],rnd)}));
    const traffic=[];
    for(let k=0;k<5;k++){
      for(const d of [320,640]){
        const lanes=shuffle([0,1,2],rnd);
        for(const lane of lanes.slice(0,d===320?1:2))traffic.push({at:k*leg+d,lane,hit:false,color:['blue','purple','green'][lane]});
      }
    }
    return {gates,traffic,leg:0,dist:0,lane:1,x:280,speed:0,brake:false,life:4,good:[],notice:'',flash:0,paused:false};
  }
  function key(s,k){
    if(k==='ArrowLeft'||k==='KeyA')s.lane=Math.max(0,s.lane-1);
    if(k==='ArrowRight'||k==='KeyD')s.lane=Math.min(2,s.lane+1);
    if(k==='KeyP')s.paused=!s.paused;
    if(k==='Space'||k==='ArrowDown')s.brake=!s.brake;
  }
  return session('lantern_courier','Chuyến thư đêm','Lái vào làn có từ tiếng Anh đúng và tránh xe. Chạm làn hoặc dùng ← →. Space để phanh hoặc tăng tốc lại. P để tạm dừng.',reset,{
    info:s=>'Thư '+s.good.length+'/5    ·    Xe ♥ '+s.life,
    key,click(s,x,y){if(y>=498&&x<184){s.paused=!s.paused;return;}if(s.paused)return;
      if(y>=498&&x>376)s.brake=!s.brake;else s.lane=Math.max(0,Math.min(2,Math.round((x-track[0])/157)));},
    update(s,dt,h,finish){if(s.paused)return;
      s.speed+=( (s.brake?100:225)-s.speed)*Math.min(1,dt*3);
      s.dist+=dt*s.speed;s.x+=(track[s.lane]-s.x)*Math.min(1,dt*11);s.flash=Math.max(0,s.flash-dt);
      for(const car of s.traffic){
        if(!car.hit&&Math.abs(car.at-s.dist)<42&&Math.abs(track[car.lane]-s.x)<40){
          car.hit=true;s.life--;s.speed*=.4;s.notice='Va chạm!';s.flash=1;
        }
      }
      if(s.life<=0){finish(false,'Xe cần sửa. Phanh sớm trước đoạn đông xe.',0);return;}
      const gate=s.gates[s.leg];
      if(gate&&s.dist>=gate.at){
        const lane=Math.max(0,Math.min(2,Math.round((s.x-track[0])/157)));
        const right=gate.lanes[lane]===gate.word;
        if(right)s.good.push(gate.word);
        s.notice=(right?'Đã giao thư!   ':'Lỡ chốt.   ')+gate.word.word+' · '+gate.word.vi;s.flash=1.7;s.leg++;
        if(s.leg===s.gates.length)finish(s.good.length>=3,'Đã giao đúng '+s.good.length+' trong 5 lá thư.',s.good.length*24+s.life*4,s.good);
      }
    },
    draw(s,c,t){
      c.fillStyle='#172d3d';c.fillRect(0,0,560,560);c.fillStyle='#29334a';c.fillRect(44,0,472,560);
      const offset=s.dist%560,section=Math.floor(s.dist/560);
      for(let j=-1;j<=0;j++){
        c.save();c.translate(0,offset+j*560);
        if((section-j)%2){c.translate(0,560);c.scale(1,-1);}
        art(c,'road');c.restore();
      }
      for(let j=-1;j<9;j++){const y=(s.dist%82)+j*82;
        for(const x of [202,357])panel(c,x,y+12,3,30,'#8893a6',1);
      }
      const gate=s.gates[Math.min(s.leg,4)];
      for(const car of s.traffic){const y=carY+s.dist-car.at;if(y>25&&y<570&&!car.hit)vehicle(c,track[car.lane],y,car.color);}
      const dy=carY+s.dist-gate.at;
      if(dy>=60){
        gate.lanes.forEach((q,i)=>{panel(c,track[i]-72,dy-22,144,43,'#185762',8,'#94e9cd');label(c,q.word,track[i],dy,17,paper,134);});
      }
      vehicle(c,s.x,carY,'red',true);
      panel(c,15,12,530,81,ink,16,'#587383');
      label(c,'CHỐT '+Math.min(5,s.leg+1)+' / 5',91,39,14,mint);
      label(c,gate.word.vi,335,41,25,paper,380);
      gate.lanes.forEach((q,i)=>label(c,q.word,track[i],75,16,gold,143));
      if(s.flash) {panel(c,44,99,472,37,ink,10);label(c,s.notice,280,117,17,gold,448);}
      button(c,17,501,153,42,s.paused?'Tiếp tục':'Tạm dừng',paper);
      label(c,Math.round(s.speed*.6)+' km/h',280,523,18,paper);
      button(c,390,501,153,42,s.brake?'Tăng tốc':'Phanh',gold);
      if(s.paused){panel(c,100,235,360,84,ink,18);label(c,'Tạm dừng',280,277,30,mint);}
    }
  });
}

