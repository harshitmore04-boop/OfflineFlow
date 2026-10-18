import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readDraft,readExperiments,readPage,DRAFT_KEY,HISTORY_KEY} from './history';
import {simulate} from './engine';
let saved:Record<string,string>={};
Object.assign(globalThis,{localStorage:{getItem:(key:string)=>saved[key]??null}});
const config={capacity:3,policy:'FIFO' as const,network:'GOOD' as const,priorities:{}};
const requests=['A','B','A'];
const draft={raw:'A, B, A',requests,config,state:simulate(requests,config),scenario:'student'};
test('valid saved runs survive reload, incomplete and malformed runs cannot crash startup',()=>{
 saved[DRAFT_KEY]=JSON.stringify(draft);assert.deepEqual(readDraft(),JSON.parse(JSON.stringify(draft)));
 for(const bad of [{...draft,config:{...config,priorities:null}},{...draft,state:{...draft.state,frequency:null}},{...draft,state:{...draft.state,events:[{}]}},{...draft,requests:['']},{...draft,raw:{}}]){saved[DRAFT_KEY]=JSON.stringify(bad);assert.equal(readDraft(),null);}
 saved[DRAFT_KEY]='{invalid';assert.equal(readDraft(),null);
 saved[HISTORY_KEY]=JSON.stringify([{...draft,id:'valid',at:1,name:'Saved'}, {...draft,id:'bad',at:1,name:'Broken',state:{}}]);assert.equal(readExperiments().length,1);
});
test('invalid URL escape falls back to Dashboard',()=>{assert.equal(readPage('#%E0%A4',['Dashboard']),'Dashboard');assert.equal(readPage('#Offline%20Files',['Dashboard','Offline Files']),'Offline Files');});
