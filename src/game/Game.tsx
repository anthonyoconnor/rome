'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Coins, Users, BriefcaseBusiness, Pause, Play, FastForward, Grid2X2, MousePointer2, Hammer, Minus, Plus, Focus, Volume2, VolumeX, CircleHelp, RotateCcw, Landmark, Leaf, Droplets, Check, X, ArrowUpRight, ChevronRight, Sparkles, Flag, TrendingUp, LockKeyhole, Map, Sun, Route } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUILD_ORDER, CAPACITY, DEFS, GRACE, SERVICES, TIERS, UPGRADE_TIME, type Kind } from './config';
import { appealDetails, buildingAt, canPlace, charter, createCity, demolish, key, place, tick, toggleBuilding, type City } from './simulation';
import { pick, project, Renderer, type View } from './scene';
import { ASSET_NAMES, assetUrl, buildingAsset, loadArtwork } from './assets';
import { createVisualScene } from './visual-scenes';

const fmt=(n:number)=>Math.floor(n).toLocaleString('en-US');
const coin=(n:number)=>`${n>0?'+':''}${n.toFixed(1)}`;
function Tip({label,children}:{label:string;children:ReactNode}) { return <Tooltip><TooltipTrigger render={children as React.ReactElement}/><TooltipContent className="game-tooltip">{label}</TooltipContent></Tooltip>; }
function Art({kind,tier=2,large=false}:{kind:Kind;tier?:number;large?:boolean}) {
 return <span className={`building-art ${large?'large':''} ${kind==='road'?'road-art':''}`} aria-hidden="true"><img src={assetUrl(buildingAsset(kind,tier))} alt="" draggable={false}/></span>;
}

export default function Game(){
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),renderer=useRef<Renderer|null>(null),city=useRef<City|null>(null);
 if(!city.current)city.current=import.meta.env.DEV?createVisualScene(new URLSearchParams(location.search).get('scene')):createCity();
 const view=useRef<View>({camera:{x:0,y:0,zoom:.8},hover:null,tool:'inspect',selected:null,overlay:'none',grid:false,time:0});
 const [,redraw]=useState(0),[help,setHelp]=useState(false),[restart,setRestart]=useState(false),[message,setMessage]=useState(''),[muted,setMuted]=useState(true),[dismissed,setDismissed]=useState(0),[charterOpen,setCharterOpen]=useState(false),[sidebarOpen,setSidebarOpen]=useState(false);
 const [artCount,setArtCount]=useState(0),[artReady,setArtReady]=useState(false),[artError,setArtError]=useState('');
 const readyRef=useRef(false);
 useEffect(()=>{void loadArtwork(setArtCount).then(()=>{readyRef.current=true;setArtReady(true);}).catch(error=>setArtError(error.message));},[]);
 const modal=useRef(false),muteRef=useRef(true),audioRef=useRef<AudioContext|null>(null);
 modal.current=help||restart||!!(city.current.completed&&!city.current.continued);muteRef.current=muted;
 const update=()=>redraw(v=>v+1);
 function sound(type:'build'|'remove'|'up'='build'){if(muteRef.current)return;try{const ac=audioRef.current??new AudioContext();audioRef.current=ac;void ac.resume();const oscillator=ac.createOscillator(),gain=ac.createGain();oscillator.connect(gain);gain.connect(ac.destination);oscillator.type='sine';oscillator.frequency.setValueAtTime(type==='up'?660:type==='remove'?190:440,ac.currentTime);oscillator.frequency.exponentialRampToValueAtTime(type==='remove'?100:880,ac.currentTime+.12);gain.gain.setValueAtTime(.045,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.22);oscillator.start();oscillator.stop(ac.currentTime+.23);}catch{/* Sound is optional. */}}
 function tool(kind:View['tool']){view.current.tool=kind;view.current.selected=null;setMessage('');setSidebarOpen(false);update();}
 function center(){const r=renderer.current;if(!r)return;const z=Math.min(.88,Math.max(.42,Math.min(r.width/1680,r.height/940))),[x,y]=project(16,16);view.current.camera={x:r.width*.56-x*z,y:r.height*.44-y*z,zoom:z};update();}
 function zoom(factor:number,sx?:number,sy?:number){const r=renderer.current;if(!r)return;const c=view.current.camera,x=sx??r.width/2,y=sy??r.height/2,next=Math.min(1.8,Math.max(.25,c.zoom*factor));c.x=x-(x-c.x)*next/c.zoom;c.y=y-(y-c.y)*next/c.zoom;c.zoom=next;update();}
 function buildAt(x:number,y:number){const c=city.current!,v=view.current;
  if(v.tool==='inspect'){v.selected=buildingAt(c,x,y)?.id??null;if(v.selected)setSidebarOpen(true);setMessage('');}
  else if(v.tool==='demolish'){const b=buildingAt(c,x,y);if(b?.kind==='forum'){setMessage('The Forum is the heart of your town.');return;}if(demolish(c,x,y)){sound('remove');setMessage('Space cleared · 75% of construction cost returned');v.selected=null;}}
  else {const result=place(c,v.tool,x,y);if(!result.valid){if(result.reason!=='This space is already occupied')setMessage(result.reason);}else {sound();setMessage(result.connected?'':result.reason);}}
  update();
 }
 useEffect(()=>{
  if(!canvas.current||!stage.current)return;
  const r=new Renderer(canvas.current);renderer.current=r;
  let first=true;const resize=new ResizeObserver(([entry])=>{const previousWidth=r.width,previousHeight=r.height;r.resize(entry.contentRect.width,entry.contentRect.height);if(first){center();first=false;}else{view.current.camera.x+=(r.width-previousWidth)/2;view.current.camera.y+=(r.height-previousHeight)/2;}});resize.observe(stage.current);
  let id=0,last=performance.now(),accumulator=0,lastUI=0,lastEvent=0,lastDraw=0;
  const frame=(now:number)=>{id=requestAnimationFrame(frame);if(document.hidden){last=now;return;}if(now-lastDraw<1000/30)return;lastDraw=now;const dt=Math.min(.1,(now-last)/1000);last=now;const c=city.current!;
   if(!document.hidden&&!modal.current&&readyRef.current){accumulator+=dt*c.speed;while(accumulator>=.5){tick(c,.5);accumulator-=.5;}view.current.time+=dt;}
   if(c.events.length&&c.events[c.events.length-1].id>lastEvent){lastEvent=c.events[c.events.length-1].id;if(c.events[c.events.length-1].type==='growth')sound('up');}
   r.draw(c,view.current);if(now-lastUI>250){lastUI=now;update();}
  };id=requestAnimationFrame(frame);
  const el=canvas.current;let pressed=false,panning=false,moved=false,prev:[number,number]=[0,0],lastTile:[number,number]|null=null;
  const point=(e:PointerEvent|WheelEvent)=>{const rect=el.getBoundingClientRect();return [e.clientX-rect.left,e.clientY-rect.top] as [number,number];};
  const targetTile=(q:[number,number])=>view.current.tool==='inspect'||view.current.tool==='demolish'?r.hitTest(...q,view.current.camera,city.current!):pick(...q,view.current.camera);
  const down=(e:PointerEvent)=>{if(modal.current||!readyRef.current)return;el.focus();const q=point(e);pressed=true;moved=false;panning=e.button!==0||e.altKey||view.current.tool==='inspect';prev=q;lastTile=targetTile(q);el.setPointerCapture(e.pointerId);if(!panning)buildAt(...lastTile);};
  const move=(e:PointerEvent)=>{const q=point(e);view.current.hover=targetTile(q);
   if(pressed&&panning){const dx=q[0]-prev[0],dy=q[1]-prev[1];if(Math.abs(dx)+Math.abs(dy)>2)moved=true;view.current.camera.x+=dx;view.current.camera.y+=dy;}
   if(pressed&&!panning&&(view.current.tool==='road'||view.current.tool==='demolish')){const target=view.current.hover;if(lastTile&&key(...lastTile)!==key(...target)){let[x,y]=lastTile;while(x!==target[0]){x+=Math.sign(target[0]-x);buildAt(x,y);}while(y!==target[1]){y+=Math.sign(target[1]-y);buildAt(x,y);}lastTile=target;}}
   prev=q;
  };
  const up=(e:PointerEvent)=>{if(pressed&&panning&&!moved&&e.button===0&&view.current.tool==='inspect')buildAt(...targetTile(point(e)));pressed=false;panning=false;lastTile=null;if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);update();};
  const leave=()=>{if(!pressed)view.current.hover=null;};
  const wheel=(e:WheelEvent)=>{e.preventDefault();zoom(e.deltaY<0?1.08:1/1.08,...point(e));};
  const context=(e:MouseEvent)=>e.preventDefault();
  const keyboard=(e:KeyboardEvent)=>{if(modal.current||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement)?.closest('input,select,[role="listbox"],[data-slot="select-content"]'))return;
   const k=e.key.toLowerCase(),build=BUILD_ORDER.find(t=>DEFS[t].shortcut===k);
   if(build){if(!DEFS[build].unlock||city.current!.peak>=DEFS[build].unlock!)tool(build);e.preventDefault();}
   if(k==='escape'){tool('inspect');view.current.hover=null;}
   if(k===' '&&!(e.target as HTMLElement)?.closest('button')){e.preventDefault();city.current!.speed=city.current!.speed?0:1;update();}
   if(k==='delete'||k==='b')tool('demolish');if(k==='g'){view.current.grid=!view.current.grid;update();}
   if(k==='='||k==='+')zoom(1.15);if(k==='-')zoom(1/1.15);
   const moves:Record<string,[number,number]>={arrowleft:[35,0],a:[35,0],arrowright:[-35,0],d:[-35,0],arrowup:[0,35],w:[0,35],arrowdown:[0,-35],s:[0,-35]};if(moves[k]){e.preventDefault();view.current.camera.x+=moves[k][0];view.current.camera.y+=moves[k][1];}
  };
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',leave);el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('contextmenu',context);window.addEventListener('keydown',keyboard);
  return()=>{cancelAnimationFrame(id);resize.disconnect();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('pointerleave',leave);el.removeEventListener('wheel',wheel);el.removeEventListener('contextmenu',context);window.removeEventListener('keydown',keyboard);};
 },[]);

 const c=city.current,v=view.current,b=c.buildings.find(b=>b.id===v.selected),goals=charter(c),activeGoal=goals.find(g=>!g.done)??goals[goals.length-1],allDone=goals.filter(g=>g.done).length;
 const buildingTool=v.tool!=='inspect'&&v.tool!=='demolish'?v.tool:null;
 const preview=buildingTool&&v.hover?canPlace(c,buildingTool,...v.hover):null;
 const lastNotice=[...c.events].reverse().find(e=>e.id>dismissed&&e.type!=='growth'&&e.type!=='win');
 const appeal=b?appealDetails(c,b):null;
 const houses=c.buildings.filter(b=>b.kind==='house'),empty=houses.length===0;
 const has=(kind:Kind)=>c.buildings.some(b=>b.kind===kind&&b.connected&&!b.paused);
 const nextBuild:Kind=empty?'house':!has('well')?'well':!has('market')?'market':c.peak>=64&&!has('bath')?'bath':c.peak>=128&&!has('theater')?'theater':houses.length<8?'house':'garden';
 const guidance:Record<string,[string,string,string]>={
  house:[empty?'Every city starts small.':'A little room to grow.',empty?'The Forum is ready. Build a few homes along the street, then add a well to welcome your first residents.':'More homes bring more neighbors. Keep them within reach of water and markets, and leave room for future services.',empty?'Build your first homes':'Welcome more neighbors'],
  well:['Bring fresh water home.','A connected well welcomes your first residents. The blue streets show how far its water will reach.','Add a neighborhood well'],
  market:['Give neighbors a gathering place.','A market lets huts become cottages. Put it beside a connected road, within reach of your homes.','Build your first market'],
  bath:['A little civic comfort.','Bathhouses and 30 appeal help cottages become courtyard homes. Gardens and the Forum make good neighbors.','Build a bathhouse'],
  theater:['Let your town find its voice.','A theater and 60 appeal create townhouses. Add gardens where neighborhoods need a little more beauty.','Build a theater'],
  garden:['Good streets. Happy neighbors.','Select a home to see what it needs next. Gardens add appeal; service buildings need spare capacity for upgrades.','Plant a little beauty'],
 };
 const seasons=['Spring','Summer','Autumn','Winter'];
 const overlayLabels:Record<View['overlay'],string>={none:'Natural view',roads:'Road connections',well:'Water coverage',market:'Market coverage',bath:'Bath coverage',theater:'Theater coverage',appeal:'Neighborhood appeal'};
 return <TooltipProvider delay={250}><main className="game-shell">
  <header className="topbar">
   <div className="brand"><div className="brand-mark"><Landmark size={27}/></div><div><h1>LITTLE ROME</h1><span>A TOWN OF YOUR OWN</span></div></div>
   <div className="resources">
    <div className="resource treasury"><Coins/><div><small>TREASURY</small><strong className={c.coins<0?'negative':''}>{fmt(c.coins)} <em>denarii</em></strong></div><span className={`income-tag ${c.net<0?'negative':''}`}>{coin(c.net)}<small>/mo</small></span></div>
    <div className="resource"><Users/><div><small>RESIDENTS</small><strong>{fmt(c.population)} <em>/ {houses.reduce((s,h)=>s+CAPACITY[h.tier],0)}</em></strong></div></div>
    <Tip label={`${c.employed} of ${Math.floor(c.population/2)} workers employed. Unemployment slows new arrivals.`}><div className="resource jobs" tabIndex={0}><BriefcaseBusiness/><div><small>JOBS</small><strong>{c.employed}<em> / {c.jobs}</em></strong></div></div></Tip>
   </div>
   <div className="calendar">{seasons[Math.floor(c.month/3)%4]} · Year {Math.floor(c.month/12)+1}</div><div className="top-actions"><Tip label={muted?'Enable sound':'Mute sound'}><button className="icon-button" onClick={()=>{setMuted(!muted);muteRef.current=!muted;if(muted)sound();}} aria-label={muted?'Enable sound':'Mute sound'}>{muted?<VolumeX/>:<Volume2/>}</button></Tip><Tip label="How to build your town"><button className="icon-button" onClick={()=>setHelp(true)} aria-label="Help"><CircleHelp/></button></Tip><Tip label="Start a new town"><button className="icon-button" onClick={()=>setRestart(true)} aria-label="Restart town"><RotateCcw/></button></Tip></div>
  </header>
  <div className="game-body">
   <aside className={`town-panel ${b?'has-selection':buildingTool?'has-tool':'has-guidance'} ${sidebarOpen?'mobile-open':''}`}>
    <button className="mobile-panel-close" onClick={()=>setSidebarOpen(false)} aria-label="Close town panel"><X size={18}/></button>
    <div className="town-heading"><span className="eyebrow">THE RIVER PROVINCE</span><h2>Little Rome<span>Ⅰ</span></h2><div className="town-status"><span/>{c.completed?'A flourishing town':c.peak>=128?'A growing town':c.peak>=64?'A lively settlement':'A new beginning'}</div></div>
    <section className="charter-card"><div className="section-heading"><span><Flag size={15}/> TOWN CHARTER</span><button onClick={()=>setCharterOpen(!charterOpen)} aria-label={charterOpen?'Collapse charter':'Show all charter goals'}>{allDone}/7 <ChevronRight size={14} className={charterOpen?'rotate':''}/></button></div><h3>{c.completed?'Your charter is fulfilled':activeGoal.title}</h3><p>{activeGoal.text}</p><Progress value={activeGoal.value/activeGoal.target*100} aria-label={activeGoal.text}/><div className="progress-meta"><span>{activeGoal.value} / {activeGoal.target}</span><span>{c.completed?'Beautifully done':'One step at a time'}</span></div>{charterOpen&&<ol className="charter-list">{goals.map(g=><li key={g.title} className={g.done?'done':''}>{g.done?<Check size={14}/>:<span className="goal-dot"/>}<span>{g.text}</span><small>{g.value}/{g.target}</small></li>)}</ol>}</section>
    <div className="panel-divider"><span>{b?'IN YOUR TOWN':buildingTool?'PLAN YOUR NEXT ADDITION':'YOUR NEXT CHAPTER'}</span></div>
    <section className="inspector" aria-label="Building details">
     {b?<>
      <div className="inspector-title"><h3>{b.kind==='house'?TIERS[b.tier]:DEFS[b.kind].name}</h3><button className="close-button" onClick={()=>{v.selected=null;update();}} aria-label="Close building details"><X size={16}/></button></div>
      <div className="art-stage"><Art kind={b.kind} tier={b.tier} large/>{b.kind==='house'&&<span className="tier-badge">TIER {b.tier} / IV</span>}</div>
      <p className={`connection ${b.connected&&!b.paused?'good':'warning'}`}>{b.paused?<Pause size={14}/>:b.connected?<Check size={14}/>:<Route size={14}/>} {b.paused?'Building suspended':b.connected?'Connected to the Forum':'Needs a road to the Forum'}</p>
      {b.kind==='house'?<>
       <div className="stat-pair"><span><Users size={15}/>Residents<strong>{fmt(b.residents)} / {CAPACITY[b.tier]}</strong></span><span><Leaf size={15}/>Appeal<strong>{b.appeal} / 100</strong></span></div>
       <div className="needs-list">{SERVICES.map((s,i)=><div key={s} className={b.assignments[s]?'met':i<b.tier?'unmet':'future'}>{b.assignments[s]?<Check size={14}/>:<span className="need-circle"/>}<span>{DEFS[s].name}</span><small>{b.assignments[s]?'Provided':`Tier ${i+1}`}</small></div>)}</div>
       <div className="growth-box"><h4>{b.currentNeeds.length?'This neighborhood needs care':b.tier===4?'A beautiful place to live':`Next: ${TIERS[b.tier+1]}`}</h4>{b.needs.length?<ul>{b.needs.map(n=><li key={n}>{n}</li>)}</ul>:<p>{b.tier===4?'Your residents have everything they need.':b.residents<CAPACITY[b.tier]*.5?'Waiting for more neighbors to arrive.':'Everything is in place. Your homes are improving.'}</p>}{b.tier<4&&b.growth>0&&<Progress value={b.growth/UPGRADE_TIME*100} aria-label="Housing improvement"/>}{b.currentNeeds.length>0&&b.residents>0&&<p className="warning">{Math.max(0,Math.ceil(GRACE-b.shortage))} seconds to restore services before decline.</p>}</div>
       <details className="appeal-detail"><summary>What shapes this neighborhood?</summary><p>Landscape +{appeal!.base}<br/>Gardens +{appeal!.gardens}<br/>Civic amenities +{appeal!.civic}<br/>Workshop noise −{appeal!.noise}</p></details>
      </>:<><p className="description">{DEFS[b.kind].description}</p>{DEFS[b.kind].capacity&&<div className="capacity-box"><div><span>Reserved service capacity</span><strong>{c.serviceUsed.get(b.id)??0} / {DEFS[b.kind].capacity}</strong></div><Progress value={(c.serviceUsed.get(b.id)??0)/DEFS[b.kind].capacity!*100} aria-label="Service capacity"/><small>Includes room for residents still arriving.</small></div>}<div className="finance-lines"><div><span>Monthly upkeep</span><strong>{DEFS[b.kind].upkeep} denarii</strong></div><div><span>Jobs provided</span><strong>{b.paused?0:DEFS[b.kind].jobs}</strong></div></div>{b.kind!=='forum'&&<button className="secondary-button wide" onClick={()=>{toggleBuilding(c,b);update();}}>{b.paused?<Play size={15}/>:<Pause size={15}/>} {b.paused?'Reopen building':'Suspend building'}</button>}</>}
     </>:buildingTool?<>
      <h3>{DEFS[buildingTool].name}</h3><div className="art-stage"><Art kind={buildingTool} tier={1} large/><span className="tier-badge">{DEFS[buildingTool].size} × {DEFS[buildingTool].size} TILES</span></div><p className="description">{DEFS[buildingTool].description}</p><div className="finance-lines"><div><span>Construction</span><strong><Coins size={14}/> {DEFS[buildingTool].cost}</strong></div><div><span>Monthly upkeep</span><strong>{DEFS[buildingTool].upkeep}</strong></div>{DEFS[buildingTool].range&&<div><span>Reach along roads</span><strong>{DEFS[buildingTool].range} steps</strong></div>}</div><div className="builder-note"><MousePointer2 size={17}/><p>{buildingTool==='road'?'Click and drag to lay a street.':'Choose a clear space beside a connected road.'}<br/><small>Esc to return to inspection</small></p></div>
     </>:v.tool==='demolish'?<><h3>Make room for a new idea</h3><div className="empty-emblem"><Hammer size={34}/></div><p className="description">Click a building or drag across roads to clear them. You receive 75% of their construction cost.</p><p className="builder-note">Residents in demolished homes leave immediately. Check your service connections before removing roads.</p></>:<>
      <div className="welcome-art"><Art kind={nextBuild} tier={empty?1:3} large/><span className="art-spark">✦</span></div><h3>{guidance[nextBuild][0]}</h3><p className="description">{guidance[nextBuild][1]}</p><button className="primary-button wide" onClick={()=>tool(nextBuild)}>{guidance[nextBuild][2]}<ArrowUpRight size={17}/></button><div className="quiet-tip"><Leaf size={17}/><p>{empty?'Leave a little room for gardens and gathering places. Your town will thank you.':'Beautiful neighborhoods grow. Keep workshops a few streets away from your best homes.'}</p></div>
     </>}
    </section>
    <div className="ledger"><div className="section-heading"><span><Coins size={14}/> TOWN ACCOUNTS</span><small>PER MONTH</small></div><div><span>Taxes & workshops</span><strong className="good">+{c.income.toFixed(1)}</strong></div><div><span>Public services</span><strong>−{c.upkeep.toFixed(1)}</strong></div><div className="ledger-total"><span>Balance</span><strong className={c.net<0?'negative':'good'}>{coin(c.net)}</strong></div></div>
   </aside>
   <div className="map-area" ref={stage}>
    <canvas ref={canvas} tabIndex={0} className={`town-canvas ${v.tool==='inspect'?'pan-cursor':'build-cursor'}`} aria-label="Town map. Use build buttons or keys 1 to 8, click to place, drag streets, right-drag to pan, and scroll to zoom."/>
    <button className="mobile-town-button" onClick={()=>setSidebarOpen(!sidebarOpen)} aria-label="Open town panel"><Landmark size={16}/> Town <span>{allDone}/7</span></button>
    <div className="map-top"><div className="date-plaque"><Sun size={19}/><div><strong>{seasons[Math.floor(c.month/3)%4]}, Year {Math.floor(c.month/12)+1}</strong><span>{c.speed===0?'A moment to plan':'On the banks of the Tiber'}</span></div></div><div className="view-controls"><Select value={v.overlay} onValueChange={value=>{v.overlay=value as View['overlay'];v.selected=null;update();}}><SelectTrigger className="overlay-select" aria-label="Map overlay"><Map size={16}/><SelectValue>{overlayLabels[v.overlay]}</SelectValue></SelectTrigger><SelectContent className="overlay-menu">{Object.entries(overlayLabels).map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Tip label="Show building grid · G"><button className={`map-button ${v.grid?'active':''}`} onClick={()=>{v.grid=!v.grid;update();}} aria-label="Toggle grid" aria-pressed={v.grid}><Grid2X2 size={18}/></button></Tip></div></div>
    {v.overlay!=='none'&&<div className="overlay-legend">{v.overlay==='appeal'?<><span className="appeal-scale"/>Low appeal → high appeal</>:<><i/>{v.overlay==='roads'?'Connected streets · red streets are disconnected':'Highlighted streets are within service reach'}</>}</div>}
    {lastNotice&&<div className="notice" role="status"><Sparkles size={21}/><div><strong>{lastNotice.title}</strong><p>{lastNotice.message}</p></div><button onClick={()=>setDismissed(lastNotice.id)} aria-label="Dismiss notice"><X size={15}/></button></div>}
    {c.speed===0&&<div className="paused-label"><Pause size={13}/> PAUSED · TAKE YOUR TIME</div>}
    <div className="map-bottom"><div className="map-caption"><span>PROVINCIA TIBERINA</span><small>Founded with a little ambition</small></div><div className="camera-controls"><button onClick={()=>zoom(1/1.2)} aria-label="Zoom out"><Minus size={17}/></button><span>{Math.round(v.camera.zoom*100)}%</span><button onClick={()=>zoom(1.2)} aria-label="Zoom in"><Plus size={17}/></button><button onClick={center} aria-label="Center town"><Focus size={17}/></button></div></div>
    <div className="build-dock"><div className="dock-topline"><span>{buildingTool?`BUILD ${DEFS[buildingTool].name.toUpperCase()}`:v.tool==='demolish'?'CLEAR SPACE':'SHAPE YOUR TOWN'}</span><span className={preview&&!preview.valid?'warning':''}>{message||preview?.reason||'Choose a building · 1–8'}</span></div><div className="dock-tools"><div className="utility-tools"><Tip label="Inspect buildings · Esc"><button className={v.tool==='inspect'?'active':''} onClick={()=>tool('inspect')} aria-label="Inspect buildings"><MousePointer2 size={19}/></button></Tip><Tip label="Clear buildings · B"><button className={v.tool==='demolish'?'active danger':''} onClick={()=>tool('demolish')} aria-label="Demolish buildings"><Hammer size={19}/></button></Tip></div><div className="building-tools">{BUILD_ORDER.map(kind=>{const d=DEFS[kind],locked=!!d.unlock&&c.peak<d.unlock;return <Tip key={kind} label={locked?`${d.name} · unlocks at ${d.unlock} residents`:`${d.name} · ${d.cost} denarii · key ${d.shortcut}`}><button className={`build-tool ${v.tool===kind?'active':''} ${locked?'locked':''}`} onClick={()=>{if(!locked)tool(kind);}} aria-label={`Build ${d.name}`} aria-disabled={locked} aria-pressed={v.tool===kind}><kbd>{d.shortcut}</kbd><Art kind={kind} tier={2}/>{locked&&<LockKeyhole className="lock" size={14}/>}<span>{kind==='house'?'House':kind==='bath'?'Baths':d.name}</span><small>{locked?<><Users size={10}/>{d.unlock}</>:<><Coins size={10}/>{d.cost}</>}</small></button></Tip>;})}</div></div></div>
   </div>
  </div>
  <footer className="bottom-bar"><span><MousePointer2 size={13}/> Click to {v.tool==='inspect'?'inspect':'build'} <b>·</b> Right-drag to pan <b>·</b> Scroll to zoom</span><div className="speed-controls"><span>TIME FLOWS AT YOUR PACE</span>{[0,1,3].map(speed=><button key={speed} className={c.speed===speed?'active':''} onClick={()=>{c.speed=speed;update();}} aria-label={speed===0?'Pause':speed===1?'Normal speed':'Fast speed'} aria-pressed={c.speed===speed}>{speed===0?<Pause size={14}/>:speed===1?<Play size={14}/>:<FastForward size={15}/>} {speed>0&&`${speed}×`}</button>)}</div></footer>
  <Dialog open={help} onOpenChange={setHelp}><DialogContent className="game-dialog help-dialog"><span className="eyebrow">THE GOVERNOR'S HANDBOOK</span><DialogTitle>Let your town flourish.</DialogTitle><DialogDescription>A little planning goes a long way. Build while paused, change your mind, and enjoy watching your neighborhoods grow.</DialogDescription><div className="help-grid"><div><Route/><h3>Start with a street</h3><p>Homes and services need roads connected to the Forum. Wells reach 8 road steps; other services reach 12.</p></div><div><Droplets/><h3>Care for your neighbors</h3><p>Water welcomes residents. Markets create cottages. Baths and 30 appeal create courtyard homes. A theater and 60 appeal create townhouses.</p></div><div><Leaf/><h3>Leave breathing room</h3><p>Gardens and civic buildings add appeal. Workshops create jobs, but their noise lowers appeal nearby.</p></div><div><TrendingUp/><h3>Grow within your means</h3><p>Occupied homes pay taxes. Services cost money every month. Add workshops for jobs and income; suspend extra services when funds run low.</p></div></div><p className="help-note">Service capacity includes all beds in each home's current tier. Leave spare capacity for upgrades. Shortages allow a full minute to fix the problem before gradual decline.</p><div className="shortcut-list"><span><kbd>1–8</kbd> Build</span><span><kbd>Esc</kbd> Inspect</span><span><kbd>Space</kbd> Pause</span><span><kbd>G</kbd> Grid</span><span><kbd>WASD</kbd> Pan</span></div><button className="primary-button" onClick={()=>setHelp(false)}>Back to my town <ChevronRight size={17}/></button></DialogContent></Dialog>
  <AlertDialog open={restart} onOpenChange={setRestart}><AlertDialogContent className="game-dialog"><AlertDialogTitle>A new beginning?</AlertDialogTitle><AlertDialogDescription>This clears your current town and starts again with a fresh treasury.</AlertDialogDescription><div className="dialog-actions"><AlertDialogCancel className="secondary-button">Keep building</AlertDialogCancel><AlertDialogAction className="primary-button" onClick={()=>{city.current=createCity();v.tool='inspect';v.selected=null;v.overlay='none';v.hover=null;setMessage('');setDismissed(0);setRestart(false);center();update();}}>Start a new town</AlertDialogAction></div></AlertDialogContent></AlertDialog>
  <Dialog open={c.completed&&!c.continued} onOpenChange={open=>{if(!open){c.continued=true;update();}}}><DialogContent className="game-dialog victory-dialog" showCloseButton={false}><div className="victory-art"><Art kind="forum" large/><Sparkles/></div><span className="eyebrow">THE CHARTER IS FULFILLED</span><DialogTitle>A town to be proud of.</DialogTitle><DialogDescription>From a quiet riverbank to a flourishing Roman town. Your streets have become a home for {fmt(c.population)} people.</DialogDescription><div className="victory-stats"><span><strong>{fmt(c.population)}</strong>residents</span><span><strong>{houses.filter(b=>b.tier===4).length}</strong>townhouses</span><span><strong>{coin(c.net)}</strong>monthly surplus</span></div><button className="primary-button wide" onClick={()=>{c.continued=true;update();}}>There's still room to grow <ArrowUpRight size={18}/></button></DialogContent></Dialog>
  {!artReady&&<div className="art-loading" role="status"><Landmark size={44}/><h2>Little Rome</h2><p>{artError?'The artwork could not be loaded. Refresh to try again.':'Preparing your province…'}</p><Progress value={artCount/ASSET_NAMES.length*100} aria-label="Loading artwork"/></div>}
 </main></TooltipProvider>;
}
