import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, TOWERS, waveLineup, CHAPTERS } from '../src/engine.js';
import { scoutWave, starterTip, purchaseQuote, PurchaseReview } from '../src/playtest.js';

const preview = () => { const game = new Game(); game.allowPreview(); game.forest.unlocked = Object.keys(TOWERS); return game; };

test('every forecast matches the actual queue across all chapters and waves', () => {
  for (let chapter = 0; chapter < CHAPTERS.length; chapter++) for (let wave = 1; wave <= 10; wave++) {
    const game = preview(); game.chapter = chapter; game.wave = wave - 1;
    const scout = scoutWave(chapter, wave);
    assert.equal(game.startWave(), true);
    assert.equal(scout.total, 6 + wave * 2 + (wave === 10 ? 1 : 0));
    assert.equal(scout.total, game.queue.length);
    assert.deepEqual(Object.fromEntries(scout.groups.map(group => [group.kind, group.count])),
      Object.fromEntries([...new Set(game.queue)].sort().map(kind => [kind, game.queue.filter(pest => pest === kind).length])));
    assert.equal(game.queue.filter(kind => kind === 'boss').length, wave === 10 ? 1 : 0);
  }
  assert.deepEqual(waveLineup(0, 1), Array(8).fill('termite'));
  assert.ok(!waveLineup(0, 3).includes('blight'));
  assert.ok(waveLineup(1, 4).includes('blight'));
  for (const [chapter,wave] of [[-1,1],[3,1],[0,0],[0,11],[0,1.5]]) assert.deepEqual(waveLineup(chapter,wave), []);
});

test('scouting is read-only and returned forecasts cannot change spawning', () => {
  const game = preview(), before = game.snapshot(), scout = scoutWave(0,1);
  scout.groups[0].count = 900; scout.groups.push({kind:'boss',count:20});
  assert.deepEqual(game.snapshot(), before);
  game.startWave(); assert.deepEqual(game.queue, Array(8).fill('termite'));
});

test('the guided Pine and Oak start clears wave one without spending TREE', () => {
  const game = preview(), tree = game.tree;
  assert.equal(starterTip(game).key, 'plant');
  game.place('pine',0); assert.equal(starterTip(game).key, 'reinforce');
  game.place('oak',1); assert.equal(starterTip(game).key, 'launch');
  game.startWave(); assert.equal(starterTip(game).key, 'watch');
  game.pause(); assert.equal(starterTip(game).action, 'Resume battle'); game.pause();
  for(let i=0;i<10000 && game.phase==='running';i++) game.step(.05);
  assert.equal(game.phase, 'build'); assert.equal(game.health,100); assert.equal(game.kills,8);
  assert.equal(starterTip(game).key,'done'); assert.equal(game.tree,tree);
});

test('the guide adapts to alternate placements and offers recovery after defeat', () => {
  const game = preview(); game.place('mushroom',1);
  assert.equal(starterTip(game).pad,0);
  game.place('palm',7); assert.equal(starterTip(game).key,'launch');
  game.startWave(); game.phase='defeat';game.health=0;
  assert.equal(starterTip(game).key,'recover');
  const tree=game.tree;game.newRun();assert.equal(starterTip(game).key,'plant');assert.equal(game.tree,tree);
});

test('opening and abandoning purchase reviews leaves all game state unchanged', () => {
  const game=preview(), tower=game.place('pine',0), before=game.snapshot();
  for (const kind of ['shield','fertilizer','storm','continue','upgrade','unknown']) {
    const review=new PurchaseReview(game,kind,tower.id);review.details();review.details();
  }
  assert.deepEqual(game.snapshot(),before);
  const quote=purchaseQuote(game,'upgrade',tower.id);
  assert.equal(quote.cost,5000);assert.equal(quote.balanceAfter,145000);assert.equal(quote.available,true);
});

test('a confirmed upgrade review charges once and grows every guardian of that species', () => {
  const game=preview(), a=game.place('pine',0),b=game.place('pine',1),review=new PurchaseReview(game,'upgrade',a.id);
  assert.equal(review.confirm(),true);assert.equal(review.confirm(),false);assert.equal(game.tree,145000);
  assert.equal(a.level,2);assert.equal(b.level,2);assert.equal(game.forest.levels.pine,2);
  const next=new PurchaseReview(game,'upgrade',a.id);assert.equal(next.details().cost,10000);
  assert.equal(next.confirm(),true);assert.equal(next.confirm(),false);assert.equal(game.tree,135000);
});

test('a stale upgrade review cannot charge a changed price', () => {
  const game=preview(),tower=game.place('pine',0),review=new PurchaseReview(game,'upgrade',tower.id);
  game.upgrade(tower.id);const tree=game.tree;
  assert.equal(review.details().available,false);assert.equal(review.confirm(),false);assert.equal(game.tree,tree);assert.equal(tower.level,2);
});

test('confirmation rechecks balance, ownership, and run identity', () => {
  const game=preview(),review=new PurchaseReview(game,'shield');
  game.tree=2999;assert.equal(review.confirm(),false);assert.equal(game.tree,2999);assert.equal(game.shield,0);
  game.tree=150000;game.access=false;assert.equal(review.confirm(),false);assert.equal(game.tree,150000);
  game.allowPreview();game.newRun();assert.equal(review.details().available,false);assert.equal(review.confirm(),false);
});

test('duplicate supply confirmations cannot double-charge or extend active supplies', () => {
  const game=preview();
  for(const kind of ['shield','fertilizer']){
    const review=new PurchaseReview(game,kind);assert.equal(review.confirm(),true);
    const tree=game.tree;assert.equal(review.confirm(),false);assert.equal(new PurchaseReview(game,kind).confirm(),false);assert.equal(game.tree,tree);
  }
  assert.equal(game.shield,50);assert.equal(game.boostUntil,20);assert.equal(game.tree,142000);
});

test('Leaf Storm reviews stop being eligible when battle pauses or pests disappear', () => {
  const game=preview();game.startWave();game.spawn('termite');const review=new PurchaseReview(game,'storm');
  assert.equal(review.details().available,true);game.pause();assert.equal(review.confirm(),false);assert.equal(game.tree,150000);
  game.pause();game.enemies=[];assert.equal(review.confirm(),false);
  game.spawn('termite');assert.equal(review.confirm(),true);assert.equal(game.tree,142000);assert.equal(game.kills,1);
  assert.equal(review.confirm(),false);assert.equal(game.tree,142000);
});

test('a continue review preserves the defeated battle and applies only once', () => {
  const game=preview();game.place('pine',0);game.startWave();game.spawn('termite');game.phase='defeat';game.health=0;
  const towerIds=game.towers.map(tower=>tower.id),queue=[...game.queue],enemies=game.enemies.length;
  const review=new PurchaseReview(game,'continue');assert.equal(review.details().cost,20000);
  assert.equal(review.confirm(),true);assert.equal(review.confirm(),false);assert.equal(game.tree,130000);
  assert.equal(game.wave,1);assert.equal(game.phase,'running');assert.equal(game.health,100);
  assert.deepEqual(game.queue,queue);assert.equal(game.enemies.length,enemies);assert.deepEqual(game.towers.map(tower=>tower.id),towerIds);
});
