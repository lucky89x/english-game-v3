
import test from 'node:test';
import assert from 'node:assert/strict';
import {mountainMinerV2,vocabulary} from '../src/ui/mountain_miner/miner_v2.js';

const cards=[{id:'apple',word:'apple',vi:'táo'},{id:'pear',word:'pear',vi:'lê'}];
function frame(game){
  const labels=[], positions=[];
  const canvas=new Proxy({},{
    get(_,method){
      if(method==='fillText')return (value)=>labels.push(String(value));
      if(method==='translate')return (x,y)=>positions.push([x,y]);
      if(method==='createLinearGradient')return ()=>({addColorStop(){}});
      return ()=>{};
    },
    set(){return true;}
  });
  game.draw(canvas,560,560,0);
  return {labels,positions};
}
test('pool deduplicates words and meanings; short and empty units draw safely',()=>{
  const pool=vocabulary([...cards,{word:' APPLE ',vi:'khác'},{word:'fruit',vi:' Táo '}]);
  assert.equal(pool.filter(c=>c.word==='apple' || c.vi==='táo').length,1);
  for(const list of [[],cards])assert.ok(frame(mountainMinerV2(list)).labels.includes('Vòng 1 / 3'));
});
test('timeout and retry do not award a result',()=>{
  const g=mountainMinerV2([]);
  for(let n=0;n<66;n++)g.update(1);
  assert.ok(frame(g).labels.includes('Hết giờ'));
  assert.equal(g.done(),null);g.click(280,350);
  assert.ok(frame(g).labels.includes('65 giây'));
});
test('three rounds contain one collectible boost, reset it and return a clean result',()=>{
  const g=mountainMinerV2(cards,()=>.999), cols=[175,385,280];
  for(let round=0;round<3;round++){
    assert.ok(frame(g).labels.includes('Thể lực'));
    const target=frame(g).positions.find(([x,y])=>Math.abs(x-cols[round])<8&&y===305);
    function aimAt(x,y){
      const sought=Math.atan2(x-280,y-176);
      for(let n=0;n<400;n++){
        const [hx,hy]=frame(g).positions.at(-1);
        if(Math.abs(Math.atan2(hx-280,hy-176)-sought)<.012){g.click(240,525);return;}
        g.update(.02);
      }
      assert.fail('Angle did not pass target');
    }
    assert.equal(frame(g).positions.filter(([x,y])=>x===target[0]&&y===target[1]).length,1);
    aimAt(...target);
    for(let n=0;n<250;n++)g.update(.02);
    assert.ok(frame(g).labels.includes('Thể lực · Kéo ×3'));
    assert.equal(frame(g).positions.filter(([x,y])=>x===target[0]&&y===target[1]).length,0);
    for(const [x,y] of frame(g).positions.filter(([x,y])=>y>=245&&Math.abs(Math.atan2(x-280,y-176))<1.04)){
      
      aimAt(x,y);
      for(let n=0;n<150;n++)g.update(.02);
      if(frame(g).labels.includes('Vòng tiếp theo')||frame(g).labels.includes('Nhận thưởng'))break;
      g.click(280,300);
      if(frame(g).labels.includes('Vòng tiếp theo')||frame(g).labels.includes('Nhận thưởng'))break;
    }
    const expected=round===2?'Nhận thưởng':'Vòng tiếp theo';
    assert.ok(frame(g).labels.includes(expected));
    assert.equal(g.done(),null);g.click(280,350);
  }
  assert.deepEqual(Object.keys(g.done()).sort(),['id','score','text','words']);
  assert.equal(g.done().id,'mountain_miner');
  assert.ok(g.done().score>=480 && g.done().words.some(c=>c.id==='apple'));
});
