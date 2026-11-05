import {CHAPTERS,miniBossFor,MINI_BOSSES} from './engine.js';
import {scoutWave} from './playtest.js';
const chapterStories=[
 [
 ['The Severed Root','At dawn, the oldest root in Emerald Crossing falls silent. Beneath its bark, something is counting down.','oak','The forest has stood for a thousand storms. Today, we stand for it.'],
 ['A Message in the Mandibles','The fallen termites carry metal splinters. These are scouts, not a wandering swarm. Someone sent them.','pine','They tested our reach. Move the next defense farther down the path.'],
 ['The Shell Mark','A broken beetle shell bears a black, branching sigil: the mark of the Severance Engine.','oak','Armor can be broken. What worries me is who forged it.'],
 ['Wings Above the Crossing','Moths scatter over the canopy. Between their wings, a red light opens inside a walking tree of iron.','palm','That thing wears branches. It has never grown a leaf.'],
 ['A False Heart','Ironroot falls, but its furnace keeps beating. A signal pulses east through roots already turning gray.','cypress','Steel borrowed the shape of a tree. It forgot that roots never fight alone.'],
 ['The Green Line','The guardians draw a line across the old crossing. Behind them, seedlings open toward a sliver of sunlight.','oak','Every seed behind us is a forest that has not happened yet. Hold.'],
 ['Teeth in the Quiet','Silence follows the swarm. Then the guardians hear it: a chain turning against steel, beyond the next bend.','pine','I know that sound. Make the last bend count.'],
 ['The Broken Saw','The raider leaves a map carved into its machine: three forests, three root junctions, one final severing.','palm','Emerald was never the prize. It was the door.'],
 ['No Empty Ground','Pests fill the route from bend to bend. Beneath the chaos, the Tree of Life sends a single warm pulse.','oak','It knows we are here. Give it a reason to keep reaching.'],
 ['The Crown Below','The Blight King rises behind its escort. Every insect turns toward the same distant command.','cypress','Cut down the crown. Then we follow the roots east.'],
 ['The Crossing Remembers','The King falls. Fresh roots close around the black sigil, but the light in Sunpetal Meadow is fading.','oak','One forest saved. Two still calling. We answer.']
 ],
 [
 ['The Meadow Without Morning','Sunpetal Meadow should blaze with flowers. Instead, its blossoms face a sun they can no longer feel.','palm','The roots are alive. Something is stealing what they carry.'],
 ['Pollen on the Wind','A gust lifts golden pollen from the last healthy flowers. The swarm turns to follow it.','pine','They can sense the living patches. Defend the bends between them.'],
 ['Beneath the Shell','The beetles drag threads of dark sap behind them. Each thread sinks into the meadow like a stolen vein.','cypress','Keep them under fire. Do not let the blight settle.'],
 ['A Familiar Furnace','Ironroot returns with fresh plates welded over old wounds. This time, its orders are written in the soil.','oak','We have broken one before. We can break another.'],
 ['The Seed Vault','Inside Ironroot is a list of targets. At the top: the buried seed vault beneath the Tree of Life.','palm','They are not only taking this forest. They are taking its future.'],
 ['Amber Answer','Sap rises through the defenders like captured sunlight. The meadow gives its strength back to those protecting it.','oak','Plant where their paths overlap. Let the forest do the rest.'],
 ['The Glass Mask','A sealed figure enters the meadow, tanks hissing behind its shoulders. Grass grays beneath its drifting spray.','mushroom','A sealed mask cannot hide what grows beneath it. Keep my spores on that suit.'],
 ['A Breath Returned','The sprayer falls. For the first time all morning, a flower lifts its face toward the light.','pine','One breath is enough to begin again. Keep the route covered.'],
 ['The Last Bloom','Every remaining swarm converges on the seed vault. The guardians stand among flowers opening behind their feet.','cypress','Let the fast ones meet roots. Let the armored ones meet thorns.'],
 ['King of the Hollow Field','The Blight King crawls through the meadow, its crown tangled with roots stolen from Moonlit Marsh.','palm','The marsh is feeding this thing. Break its hold.'],
 ['Morning, At Last','Gold returns to Sunpetal Meadow. Beyond the flowers, a trail of black water points toward the ancient marsh.','oak','Carry one seed with you. We will need something living in the dark.']
 ],
 [
 ['The Root Beneath the World','Moonlit Marsh holds the oldest root junction. The Severance Engine waits below the water, pulling every swarm toward it.','willow','Listen beneath the noise. The oldest roots still know the way.'],
 ['Lanterns in the Water','Green lights flicker beneath the causeways. Each is a root fighting to keep its connection to the Tree of Life.','pine','Every bend buys another moment. Cover the route, not just the entrance.'],
 ['The Drowned Road','Armored insects emerge from water thick with black sap. Their footsteps strike the causeway like a second heartbeat.','cypress','They have weight. We have patience. Keep them inside our reach.'],
 ['The Engine Walks','Ironroot climbs from the marsh with ancient bark bolted across its chest. Its furnace burns with stolen memory.','oak','That bark belonged to our elders. We take it back.'],
 ['What the Roots Remember','Inside the broken machine, the guardians hear a thousand seasons of wind. The stolen memory finds its way home.','willow','A forest is more than trees. It is everything they remember together.'],
 ['Across the Black Water','The causeway narrows. Behind the guardians, roots rise through stone to hold the road beneath their feet.','palm','The forest is building us a place to stand. Do not give it up.'],
 ['Poison at the Source','A sprayer approaches the exposed junction. One full tank could silence the oldest root forever.','mushroom','Keep the poison on the suit. Do not give it time to recover.'],
 ['The Junction Wakes','The sprayer collapses. Moonlight catches a new leaf growing from the oldest root in the marsh.','willow','It is waking. Finish what we came to do.'],
 ['One Forest, Many Roots','Emerald and Sunpetal answer through the junction. Their strength arrives as the last great escort gathers.','oak','We never stood here alone. We only needed to remember.'],
 ['The Last Severing','The Blight King rises over the junction. Beneath its crown, the command signal beats faster as its strength fails.','cypress','Save your slows for the final bend. This ends with us standing.'],
 ['The Living Canopy','The command falls silent. Across three forests, roots reconnect, flowers turn, and the Tree of Life reaches into a new dawn.','oak','We did not win because we could not fall. We won because we kept growing.']
 ]
];
const harvest=[
 ['The Last Harvest','Copper leaves drift over the seed reserves. Something beneath the fallen leaves is gathering for winter.','oak','Bring the seeds home. Nothing gets past our watch.'],
 ['Borrowed Autumn','Leaf borers emerge carrying the smell of hollow bark. The first reserve remains safe beneath the roots.','pine','One watch finished. More movement beyond the amber leaves.'],
 ['Under Copper Armor','Bark beetles test the stores. Their shells are scarred by a larger creature moving behind the harvest swarm.','cypress','Pierce the shell. Keep the reserves covered.'],
 ['A Sky of Wings','Autumn moths rise above the treetops. Beneath their shadows, blight creeps toward the stored seeds.','palm','Slow their rush. Let the guardians finish what the wind cannot.'],
 ['The Hollow Harvester','The keeper of the empty season arrives. Its escort reaches for every seed the forest needs to survive the cold.','oak','Winter will have its silence. It will not have our future.'],
 ['Seeds for Tomorrow','The Harvester falls. Beneath a blanket of copper leaves, the seed reserves wait safely for spring.','oak','A harvest is a promise. Today, we kept ours.']
];
export function storyScene(game,cleared=game.wave){
 if(!Number.isInteger(cleared)||cleared<0||cleared>game.waveCount)return null;
 const seasonal=game.isEvent;
 let row=seasonal?harvest[cleared]:chapterStories[game.chapter]?.[cleared];if(!row)return null;
 let [title,narration,speaker,dialogue]=row;
 if(seasonal&&!game.isHarvest){title=['The Haunted Watch','Lanterns in the Roots','Hollow Armor','The Webbed Crossing','The Hollow King','Dawn Beyond the Lanterns'][cleared];narration=['Lanterns reveal a path through the haunted grove. Something hollow follows their light.','The first escort falls, but another glow moves between the roots.','Hollow shells crack against the guardians. Webs tremble above the route.','Wings stir the webs. Keep every bend covered as the darkness gathers.','The Hollow King approaches behind the last escort. The lanterns burn brighter.','The King falls. Dawn returns to the grove, and the lanterns can finally rest.'][cleared];dialogue=cleared===5?'The watch is over. Carry the light back to the forest.':'Keep the lanterns burning. Hold the crossing.';}
 if(!seasonal&&game.encounters!==1&&[3,4,6,7].includes(cleared)){title='The Old Watch';narration='The guardians follow the old route as another escort gathers beyond the next bend. The roots carry news from the forest ahead.';dialogue='This watch has its own rhythm. Keep the bends covered and protect the roots.';}
 if(game.isVeteran&&!seasonal){title=`Echoes of Severance · ${title}`;narration=`The roots remember this battle. Now the remaining machines return with reinforced shells and a faster command. ${narration}`;}
 const next=cleared<game.waveCount?scoutWave(game.chapter,cleared+1,game.enemyRules,game.mode,game.difficulty,game.encounters):null;
 const mini=next?miniBossFor(game.chapter,cleared+1,game.mode,game.encounters):null;
 return {title,narration,speaker,dialogue,chapter:seasonal?game.runName:CHAPTERS[game.chapter].name,eyebrow:cleared===0?'PROLOGUE':cleared===game.waveCount?'CHAPTER COMPLETE':`AFTER WAVE ${cleared} · BEFORE WAVE ${cleared+1}`,hint:next?`${mini?MINI_BOSSES[mini].name:next.title}: ${next.tip}`:'The story continues in your campaign. Your earned progression is kept.',ending:!next,tone:seasonal?'harvest':game.chapter===2?'marsh':game.chapter===1?'meadow':'crossing'};
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
