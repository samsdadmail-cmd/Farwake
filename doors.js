// Jobs own the visit. The final two waypoints connect a reachable street tile
// to the actual opening in the sprite. A portal is never a collision obstacle.
window.FarwakeDoors = (() => {
  const assignments = new WeakMap(), doors = new WeakMap();
  // Only a finished, authored interior can host its listed activities.
  const activities = {cabin:['rest','life_home'],dormitory:['rest','life_home'],greenhouse:['craft'],kitchen:['craft','eat'],sawmill:['craft'],smelter:['craft'],fabricator:['craft'],dining:['eat','social'],recreation:['social'],warehouse:['haul_dropoff','eat'],outpost:['rest','haul_dropoff','research','investigate'],observatory:['research','align'],shelter:['rest','life_home'], camp:['rest','life_home'], shed:['haul_dropoff','eat'],
    workshop:['craft'], lander:['research'], clinic:['treat']};
  function admits(b,job){return !!(b?.finished && FarwakeBuildings.entrance(b) && activities[b.type]?.includes(job));}

  function buildingFor(task, buildings) {
    if(!task||task.outdoors) return null;
    return buildings.find(b=>admits(b,task.type) && (task.id!=null ? b.id===task.id : b.x===task.x && b.y===task.y)) || null;
  }
  function atTile(p,g) { return Math.floor(p.x)===g.x && Math.floor(p.y)===g.y; }
  function destination(from, tile, findPath) {
    const path=findPath(from.x,from.y,[tile]);
    return path.length || atTile(from,tile) ? path : null;
  }
  function portalFor(b) {
    const port=FarwakeBuildings.entrance(b);
    if(!port)return null;
    const x=b.x+(port.x+port.w/2)/32;
    const y=b.y+(port.y+port.h)/32;
    return {building:b.id, x,y, streetX:Math.floor(x)+.5,streetY:b.y+b.h+.5};
  }
  function outward(visit) {
    return [{x:visit.x,y:visit.y+.06,portal:true},{x:visit.streetX,y:visit.streetY,portal:true}];
  }
  function route(p,t,buildings,walkable,findPath,goals) {
    assignments.delete(p);
    const old=p.visit, b=buildingFor(t,buildings), next=b&&portalFor(b);
    const exiting=old && ['inside','entering','leaving'].includes(old.stage);
    // Turning around before reaching the doorway leaves the exterior path intact.
    const from=exiting ? {x:old.streetX,y:old.streetY} : p;
    const prefix=exiting ? outward(old) : [];
    if(next && exiting && old.building===next.building && old.stage==='inside'){
      assignments.set(p,{next:{...next,job:t.type,stage:'inside'}});
      return [{x:p.x,y:p.y,portal:true}];
    }
    if(next) {
      const tile={x:Math.floor(next.streetX),y:Math.floor(next.streetY)};
      const path=walkable(tile.x,tile.y) ? destination(from,tile,findPath) : null;
      if(path){
        assignments.set(p,{exit:exiting?old:null,next:{...next,job:t.type,stage:'approach'}});
        return [...prefix,...path,{x:next.streetX,y:next.streetY,portal:true},
          {x:next.x,y:next.y+.06,portal:true},{x:next.x,y:next.y-.18,portal:true}];
      }
    }
    if(exiting && goals?.length) {
      const path=findPath(from.x,from.y,goals);
      if(!path.length&&!goals.some(tile=>atTile(from,tile)))return null;
      assignments.set(p,{exit:old,next:null});
      return [...prefix,...path];
    }
    // Obstructed door: retain original perimeter job semantics. Such a job
    // remains outdoors and never appears on the occupant list.
    return null;
  }
  function assigned(p,t,path) {
    const plan=assignments.get(p);
    assignments.delete(p);
    if(plan?.exit){p.visit={...plan.exit,stage:'leaving',next:plan.next};}
    else if(plan?.next)p.visit=plan.next;
    else delete p.visit;
  }
  function distance(p,v){return Math.hypot(p.x-v.x,p.y-v.y);}
  function sync(p,buildings) {
    const v=p.visit;
    if(!v)return;
    if(v.stage==='leaving'){
      if(Math.hypot(p.x-v.streetX,p.y-v.streetY)<.09 || !p.path?.some(q=>q.portal)){
        if(v.next)p.visit=v.next;else delete p.visit;
      }
      return;
    }
    if(!p.task || p.task.type!==v.job){
      if(v.stage==='approach')delete p.visit;
      return;
    }
    if(v.stage==='approach' && distance(p,v)<1.03 && p.path?.every(q=>q.portal))v.stage='entering';
    if(v.stage==='entering' && !p.path?.length)v.stage='inside';
  }
  function visible(p) {
    const v=p.visit;
    if(!v || v.stage==='approach')return 1;
    if(v.stage==='inside')return 0;
    return Math.max(0,Math.min(1,(p.y-v.y+.18)/.4));
  }
  function occupants(s,b) {
    return s.colonists.filter(p=>p.visit?.building===b.id && p.visit.stage==='inside' && p.task?.type===p.visit.job);
  }
  const idle=Object.freeze({openness:0,occupied:0,actions:[],phase:0});
  function state(b){return doors.get(b)||idle;}
  function update(s,dt,sound) {
    const activity=new Map();
    for(const p of s.colonists){
      sync(p,s.buildings);
      const v=p.visit;if(!v)continue;
      let a=activity.get(v.building);
      if(!a){a={open:false,count:0,actions:[]};activity.set(v.building,a);}
      if(v.stage==='inside'&&p.task?.type===v.job){a.count++;if(!a.actions.includes(v.job))a.actions.push(v.job);}
      if(v.stage==='entering'||v.stage==='leaving')a.open=true;
    }
    for(const b of s.buildings){
      const a=activity.get(b.id);
      if(!a&&!doors.has(b))continue;
      const view=doors.get(b)||{openness:0,wanted:false,hold:0,phase:0};
      view.hold=a?.open ? .25 : Math.max(0,view.hold-dt);
      const wanted=!!(a?.open||view.hold);
      if(wanted!==view.wanted){sound?.(wanted?'doorOpen':'doorClose',b);view.wanted=wanted;}
      view.openness=Math.max(0,Math.min(1,view.openness+(wanted?1:-1)*dt*(b.type==='workshop'?3.2:5.8)));
      view.occupied=a?.count||0;view.actions=a?.actions||idle.actions;view.phase=(view.phase+dt)%60;
      if(!view.occupied&&!view.openness&&!wanted&&!a)doors.delete(b);else doors.set(b,view);
    }
  }
  function saveVisit(p) {
    const v=p.visit;
    if(!v || !p.task || !['inside','entering'].includes(v.stage) || p.task.type!==v.job)return null;
    return {building:v.building,job:v.job,action:p.action||0};
  }
  function resume(p,buildings) {
    const saved=p.indoorStay;
    delete p.indoorStay;
    if(!saved)return false;
    const b=buildings.find(b=>b.finished&&b.id===saved.building),port=b&&portalFor(b);
    if(!admits(b,saved.job) || !port || (saved.job==='haul_dropoff'&&!p.carry))return false;
    p.x=port.x;p.y=port.y-.18;p.path=[];
    p.task={type:saved.job,id:b.id,x:b.x,y:b.y,w:b.w,h:b.h};
    p.action=Number.isFinite(saved.action)?Math.max(0,saved.action):0;
    p.visit={...port,job:saved.job,stage:'inside'};
    return true;
  }
  function restore(p,buildings,walkable) {
    const v=p.visit;if(!v)return;
    const b=buildings.find(b=>b.id===v.building),port=b&&portalFor(b);
    if(b && v.stage!=='approach'){
      // Old Living World saves can place a person inside an outdoor pallet.
      // Return them to an available exterior tile before resuming the job.
      let street=port && {x:port.streetX,y:port.streetY};
      if(!street || (walkable && !walkable(Math.floor(street.x),Math.floor(street.y)))){
        const options=[];
        for(let y=b.y-1;y<=b.y+b.h;y++)for(let x=b.x-1;x<=b.x+b.w;x++){
          if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)continue;
          if(!walkable || walkable(x,y))options.push({x:x+.5,y:y+.5});
        }
        options.sort((a,z)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-z.x,p.y-z.y));
        street=options[0];
      }
      if(street){p.x=street.x;p.y=street.y;}
    }
    delete p.visit;
  }
  return {route,assigned,sync,update,visible,state,occupants,restore,saveVisit,resume,portalFor};
})();
