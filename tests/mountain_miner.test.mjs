
import test from 'node:test';
import assert from 'node:assert/strict';
import { mountainMiner,vocabulary } from '../src/ui/mountain_miner/miner.js';
const cards=[{id:'a',word:'apple',vi:'táo'},{id:'b',word:'pear',vi:'lê'}];
function frame(g){
  const items=[],arcs=[],labels=[];
  const c=new Proxy({}, {get(t,k){
    if(k==='fillText')return (text,x,y)=>{labels.push(String(text));if(['35','60','5'].includes(String(text)))items.push({x,y});};
    if(k==='arc')return (x,y,r)=>{if(r===12)arcs.push({x,y});};
    return ()=>{};
  },set(){return true;}});
  g.draw(c,560,560,0);return {items,hook:arcs[0],labels};
}
test('pool removes duplicates by normalized word and meaning',()=>{
  const pool=vocabulary([...cards,{word:' APPLE ',vi:'quả táo'},{word:'fruit',vi:' táo '}]);
  assert.equal(pool.filter(c=>c.word.toLowerCase()==='apple').length,1);
  assert.equal(pool.filter(c=>c.vi==='táo').length,1);
});
test('timeout, retry and empty or short vocabulary remain playable',()=>{
  for(const pool of [[],cards]){
    const g=mountainMiner(pool,()=>.5);assert.equal(g.done(),null);frame(g);
    for(let i=0;i<66;i++)g.update(1);
    assert.ok(frame(g).labels.some(x=>x.startsWith('Hết giờ')));
    assert.equal(g.done(),null);g.click(280,345);
    assert.match(g.info(),/65 giây/);
    g.click(60,523);g.update(1);assert.match(g.info(),/65 giây/);
    g.click(60,523);g.update(NaN);frame(g);
  }
});
test('win through actual aim, pull and vocabulary choices returns only the agreed fields',()=>{
  const g=mountainMiner(cards,()=>.999);
  for(let tick=0;tick<6000;tick++){
    const f=frame(g);
    if(f.labels.includes('Đã thu đủ quặng!'))break;
    if(f.labels.includes('TÚI TỪ · đồng hồ tạm dừng')){g.click(280,300);continue;}
    const hook=f.hook;
    if(hook&&Math.abs(Math.hypot(hook.x-280,hook.y-151)-22)<.01){
      const angle=Math.atan2(hook.x-280,hook.y-151);
      if(f.items.some(o=>Math.abs(Math.atan2(o.x-280,o.y-151)-angle)<.045))g.click(280,523);
    }
    g.update(.02);
  }
  assert.ok(frame(g).labels.includes('Đã thu đủ quặng!'));
  assert.equal(g.done(),null);g.click(280,345);
  const result=g.done();
  assert.deepEqual(Object.keys(result).sort(),['id','score','text','words']);
  assert.equal(result.id,'mountain_miner');assert.ok(result.score>=180);
  assert.ok(result.words.length>0);assert.equal(result.words[0].id,'a');
});
