
import test from 'node:test';
import assert from 'node:assert/strict';
import {castTarget,vein,mountainMinerV4,vocabulary} from '../src/ui/mountain_miner/miner_v4.js';
const look=o=>Math.atan2(o.x-280,o.y-132);
test('one bag per round and one diamond per run, with rocks between the hook and gold',()=>{
  for(const random of [()=>.001,()=>.5,()=>.999]){
    let diamonds=0;
    for(let round=0;round<3;round++){
      const objects=vein(round,random,2);
      const bag=objects.find(o=>o.kind==='strength');
      assert.equal(objects.filter(o=>o.kind==='strength').length,1);
      assert.equal(castTarget(objects,look(bag)).object,bag);
      const big=objects.find(o=>o.kind==='gold'&&o.r===33);
      const shield=castTarget(objects,look(big)).object;
      assert.equal(shield.kind,'rock');
      shield.taken=true;
      assert.equal(castTarget(objects,look(big)).object,big);
      diamonds+=objects.filter(o=>o.kind==='gem').length;
    }
    assert.equal(diamonds,1);
  }
});
test('empty casts reach the boundary, marked rocks can be skipped',()=>{
  const objects=[{x:280,y:325,r:25,taken:false},{x:280,y:457,r:33,taken:false}];
  assert.equal(castTarget(objects,0).object,objects[0]);
  objects[0].taken=true;
  assert.equal(castTarget(objects,0).object,objects[1]);
  assert.deepEqual(castTarget([],0),{length:418,object:null});
  assert.equal(Math.round(Math.sin(.8)*castTarget([],.8).length),270);
});
function labels(game){
  const out=[];
  const ctx=new Proxy({}, {get(_,key){
    if(key==='fillText')return value=>out.push(value);
    if(key==='createLinearGradient')return ()=>({addColorStop(){}});
    return ()=>{};
  },set(){return true;}});
  game.draw(ctx,560,560,0);
  return out;
}
test('single click fires, grants strength, and timeout can retry',()=>{
  const g=mountainMinerV4([],()=>.5);
  const bag=vein(0,()=>.5,1).find(o=>o.kind==='strength');
  const elapsed=Math.asin(look(bag)/1.08)/1.25;
  g.update(elapsed);
  g.click(91,210);
  g.click(91,210);
  for(let i=0;i<3;i++)g.update(1);
  assert.ok(labels(g).includes('Thể lực · Kéo ×3'));
  for(let i=0;i<66;i++)g.update(1);
  assert.equal(g.done(),null);
  assert.ok(labels(g).includes('Hết giờ'));
  g.click(280,346);
  assert.ok(labels(g).includes('65 giây'));
});
test('two cards and an empty unit work; equivalent words and meanings deduplicate',()=>{
  const cards=[{id:'a',word:'apple',vi:'táo'},{id:'b',word:'pear',vi:'lê'}];
  assert.ok(labels(mountainMinerV4(cards)).includes('Vòng 1 / 3'));
  assert.ok(labels(mountainMinerV4([])).includes('Vòng 1 / 3'));
  assert.equal(vocabulary([...cards,{word:' Apple ',vi:'lạ'},{word:'other',vi:'Táo'}]).filter(c=>c.word==='apple'||c.vi==='táo').length,1);
});


test('gold scores immediately, rock scores zero and diamond scores 100',()=>{
  const random=()=>.001;
  const g=mountainMinerV4([],random);
  const objects=vein(0,random,0);
  let elapsed=0,score=0;
  function collect(object){
    const angle=look(object);
    const phase=Math.asin(angle/1.08);
    let at=phase/1.25;
    while(at<=elapsed)at+=2*Math.PI/1.25;
    while(elapsed<at){
      const dt=Math.min(.2,at-elapsed);
      g.update(dt);elapsed+=dt;
    }
    g.click(100,210);
    object.taken=true;
    for(let i=0;i<8;i++){g.update(1);elapsed++;}
  }
  const gold=objects.find(o=>o.kind==='gold'&&castTarget(objects,look(o)).object===o);
  collect(gold);score=Math.round(17+gold.r);
  assert.match(g.info(),new RegExp('· '+score+'/'));
  const rock=objects.find(o=>o.kind==='rock'&&castTarget(objects,look(o)).object===o);
  collect(rock);assert.match(g.info(),new RegExp('· '+score+'/'));
  const gem=objects.find(o=>o.kind==='gem'), shield=castTarget(objects,look(gem)).object;
  if(shield!==gem)collect(shield);
  collect(gem);
  assert.match(g.info(),new RegExp('· '+(score+100)+'/'));
  assert.equal(g.done(),null);
});
