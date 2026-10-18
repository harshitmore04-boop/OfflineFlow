import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const handlers={};const stores=new Map();let online=true;let fetches=0;const scope='https://offlineflow.test/project/';
const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {async put(key,response){map.set(typeof key==='string'?key:key.url,response.clone());},async match(key){const response=map.get(typeof key==='string'?key:key.url);return response?.clone();}};},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
const self={registration:{scope},location:{origin:'https://offlineflow.test'},addEventListener(name,fn){handlers[name]=fn;},async skipWaiting(){},clients:{async claim(){}}};
const fetch=async(url)=>{fetches++;if(!online)throw Error('Offline');return new Response(await readFile('dist/'+new URL(typeof url==='string'?url:url.url).pathname.replace('/project/','')),{status:200});};
vm.runInNewContext(await readFile('dist/sw.js','utf8'),{self,caches,fetch,URL,Response,Promise,Error});
let task;handlers.install({waitUntil(p){task=p;}});await task;handlers.activate({waitUntil(p){task=p;}});await task;online=false;const before=fetches;let result;handlers.fetch({request:{method:'GET',url:scope+'?cachetest=1',mode:'navigate'},respondWith(p){result=p;}});const response=await result;assert.ok((await response.text()).includes('id="root"'));assert.equal(fetches,before+1,'navigation attempts fresh HTML before falling back offline');let message;handlers.message({data:{type:'VERIFY_OFFLINE'},ports:[{postMessage(value){message=value;}}],waitUntil(p){task=p;}});await task;assert.equal(message.ready,true);assert.equal(handlers.fetch({request:{method:'GET',url:'https://other.test/private',mode:'cors'},respondWith(){throw Error('Cross-origin intercepted');}}),undefined);console.log('PASS: all built assets precached; offline navigation works at repository subpath; readiness verified; cross-origin requests untouched.');

const active=[...stores.values()][0];active.delete(scope+'index.html');message=undefined;handlers.message({data:{type:'VERIFY_OFFLINE'},ports:[{postMessage(value){message=value;}}],waitUntil(p){task=p;}});await task;assert.equal(message.ready,false,'Lost assets must not be reported ready while offline');online=true;message=undefined;handlers.message({data:{type:'VERIFY_OFFLINE'},ports:[{postMessage(value){message=value;}}],waitUntil(p){task=p;}});await task;assert.equal(message.ready,true,'Retry must rebuild missing assets while online');online=false;handlers.fetch({request:{method:'GET',url:scope,mode:'navigate'},respondWith(p){result=p;}});assert.ok((await (await result).text()).includes('id="root"'));console.log('PASS: missing offline assets are detected; online retry repairs the cache; offline loading then works again.');

for (const route of ["signin-with-chatgpt", "signout-with-chatgpt", "callback"]) handlers.fetch({request:{method:"GET",url:new URL("/"+route,scope).href,mode:"navigate"},respondWith(){throw Error("Authentication route intercepted");}});
console.log("PASS: authentication navigation bypasses offline cache.");

// A redirected cached response must be rebuilt before navigation uses it.
const redirected=new Response('<div id="root">redirected shell</div>',{headers:{'content-type':'text/html'}});
Object.defineProperty(redirected,'redirected',{value:true});
Object.defineProperty(redirected,'url',{value:scope+'index.html'});
const realOpen=caches.open;
caches.open=async()=>({async match(){return redirected;}});
handlers.fetch({request:{method:'GET',url:scope,mode:'navigate',redirect:'manual'},respondWith(p){result=p;}});
const safe=await result;assert.equal(safe.redirected,false);assert.equal(safe.url,'');assert.equal(safe.headers.get('content-type'),'text/html');assert.ok((await safe.text()).includes('redirected shell'));
online=true;caches.open=async()=>{throw Error('Cache unavailable');};
handlers.fetch({request:{method:'GET',url:scope+'index.html',mode:'navigate'},respondWith(p){result=p;}});
assert.ok((await (await result).text()).includes('id="root"'));
caches.open=realOpen;
console.log('PASS: redirected cache responses are normalized; unavailable cache falls back to network.');

// A connected navigation must use the current server HTML over an older shell.
await (await caches.open([...stores.keys()][0])).put(scope+'index.html',new Response('stale login page'));
handlers.fetch({request:{method:'GET',url:scope+'index.html',mode:'navigate'},respondWith(p){result=p;}});
assert.ok((await (await result).text()).includes('id="root"'),'online navigation must load the latest login page');
console.log('PASS: online navigation uses fresh HTML instead of an older cached login page.');
