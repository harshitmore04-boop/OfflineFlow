import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareOffline,type OfflineStatus} from './offline';
let ready=true,checks=0;const worker={postMessage(_:unknown,ports:MessagePort[]){checks++;ports[0].postMessage({ready});}};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{register:async()=>({active:worker}),ready:Promise.resolve(),controller:worker}}});
Object.assign(globalThis,{document:{baseURI:'https://offlineflow.test/project/'}});
const verify=()=>new Promise<OfflineStatus>(resolve=>prepareOffline(status=>{if(status!=='preparing')resolve(status);},true));
test('offline readiness rechecks after success and retry works after failure',async()=>{assert.equal(await verify(),'ready');await new Promise(r=>setTimeout(r,0));ready=false;assert.equal(await verify(),'failed');await new Promise(r=>setTimeout(r,0));ready=true;assert.equal(await verify(),'ready');assert.equal(checks,3);});
test('unsupported mode returns clear status instead of doing nothing',()=>{let status:OfflineStatus|undefined;prepareOffline(s=>status=s,false);assert.equal(status,'unsupported');});
