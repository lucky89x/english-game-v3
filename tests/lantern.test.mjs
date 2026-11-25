import test from 'node:test';
import assert from 'node:assert/strict';
import { deck } from '../src/ui/lantern/board.js';
import { fireflies } from '../src/ui/lantern/fireflies.js';
import { vault } from '../src/ui/lantern/vault.js';
import { courier } from '../src/ui/lantern/courier.js';
import { workshop } from '../src/ui/lantern/workshop.js';

const fixed = () => 0.999;
const words = [['cat','mèo'],['dog','chó'],['sun','mặt trời'],['pen','bút'],['owl','cú mèo'],['cup','cốc']]
  .map(([word,vi]) => ({id:'grade:'+word,word,vi}));

test('word pool keeps lesson words ahead of fallback and removes ambiguous answers', () => {
  const pool=deck([...words,{word:'kitty',vi:'mèo'},words[0]],fixed);
  assert.deepEqual(pool.slice(0,6),words);
  assert.equal(pool.filter(c=>c.vi==='mèo').length,1);
  assert.equal(pool.filter(c=>c.word==='cat').length,1);
});
test('firefly drag solves each planted path and a hint reduces the score', () => {
  const game=fireflies(words,fixed);
  for(let round=0;round<4;round++){
    if(round===0)game.key('KeyH');
    game.down(94,147);game.drag(187,147);game.drag(94,147); // undo
    game.drag(187,147);game.drag(280,147);game.up(280,147);
    for(let frame=0;frame<12;frame++)game.update(.1);
  }
  assert.equal(game.done(),null);
  game.key('Enter');
  assert.equal(game.done().score,108);
  assert.deepEqual(game.done().words,words.slice(0,4));
});
test('vault requires both keys and clearing open stacks, retries do not pay', () => {
  const game=vault(words,fixed);
  game.key('Digit1');
  for(let wrong=0;wrong<4;wrong++)game.key('Digit2');
  assert.equal(game.done(),null);
  game.key('Enter');
  assert.match(game.info(),/♥ 4/);
  for(const pile of [3,1,1,1,2,2,2]){
    game.key('Digit'+pile); game.key('Digit1');
  }
  assert.match(game.info(),/2\/2/);
  game.key('Digit3');game.key('Digit1');
  game.click(280,353);
  assert.equal(game.done().id,'lantern_vault');
});
test('courier can pause, steer around traffic, and deliver all five words', () => {
  const game=courier(words,fixed);
  game.key('KeyP');for(let i=0;i<50;i++)game.update(.1);
  game.key('KeyP');game.key('ArrowRight');
  let distance=0,speed=0;
  for(let n=0;n<400&&distance<5750;n++){
    const part=distance%1150;
    game.click(part>790?123:437,410);
    game.update(.1);speed+=(225-speed)*.3;distance+=speed*.1;
  }
  game.key('Enter');
  assert.equal(game.done()?.id,'lantern_courier');
  assert.deepEqual(game.done().words,words.slice(0,5));
});
test('courier retries after running out of hearts or missing too many gates', () => {
  for(const lane of [123,437]){
    const game=courier(words,fixed);game.click(lane,410);
    for(let n=0;n<400;n++)game.update(.1);
    game.key('Enter');assert.equal(game.done(),null);
    assert.match(game.info(),/0\/5.*4/);
  }
});
test('all three mystery files require six notes, the right witness and both clues', () => {
  const solutions=[[1,1,3],[2,2,3],[3,1,2]];
  for(const [index,[person,a,b]] of solutions.entries()){
    const game=workshop([],()=>(index+.5)/3);
    game.key('Enter');
    for(let i=1;i<=6;i++)game.key('Digit'+i);
    game.key('KeyT');game.key('Enter');
    for(const i of [person%3+1,a,b])game.key('Digit'+i);
    assert.equal(game.done(),null);
    game.key('Enter');
    for(const i of [person,a,b])game.key('Digit'+i);
    assert.equal(game.done(),null);
    game.key('Enter');
    assert.equal(game.done()?.score,108);
  }
});

