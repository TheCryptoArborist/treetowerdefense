import {CHAPTERS,miniBossFor,MINI_BOSSES} from './engine.js';
import {scoutWave} from './playtest.js';
const chapterStories=[
 [
 ['The Severed Root','Something is damaging the roots beneath Emerald Crossing. A swarm is approaching the Tree of Life.','oak','Here they come. Protect the Tree of Life!'],
 ['A Message in the Mandibles','The fallen termites carry metal splinters. These are scouts, not a wandering swarm. Someone sent them.','pine','They tested our reach. Move the next defense farther down the path.'],
 ['The Shell Mark','A broken beetle shell bears a black, branching sigil: the mark of the Severance Engine.','oak','Armor can be broken. What worries me is who forged it.'],
 ['Ironroot Approaches','The moth swarm has passed. An Ironroot Tree Bot steps onto the path, heading for the Tree of Life.','palm','Ironroot is coming! Slow it down and protect the Tree of Life.'],
 ['The Blight Spreads','The Ironroot attack is over, but the blight is spreading toward Sunpetal Meadow. More pests approach the crossing.','cypress','Stay ready. We still have a forest to defend.'],
 ['The Green Line','The guardians draw a line across the old crossing. Behind them, seedlings open toward a sliver of sunlight.','oak','Every seed behind us is a forest that has not happened yet. Hold.'],
 ['Teeth in the Quiet','Silence follows the swarm. Then the guardians hear it: a chain turning against steel, beyond the next bend.','pine','I know that sound. Make the last bend count.'],
 ['Hold the Crossing','The chainsaw raider attack is over. Another swarm is gathering beyond the next bend.','palm','We are still standing. Keep the crossing covered.'],
 ['No Empty Ground','Pests fill the route from bend to bend. Beneath the chaos, the Tree of Life sends a single warm pulse.','oak','It knows we are here. Give it a reason to keep reaching.'],
 ['The Crown Below','The Blight King rises behind its escort. Every insect turns toward the same distant command.','cypress','Cut down the crown. Then we follow the roots east.'],
 ['Emerald Crossing Secured','Emerald Crossing is safe for now. The next attack is gathering in Sunpetal Meadow.','oak','We held the crossing. Next stop: Sunpetal Meadow!']
 ],
 [
 ['The Meadow Without Morning','Sunpetal Meadow should blaze with flowers. Instead, its blossoms face a sun they can no longer feel.','palm','The roots are alive. Something is stealing what they carry.'],
 ['Pollen on the Wind','A gust lifts golden pollen from the last healthy flowers. The swarm turns to follow it.','pine','They can sense the living patches. Defend the bends between them.'],
 ['Beneath the Shell','The beetles drag threads of dark sap behind them. Each thread sinks into the meadow like a stolen vein.','cypress','Keep them under fire. Do not let the blight settle.'],
 ['Ironroot in the Meadow','An Ironroot Tree Bot pushes into the meadow. Its metal feet crush the flowers along the path.','oak','Another Ironroot! Keep it away from the Tree of Life.'],
 ['Protect the Seed Stores','The Ironroot attack is over. Another swarm is moving toward the seed stores beneath the Tree of Life.','palm','Keep the seed stores protected. We cannot let them through.'],
 ['Amber Answer','Sap rises through the defenders like captured sunlight. The meadow gives its strength back to those protecting it.','oak','Plant where their paths overlap. Let the forest do the rest.'],
 ['Blight Sprayer Ahead','A Blight Sprayer enters the meadow. Its chemical spray withers the grass along the path.','mushroom','Poison stops its recovery. Keep it under fire.'],
 ['The Next Swarm','The sprayer attack has ended, but more pests are approaching the Tree of Life.','pine','Hold your positions. Another wave is coming.'],
 ['The Last Bloom','Every remaining swarm converges on the seed vault. The guardians stand among flowers opening behind their feet.','cypress','Let the fast ones meet roots. Let the armored ones meet thorns.'],
 ['King of the Hollow Field','The Blight King crawls through the meadow, its crown tangled with roots stolen from Moonlit Marsh.','palm','The marsh is feeding this thing. Break its hold.'],
 ['Sunpetal Meadow Secured','The meadow has survived the attack. The guardians trace the spreading blight toward Moonlit Marsh.','oak','The meadow is safe. Moonlit Marsh is next.']
 ],
 [
 ['The Root Beneath the World','Moonlit Marsh holds the oldest root junction. The Severance Engine waits below the water, pulling every swarm toward it.','willow','Listen beneath the noise. The oldest roots still know the way.'],
 ['Lanterns in the Water','Green lights flicker beneath the causeways. Each is a root fighting to keep its connection to the Tree of Life.','pine','Every bend buys another moment. Cover the route, not just the entrance.'],
 ['The Drowned Road','Armored insects emerge from water thick with black sap. Their footsteps strike the causeway like a second heartbeat.','cypress','They have weight. We have patience. Keep them inside our reach.'],
 ['The Engine Walks','Ironroot climbs from the marsh with ancient bark bolted across its chest. Its furnace burns with stolen memory.','oak','That bark belonged to our elders. We take it back.'],
 ['Guard the Old Roots','The Ironroot attack is over. The blight still threatens the oldest roots in Moonlit Marsh.','willow','Stay ready. The root junction still needs protection.'],
 ['Across the Black Water','The causeway narrows. Behind the guardians, roots rise through stone to hold the road beneath their feet.','palm','The forest is building us a place to stand. Do not give it up.'],
 ['Sprayer at the Junction','A Blight Sprayer approaches the exposed root junction. Its chemical tanks are ready to discharge.','mushroom','Poison stops its recovery. Keep it away from those roots.'],
 ['Hold the Junction','The sprayer attack has ended. More pests are closing in on the root junction.','willow','Keep the route covered. We are close to the end.'],
 ['One Forest, Many Roots','Emerald and Sunpetal answer through the junction. Their strength arrives as the last great escort gathers.','oak','We never stood here alone. We only needed to remember.'],
 ['The Last Severing','The Blight King rises over the junction. Beneath its crown, the command signal beats faster as its strength fails.','cypress','Save your slows for the final bend. This ends with us standing.'],
 ['The Living Canopy','The last wave is over. Across all three forests, the roots begin to recover and the Tree of Life stands.','oak','The Tree of Life is safe. We held all three forests!']
 ]
];
const harvest=[
 ['The Last Harvest','Copper leaves drift over the seed reserves. Something beneath the fallen leaves is gathering for winter.','oak','Bring the seeds home. Nothing gets past our watch.'],
 ['Borrowed Autumn','Leaf borers emerge carrying the smell of hollow bark. The first reserve remains safe beneath the roots.','pine','One watch finished. More movement beyond the amber leaves.'],
 ['Under Copper Armor','Bark beetles test the stores. Their shells are scarred by a larger creature moving behind the harvest swarm.','cypress','Pierce the shell. Keep the reserves covered.'],
 ['A Sky of Wings','Autumn moths rise above the treetops. Beneath their shadows, blight creeps toward the stored seeds.','palm','Slow their rush. Let the guardians finish what the wind cannot.'],
 ['The Hollow Harvester','The keeper of the empty season arrives. Its escort reaches for every seed the forest needs to survive the cold.','oak','Winter will have its silence. It will not have our future.'],
 ['Seeds for Tomorrow','The last wave has passed. The seed reserves are safe, and the forest can prepare for winter.','oak','The seeds are safe. We held the harvest!']
];
export function storyScene(game,cleared=game.wave){
 if(!Number.isInteger(cleared)||cleared<0||cleared>game.waveCount)return null;
 const seasonal=game.isEvent;
 let row=seasonal?harvest[cleared]:chapterStories[game.chapter]?.[cleared];if(!row)return null;
 let [title,narration,speaker,dialogue]=row;
 if(seasonal&&!game.isHarvest){title=['The Haunted Watch','Lanterns in the Roots','Hollow Armor','The Webbed Crossing','The Hollow King','Dawn Beyond the Lanterns'][cleared];narration=['Lanterns reveal a path through the haunted grove. Something hollow follows their light.','The first escort falls, but another glow moves between the roots.','Hollow shells crack against the guardians. Webs tremble above the route.','Wings stir the webs. Keep every bend covered as the darkness gathers.','The Hollow King approaches behind the last escort. The lanterns burn brighter.','The final wave has passed. Dawn returns to the grove, and the lanterns can finally rest.'][cleared];dialogue=cleared===5?'The watch is over. Carry the light back to the forest.':'Keep the lanterns burning. Hold the crossing.';}
 if(!seasonal&&game.encounters!==1&&[3,4,6,7].includes(cleared)){title='The Next Swarm';narration='The previous wave is over. Another swarm is gathering beyond the next bend.';dialogue='Stay ready. Protect the Tree of Life.';}
 if(game.isVeteran&&!seasonal){title=`Echoes of Severance · ${title}`;narration=`The roots remember this battle. Now the remaining machines return with reinforced shells and a faster command. ${narration}`;}
 const next=cleared<game.waveCount?scoutWave(game.chapter,cleared+1,game.enemyRules,game.mode,game.difficulty,game.encounters,game.eventVersion):null;
 const mini=next?miniBossFor(game.chapter,cleared+1,game.mode,game.encounters):null;
 const finalApproach=!!next&&cleared===game.waveCount-1;
 const enemyName=mini?MINI_BOSSES[mini].name:finalApproach?(game.isHarvest?'Hollow Harvester':seasonal?'Hollow King':'Blight King'):null;
 return {title,narration,speaker,dialogue,chapter:seasonal?game.runName:CHAPTERS[game.chapter].name,eyebrow:cleared===0?'PROLOGUE':cleared===game.waveCount?'CHAPTER COMPLETE':`AFTER WAVE ${cleared} · BEFORE WAVE ${cleared+1}`,hint:next?`${mini?MINI_BOSSES[mini].name:next.title}: ${next.tip}`:'The story continues in your campaign. Your earned progression is kept.',ending:!next,tone:seasonal?'harvest':game.chapter===2?'marsh':game.chapter===1?'meadow':'crossing',cinematic:!next?'renewal':mini||finalApproach?'warning':'defend',enemyBoss:mini,enemyName,enemyKind:finalApproach?'boss':mini?'beetle':['beetle','moth','blight'][cleared%3]};
}
// A per-run latch: draws cannot reopen a scene; replay never spends or starts waves.
export function createStoryDirector({dialog,getGame,blocked,render,onClose,enabled=()=>true}){
 const seen=new WeakMap();let continuation=null,owner=null,runOwner=null;
 dialog.addEventListener('close',()=>{const callback=continuation;continuation=null;const valid=owner===getGame()&&runOwner===getGame().runReport;owner=null;runOwner=null;if(valid&&callback)callback();onClose();});
 return {
  open(cleared,{replay=false,after=null}={}){
   const g=getGame();if(dialog.open||blocked()||!g.access||!replay&&!enabled())return false;
   const scene=storyScene(g,cleared);if(!scene)return false;
   const key=g.runReport;let stages=seen.get(key);if(!stages){stages=new Set();seen.set(key,stages);}if(!replay&&stages.has(cleared))return false;
   stages.add(cleared);owner=g;runOwner=g.runReport;continuation=after;
   if(g.phase==='running')g.pause();render(scene);dialog.showModal();return true;
  },
  close(){if(dialog.open)dialog.close();}
 };
}

export function storyCheckpoint(game){return Math.max(0,game.wave-(['running','paused','defeat'].includes(game.phase)?1:0));}
