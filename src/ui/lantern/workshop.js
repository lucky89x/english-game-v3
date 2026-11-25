import {ink,paper,gold,mint,panel,oval,label,lines,button,backdrop,session} from './board.js';
const cases=[
  {title:'Người nhận túi hạt',question:'Who should receive the seeds?',answer:0,proof:[0,2],
   clues:[['A note on the sill says: deliver the seeds to the garden.','Giấy trên bậu cửa dặn giao hạt đến khu vườn.'],['The clock was wound this morning.','Đồng hồ được lên dây sáng nay.'],['The gardener asked for the seeds before noon.','Người làm vườn cần hạt trước buổi trưa.']],
   talk:[['I work in the garden until eleven.','Tôi làm ở vườn đến 11 giờ.'],['I work in the garden after lunch.','Tôi làm ở vườn sau bữa trưa.'],['I open the market at nine.','Tôi mở chợ lúc 9 giờ.']],
   why:'Chỉ Anna ở vườn trước buổi trưa.'},
  {title:'Bức thư lỡ chuyến',question:'Who can carry the late letter?',answer:1,proof:[1,2],
   clues:[['The square is quiet tonight.','Quảng trường yên tĩnh tối nay.'],['A dispatch note says the letter must leave after ten tonight.','Phiếu gửi yêu cầu thư rời làng sau 10 giờ tối.'],['The seal shows a boat. This letter must travel by river.','Con dấu hình thuyền. Thư phải đi bằng đường sông.']],
   talk:[['My boat leaves at nine tonight.','Thuyền của tôi rời bến lúc 9 giờ tối.'],['My boat leaves at half past ten tonight.','Thuyền của tôi rời bến lúc 10 giờ rưỡi tối.'],['My cart leaves at eleven tonight.','Xe của tôi khởi hành lúc 11 giờ tối.']],
   why:'Ben có thuyền rời bến sau 10 giờ tối.'},
  {title:'Chiếc chìa khóa mượn',question:'Who borrowed the brass key?',answer:2,proof:[0,1],
   clues:[['The visitor left a blue scarf on the sill.','Vị khách để lại khăn xanh trên bậu cửa.'],['The clock log records the key loan on Friday.','Sổ bên đồng hồ ghi chìa được mượn hôm thứ Sáu.'],['The mailbag contains a blank envelope.','Trong túi chỉ có một phong bì trống.']],
   talk:[['I wore my blue scarf here on Thursday.','Tôi quàng khăn xanh tới đây hôm thứ Năm.'],['I came on Friday in a red scarf.','Tôi tới hôm thứ Sáu với khăn đỏ.'],['I wore my blue scarf here on Friday.','Tôi quàng khăn xanh tới đây hôm thứ Sáu.']],
   why:'Chỉ Lily có khăn xanh và tới xưởng hôm thứ Sáu.'}
];
const witnesses=['Anna','Ben','Lily'],sites=['Cửa sổ','Đồng hồ','Túi thư'],pins=[[79,142],[305,83],[485,200]];
const images=new Map();
function imageOf(file){
  if(!images.has(file)&&typeof Image!=='undefined'){const im=new Image();im.src='./assets/ui/'+file;images.set(file,im);}
  return images.get(file);
}
export function workshop(cards,rnd=Math.random){
  function reset(){return {file:cases[Math.floor(rnd()*cases.length)],visit:new Set(),stage:'search',selected:-1,proof:[],translated:false,mistakes:0,note:''};}
  function ready(s){return s.visit.size===6;}
  function open(s,i){s.selected=i;s.translated=false;s.visit.add(i);s.note='';}
  function pick(s,i,finish){
    if(s.stage==='search'){open(s,i);return;}
    if(s.stage==='person'){s.person=i;s.proof=[];s.stage='proof';s.note='';return;}
    if(s.proof.includes(i)){s.proof=s.proof.filter(v=>v!==i);return;}
    s.proof.push(i);
    if(s.proof.length===2){
      if(s.person===s.file.answer&&s.file.proof.every(v=>s.proof.includes(v)))finish(true,s.file.why,Math.max(30,120-12*s.mistakes));
      else{s.stage='search';s.selected=-1;s.mistakes++;s.note='Kết luận chưa khớp cả hai dấu vết. Đọc lại sổ tay.';}
    }
  }
  function proceed(s){if(ready(s)){s.stage='person';s.note='';s.selected=-1;}}
  return session('lantern_case','Hồ sơ xưởng đồng hồ','Khám 3 đồ vật và hỏi 3 người. Chọn người phù hợp rồi dẫn ra 2 chứng cứ. Phím 1–6 để khám, T dịch, Enter kết luận.',reset,{
    info:s=>s.visit.size+'/6 ghi chép',
    key(s,k,f){const i=Number(k.replace(/^(Digit|Numpad)/,''))-1;if(Number.isInteger(i)&&i>=0&&i<(s.stage==='search'?6:3))pick(s,i,f);
      if(k==='KeyT')s.translated=!s.translated;
      if(k==='Enter'&&s.stage==='search')proceed(s);
      if(k==='Backspace'){s.stage='search';s.proof=[];}
    },
    click(s,x,y,f){
      if(s.stage!=='search'){
        if(y>=482&&y<537&&x>60&&x<500){s.stage='search';return;}
        if(x>40&&x<520&&y>=252&&y<459&&(y-252)%69<55)pick(s,Math.floor((y-252)/69),f);
        return;
      }
      if(y>=503&&y<548){if(x>=30&&x<=176)s.translated=!s.translated;else if(x>=228&&x<=530)proceed(s);return;}
      if(y>=329&&y<=376&&x>=14&&x<545){const i=Math.floor((x-14)/178);if((x-14)%178<169)open(s,i+3);return;}
      if(y<324){pins.forEach(([a,b],i)=>{if(Math.hypot(x-a,y-b)<49)open(s,i);});}
    },
    draw(s,c,t){
      backdrop(c,'#1a3348','#533444',t);
      const room=imageOf('lantern_workshop.webp');
      if(room?.naturalWidth)c.drawImage(room,0,0,560,324);
      panel(c,12,12,536,47,'#172a3ae8',12);label(c,s.file.title,280,36,23,paper);
      pins.forEach(([x,y],i)=>{oval(c,x,y,17,17,ink);oval(c,x,y,14,14,s.visit.has(i)?mint:gold);label(c,i+1,x,y,17,ink);});
      if(s.stage==='search'){
        witnesses.forEach((name,i)=>{
          const x=14+i*178;panel(c,x,329,169,47,s.selected===i+3?gold:paper,10);
          const face=imageOf('keeper_'+name.toLowerCase()+'.jpg');
          if(face?.naturalWidth){c.save();c.beginPath();c.arc(x+26,352,18,0,Math.PI*2);c.clip();c.drawImage(face,x+8,334,36,36);c.restore();}
          label(c,(i+4)+'. '+name+(s.visit.has(i+3)?' ✓':''),x+103,353,17,ink,119);
        });
        panel(c,14,386,532,106,paper,12);
        const i=s.selected,entry=i<0?null:(i<3?s.file.clues[i]:s.file.talk[i-3]);
        label(c,i<0?'Sổ tay điều tra':(i<3?sites[i]:witnesses[i-3]),280,405,16,'#83533e');
        lines(c,s.note||(entry?entry[s.translated?1:0]:s.file.question+'  ·  Tìm dấu vết và hỏi nhân chứng.'),280,437,490,18);
        button(c,30,504,146,42,s.translated?'English':'Dịch',gold);button(c,228,504,302,42,ready(s)?'Đưa ra kết luận':'Ghi chép '+s.visit.size+'/6',ready(s)?mint:'#b7b0a6');
      }else{
        panel(c,18,135,524,419,'#f9e7c7',18);
        label(c,s.stage==='person'?s.file.question:witnesses[s.person]+'  ·  Chọn 2 chứng cứ',280,184,24,ink,484);
        label(c,s.stage==='person'?'Đối chiếu lời khai với chứng cứ':s.proof.length+'/2 chứng cứ',280,223,17,'#795440');
        (s.stage==='person'?witnesses:sites).forEach((name,i)=>button(c,41,252+i*69,478,55,(i+1)+'.  '+name+(s.proof.includes(i)&&s.stage==='proof'?' ✓':''),s.proof.includes(i)&&s.stage==='proof'?mint:gold));
        button(c,60,482,440,49,'Đọc lại sổ tay','#dbc8ac');
      }
    }
  });
}

