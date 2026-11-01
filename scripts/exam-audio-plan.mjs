import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const genders={'en-US-Neural2-D':'male','en-US-Neural2-F':'female','en-US-Neural2-H':'female'};
const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const spoken=(voice,text)=>'<voice name="'+voice+'">'+escape(text).replace(/\n/g,'<break time="900ms"/>')+'</voice><break time="600ms"/>';
const numbered=options=>options.map((o,i)=>`${i+1}. ${o}`).join('\n');

export function validateListening(q){
 const p=q.listening;assert(p,`${q.id}: missing structured listening plan`);
 assert(q.options[q.answer],`${q.id}: missing answer`);
 if(q.section==='l3'){
  assert.equal(p.kind,'statements');assert(genders[p.voice]);
  assert.equal(q.script,numbered(q.options));return;
 }
 assert.equal(p.kind,'dialogue');assert(p.turns.length>=2);
 for(const s of Object.values(p.speakers))assert.equal(genders[s.voice],s.gender,`${q.id}: voice/gender mismatch`);
 for(const t of p.turns){assert(p.speakers[t.speaker],`${q.id}: unknown speaker`);assert(t.text.trim());}
 const dialogue=p.turns.map(t=>`${t.speaker}: ${t.text}`).join(' ');
 if(q.section==='l1'){
  assert(p.speakers[p.responseSpeaker],`${q.id}: missing response speaker`);
  assert.notEqual(p.responseSpeaker,p.turns.at(-1).speaker,`${q.id}: response must belong to the other speaker`);
  assert.equal(q.script,dialogue+'\n'+numbered(q.options));
 }else{
  assert.equal(q.section,'l2');assert(genders[p.narratorVoice]);
  assert(!Object.values(p.speakers).some(s=>s.voice===p.narratorVoice),`${q.id}: narrator must be distinct`);
  const question=p.question;assert(question.text.trim());
  assert.equal(q.script,dialogue+'\n'+question.text);
  const person=/\bthe (boy|girl)(?:'s)?\b/.exec(question.text);
  if(person){
   assert(p.speakers[question.subjectSpeaker],`${q.id}: missing question subject`);
   assert.equal(p.speakers[question.subjectSpeaker].gender,person[1]==='boy'?'male':'female',`${q.id}: question person/voice mismatch`);
   assert(Number.isInteger(question.evidenceTurn));
   assert.equal(p.turns[question.evidenceTurn]?.speaker,question.subjectSpeaker,`${q.id}: answer evidence belongs to another speaker`);
  }else assert.equal(question.subjectSpeaker,null);
 }
}

export function buildExamAudio(q){
 validateListening(q);const p=q.listening;let content;
 if(q.section==='l3')content=spoken(p.voice,numbered(q.options));
 else{
  content=p.turns.map(t=>spoken(p.speakers[t.speaker].voice,t.text)).join('');
  if(q.section==='l1')content+=spoken(p.speakers[p.responseSpeaker].voice,numbered(q.options));
  else content+='<break time="900ms"/>'+spoken(p.narratorVoice,p.question.text);
 }
 const body={input:{ssml:'<speak>'+content+'<break time="3000ms"/></speak>'},voice:{languageCode:'en-US',name:'en-US-Neural2-F'},audioConfig:{audioEncoding:'MP3',speakingRate:.88}};
 const hash=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0,16);
 return {body,hash,path:`assets/audio/exam-${q.id}-${hash}.mp3`};
}
