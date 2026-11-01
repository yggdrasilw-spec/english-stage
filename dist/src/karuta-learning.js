// Karuta evidence stays separate from test readiness and XP.
const DAY=86400000;
const day=at=>new Date(at+9*3600000).toISOString().slice(0,10);
export function karutaRecord(state,id,face='meaning'){return state.karutaLearning?.[id]?.[face];}
export function validKarutaTake(t){
 return !!t&&(t.ms===null||Number.isSafeInteger(t.ms)&&t.ms>=0)&&['mistakes','plays','choices'].every(k=>Number.isSafeInteger(t[k])&&t[k]>=0)&&t.choices<=40&&typeof t.slow==='boolean'&&typeof t.comparable==='boolean';
}
export function recordKarutaResult(state,run,id,evidence,at=Date.now()){
 const old=karutaRecord(state,id,run.face),previous=old?.lastTake?{...old.lastTake}:null,first=!(old?.takes>0);
 const r=recordKaruta(state,id,run.face,evidence,at);
 if(evidence.correct){
  const current={ms:evidence.ms,plays:evidence.plays,slow:evidence.slow,choices:evidence.choices,mistakes:run.errors?.[id]??(run.missed.includes(id)?1:0),comparable:evidence.comparable===true};
  r.lastTake=current;run.results||={};run.results[id]={previous,current,first};
 }
 return r;
}
export function karutaPriority(state,id,face='meaning',now=Date.now()){
 const r=karutaRecord(state,id,face),listen=state.progress?.[id]?.listen;
 const weak=['wrong','guess'].includes(listen?.lastQuality)&&(!r||listen.lastAt>r.lastAt);
 if(r?.mistakes&&r.streak===0||weak)return 0;
 if(r?.masteredUntil>now)return Infinity;
 // Fresh objective evidence takes precedence over the initial self-assessment.
 if(!r&&(state.screening?.results?.[id]?.status==='known'||listen?.mastered&&!weak))return Infinity;
 if(['unsure','unknown'].includes(state.screening?.results?.[id]?.status))return 0;
 return !r?1:r.streak===0?0:2;
}
export function recordKaruta(state,id,face,{correct,ms=null,plays=1,slow=false,eligible=false,choices=0},at=Date.now()){
 state.karutaLearning||={};state.karutaLearning[id]||={};
 const r=state.karutaLearning[id][face]||={takes:0,mistakes:0,totalMs:0,lastMs:null,lastAt:at,plays:0,slow:false,streak:0,days:[],masteredUntil:0};
 const listen=state.progress?.[id]?.listen;
 if(['wrong','guess'].includes(listen?.lastQuality)&&listen.lastAt>r.lastAt){r.streak=0;r.days=[];r.masteredUntil=0;}
 r.lastAt=at;r.plays=plays;r.slow=slow;
 if(!correct){r.mistakes++;r.streak=0;r.days=[];r.masteredUntil=0;return r;}
 r.takes++;r.lastMs=ms;if(ms!==null)r.totalMs+=ms;
 const fast=eligible&&choices>=4&&plays===1&&!slow&&ms!==null&&ms<=4000;
 if(fast){r.streak++;r.days=[...new Set([...r.days,day(at)])].slice(-3);if(r.streak>=3&&r.days.length>=2)r.masteredUntil=at+30*DAY;}
 else {r.streak=0;r.days=[];r.masteredUntil=0;}
 return r;
}
export function validKarutaLearning(records,ids){
 return !!records&&typeof records==='object'&&!Array.isArray(records)&&Object.entries(records).every(([id,faces])=>ids.has(id)&&faces&&typeof faces==='object'&&!Array.isArray(faces)&&Object.entries(faces).every(([face,r])=>['meaning','english'].includes(face)&&r&&['takes','mistakes','totalMs','plays','streak','masteredUntil','lastAt'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)&&(r.lastMs===null||Number.isSafeInteger(r.lastMs)&&r.lastMs>=0)&&typeof r.slow==='boolean'&&Array.isArray(r.days)&&r.days.length<=3&&r.days.every(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d))&&(r.lastTake===undefined||validKarutaTake(r.lastTake))));
}
