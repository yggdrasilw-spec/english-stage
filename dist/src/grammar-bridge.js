import {validAttempt,mergeAttempts,statusFor} from '../grammar/core.js';
const key='eiken-grammar-v1';
export function validGrammarSnapshot(value){return !!value&&value.version===1&&Array.isArray(value.attempts)&&value.attempts.length<=5000&&value.attempts.every(validAttempt)&&new Set(value.attempts.map(a=>a.id)).size===value.attempts.length;}
export function syncGrammar(state,storage=globalThis.localStorage){
 let live=[];
 try{const saved=JSON.parse(storage?.getItem(key)||'null');if(saved?.version===1&&Array.isArray(saved.attempts))live=saved.attempts.filter(validAttempt);}catch{}
 state.grammarBridge={version:1,attempts:mergeAttempts(state.grammarBridge?.attempts||[],live)};
 return state.grammarBridge;
}
export function grammarStatus(state,lesson){return statusFor(lesson,state.grammarBridge?.attempts||[]);}
export function restoreGrammar(snapshot,storage=globalThis.localStorage){
 if(!validGrammarSnapshot(snapshot))return;
 let settings={};try{settings=JSON.parse(storage.getItem(key)||'{}').settings||{};}catch{}
 storage.setItem(key,JSON.stringify({version:1,settings,attempts:snapshot.attempts}));
}
