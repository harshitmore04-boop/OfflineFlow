import 'fake-indexeddb/auto';
import {JSDOM} from 'jsdom';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';

const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://offlineflow.test/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,localStorage:dom.window.localStorage,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
class ResizeObserverStub {observe(){}unobserve(){}disconnect(){}}
Object.assign(globalThis,{ResizeObserver:ResizeObserverStub});
const {createRoot}=await import('react-dom/client');
const {default:App}=await import('./App');
const root=createRoot(document.getElementById('root')!);
const click=async(text:string)=>{const b=Array.from(document.querySelectorAll('button')).find(x=>x.textContent?.trim()===text || (text==='Smart Cache' && x.textContent?.trim()==='Smart CacheNEW'));assert.ok(b,`Button exists: ${text}`);await act(async()=>b.click());};
const text=()=>document.body.textContent||'';
const wait=async(ms:number)=>{await act(async()=>{await new Promise(r=>setTimeout(r,ms));});};
test('full interface flow: requests, inspector, lab, policy reset, autoplay and pause',async()=>{
 await act(async()=>root.render(<App/>));assert.ok(text().includes('Keep what matters.'));
 await click('Cache Simulator');await click('Next request');assert.ok(text().includes('1 / 12 requests'));
 await click('Run sequence');assert.ok(text().includes('12 / 12 requests'));assert.ok(text().includes('EVICTION'));
 const event=document.querySelector<HTMLButtonElement>('.event');assert.ok(event);await act(async()=>event.click());assert.ok(document.querySelector('[role="dialog"]'));const close=document.querySelector<HTMLButtonElement>('[aria-label="Close inspector"]')!;await act(async()=>close.click());assert.equal(document.querySelector('[role="dialog"]'),null);
 await click('What-If Lab');assert.ok(text().includes('COUNTERFACTUAL SIMULATION'));await click('Replay actual decision');assert.ok(text().includes('Main run unchanged'));
 await click('Cache Simulator');await click('FIFO');assert.ok(text().includes('0 / 12 requests'));await click('Auto play');await wait(950);assert.ok(text().includes('1 / 12 requests'));await click('Pause');await wait(950);assert.ok(text().includes('1 / 12 requests'));
 const reset=document.querySelector<HTMLButtonElement>('[aria-label="Reset simulation"]')!;await act(async()=>reset.click());assert.ok(text().includes('0 / 12 requests'));
 await click('Next request');await click('Save experiment');await click('Experiment History');assert.ok(text().includes('Saved experiments'));assert.ok(text().includes('Restore'));await click('Smart Cache');assert.ok(text().includes('One score. Three signals.'));await click('Offline');assert.ok(text().includes('OFFLINE'));
 await click('Analytics');assert.ok(text().includes('Same workload. Three perspectives.'));
 await click('Real-World Scenarios');const load=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('Load scenario'))!;await act(async()=>load.click());assert.ok(text().includes('Cache Simulator'));
 await click('Learn / About');assert.ok(text().includes('Model boundaries'));
 await click('Offline Files');await wait(30);assert.ok(text().includes('Available offline'));assert.ok(text().includes('Add files'));assert.ok(!text().includes('Demo mode'));await act(async()=>root.unmount());
});

test('local-file interface stores, pins, previews and restores file bytes across remount',async()=>{
 const realCreate=URL.createObjectURL;const realRevoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:https://offlineflow.test/local-file';URL.revokeObjectURL=()=>{};
 let secondRoot=createRoot(document.getElementById('root')!);await act(async()=>secondRoot.render(<App/>));await click('Offline Files');await wait(30);
 const chooser=document.querySelector<HTMLInputElement>('input[aria-label="Select files for offline storage"]')!;const blob=Object.assign(new Blob(['These are offline lecture notes.'],{type:'text/plain'}),{name:'lecture-notes.txt'});Object.defineProperty(chooser,'files',{value:[blob],configurable:true});await act(async()=>chooser.dispatchEvent(new dom.window.Event('change',{bubbles:true})));assert.ok(text().includes('Review offline storage'));assert.ok(text().includes('No existing files will be removed'));await click('Confirm and store files');await wait(30);assert.ok(text().includes('lecture-notes.txt'));
 const pin=document.querySelector<HTMLButtonElement>('[aria-label="Pin lecture-notes.txt"]')!;await act(async()=>pin.click());await wait(20);assert.ok(text().includes('PINNED'));await click('Open');await wait(30);assert.ok(text().includes('These are offline lecture notes.'));const close=document.querySelector<HTMLButtonElement>('[aria-label="Close file viewer"]')!;await act(async()=>close.click());await act(async()=>secondRoot.unmount());
 secondRoot=createRoot(document.getElementById('root')!);await act(async()=>secondRoot.render(<App/>));await wait(40);assert.ok(text().includes('lecture-notes.txt'));assert.ok(text().includes('PINNED'));await click('Open');await wait(30);assert.ok(text().includes('These are offline lecture notes.'));await act(async()=>secondRoot.unmount());URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;
});

const setInput=async(element:HTMLInputElement|HTMLTextAreaElement,value:string)=>{const proto=element.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')!.set!;await act(async()=>{setter.call(element,value);element.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});};
const chooseFile=async(name:string,bytes:number)=>{const chooser=document.querySelector<HTMLInputElement>('input[aria-label="Select files for offline storage"]')!;const blob=Object.assign(new Blob([new Uint8Array(bytes)],{type:'text/plain'}),{name});Object.defineProperty(chooser,'files',{value:[blob],configurable:true});await act(async()=>chooser.dispatchEvent(new dom.window.Event('change',{bubbles:true})));};
const byLabel=async(label:string)=>{const target=Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.getAttribute('aria-label')===label);assert.ok(target,`Action exists: ${label}`);assert.ok(!target.disabled,`Action enabled: ${label}`);await act(async()=>target.click());};
test('button audit: picker, pin exclusions, cancellation, eviction, download and record cleanup',async()=>{
 const createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL,anchorClick=dom.window.HTMLAnchorElement.prototype.click;const downloads:{name:string;attached:boolean}[]=[];
 URL.createObjectURL=()=> 'blob:https://offlineflow.test/audit';URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,attached:document.body.contains(this)});};
 const auditRoot=createRoot(document.getElementById('root')!);await act(async()=>auditRoot.render(<App/>));await click('Offline Files');await wait(30);
 let pickerClicks=0;const picker=document.querySelector<HTMLInputElement>('input[aria-label="Select files for offline storage"]')!;picker.addEventListener('click',()=>pickerClicks++);await click('Add files');assert.equal(pickerClicks,1,'Add files opens the native picker');
 const budget=document.querySelector<HTMLInputElement>('input[type="number"]')!;await setInput(budget,'1');await click('Review limit');assert.ok(text().includes('New storage budget: 1.00 MB'));await click('Confirm storage limit');await wait(30);
 await chooseFile('big-a.txt',700*1024);await click('Confirm and store files');await wait(30);await byLabel('Pin big-a.txt');await wait(30);
 await chooseFile('big-b.txt',600*1024);assert.ok(text().includes('Pinned files leave insufficient space'));assert.equal(document.querySelector('[aria-labelledby="review-title"]'),null);
 await byLabel('Unpin big-a.txt');await wait(30);await chooseFile('big-b.txt',600*1024);assert.ok(text().includes('local copies will be removed'));await click('Cancel');assert.ok(document.querySelector('[aria-label="Pin big-a.txt"]'),'Cancellation retains original file');
 await chooseFile('big-b.txt',600*1024);await click('Confirm and store files');await wait(30);assert.equal(document.querySelector('[aria-label="Pin big-a.txt"]'),null);assert.ok(text().includes('No longer stored locally'));
 await byLabel('Download big-b.txt');await wait(30);assert.equal(downloads.at(-1)?.name,'big-b.txt');assert.ok(downloads.at(-1)?.attached);
 await byLabel('Remove local copy of big-b.txt');await click('Cancel');assert.ok(document.querySelector('[aria-label="Pin big-b.txt"]'));
 await byLabel('Remove local copy of big-b.txt');await click('Remove app copy');await wait(30);assert.equal(document.querySelector('[aria-label="Pin big-b.txt"]'),null);
 await byLabel('Remove record of big-a.txt');await wait(30);assert.equal(document.querySelector('[aria-label="Remove record of big-a.txt"]'),null);
 await click('Request storage protection');assert.ok(text().includes('not supported'),'Unsupported capabilities explain why');
 await click('Cache Simulator');const reset=document.querySelector<HTMLButtonElement>('[aria-label="Reset simulation"]')!;await act(async()=>reset.click());await setInput(document.querySelector<HTMLTextAreaElement>('textarea')!,'A,B,C,A,D');await click('Run sequence');assert.ok(text().includes('5 / 5 requests'));const next=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Next request')!;assert.ok(next.disabled,'Completed workload disables Next');
 await byLabel('Export experiment as JSON');assert.equal(downloads.at(-1)?.name,'offlineflow-experiment.json');assert.ok(downloads.at(-1)?.attached);await click('Save experiment');await click('Experiment History');const saved=document.querySelector<HTMLElement>('.experiment-list article')!;const historyDownload=saved.querySelector<HTMLButtonElement>('button[aria-label^="Download experiment"]')!;await act(async()=>historyDownload.click());assert.ok(downloads.at(-1)?.name.startsWith('offlineflow-'));const restore=saved.querySelector<HTMLButtonElement>('button')!;await act(async()=>restore.click());assert.ok(text().includes('5 / 5 requests'));
 await click('Experiment History');const count=document.querySelectorAll('.experiment-list article').length;const remove=document.querySelector<HTMLButtonElement>('[aria-label^="Remove experiment"]')!;await act(async()=>remove.click());assert.equal(document.querySelectorAll('.experiment-list article').length,count-1);
 const before=document.documentElement.dataset.theme;const theme=document.querySelector<HTMLButtonElement>('.theme-button')!;await act(async()=>theme.click());assert.notEqual(document.documentElement.dataset.theme,before);
 await byLabel('Open navigation');assert.ok(document.querySelector('.sidebar.open'));await byLabel('Close navigation');assert.equal(document.querySelector('.sidebar.open'),null);
 await act(async()=>auditRoot.unmount());URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;dom.window.HTMLAnchorElement.prototype.click=anchorClick;
});


test('Smart Cache runs and resizes storage without leaving the page',async()=>{
 location.hash='#Smart%20Cache';
 const smartRoot=createRoot(document.getElementById('root')!);
 await act(async()=>smartRoot.render(<App/>));
 await click('Smart Cache');await click('SMART');
 const capacity=document.querySelector<HTMLSelectElement>('.control-grid select')!;
 assert.ok(capacity,'Smart Cache exposes capacity');
 await act(async()=>{capacity.value='1';capacity.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 await click('Run sequence');
 assert.equal(document.querySelectorAll('.storage .slot:not(.empty)').length,1);
 assert.ok(text().includes('1 of 1 slots occupied'));
 assert.equal(document.querySelector('.page-heading h1')?.textContent,'Smart Cache');
 await act(async()=>{capacity.value='4';capacity.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 assert.equal(document.querySelectorAll('.storage .slot.empty').length,4);
 await click('Next request');assert.ok(text().includes('1 of 4 slots occupied'));
 await click('Store real files');await wait(30);assert.ok(text().includes('Storage budget'));
 await act(async()=>smartRoot.unmount());
});

test('profile disclosure opens, navigates to files and closes with Escape',async()=>{
 const profileRoot=createRoot(document.getElementById('root')!);
 await act(async()=>profileRoot.render(<App profile={{name:'Demo Student',email:'student@example.com',phone:'9876543210'}}/>));
 const summary=document.querySelector<HTMLElement>('[aria-label="Open profile"]')!;
 assert.equal(summary.textContent,'DS');await act(async()=>summary.click());
 assert.ok(document.querySelector<HTMLDetailsElement>('.profile-menu')!.open);
 assert.ok(document.querySelector('.profile-panel')?.textContent?.includes('student@example.com'));
 await click('My offline files');await wait(30);assert.ok(text().includes('Storage budget'));
 assert.equal(document.querySelector<HTMLDetailsElement>('.profile-menu')!.open,false);
 await act(async()=>summary.click());await act(async()=>summary.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 assert.equal(document.querySelector<HTMLDetailsElement>('.profile-menu')!.open,false);
 await act(async()=>profileRoot.unmount());
});


test('Smart Cache controls: presets stay on page, no-op policy preserves run, candidates and timeline inspect',async()=>{
 const smartRoot=createRoot(document.getElementById('root')!);await act(async()=>smartRoot.render(<App/>));await click('Smart Cache');
 const preset=document.querySelector<HTMLSelectElement>('.control-grid label:last-child select')!;
 await act(async()=>{preset.value='commuter';preset.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 assert.equal(document.querySelector('.page-heading h1')?.textContent,'Smart Cache');
 await click('Run sequence');const count=document.querySelectorAll('.event').length;assert.ok(count>0);
 await click('SMART');assert.equal(document.querySelectorAll('.event').length,count,'Active policy does not reset requests');
 const network=Array.from(document.querySelectorAll<HTMLButtonElement>('.network-options button')).find(b=>b.textContent?.trim()==='Offline')!;
 await act(async()=>network.click());assert.equal(network.getAttribute('aria-pressed'),'true');
 const priority=document.querySelector<HTMLSelectElement>('.storage .priority-label select')!;
 await act(async()=>{priority.value='3';priority.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.equal(priority.value,'3');
 const candidate=document.querySelector<HTMLButtonElement>('.candidate-inspect')!;await act(async()=>candidate.click());assert.ok(document.querySelector('[role="dialog"]'));
 await byLabel('Close inspector');const event=document.querySelector<HTMLButtonElement>('.event')!;await act(async()=>event.click());assert.ok(document.querySelector('[role="dialog"]'));await byLabel('Close inspector');
 await click('Save experiment');assert.ok(text().includes('Experiment saved'));
 await byLabel('Reset simulation');assert.equal(document.querySelectorAll('.event').length,0);
 await click('Auto play');await wait(950);assert.ok(document.querySelectorAll('.event').length>0);await click('Pause');const paused=document.querySelectorAll('.event').length;await wait(950);assert.equal(document.querySelectorAll('.event').length,paused);
 await click('FIFO');assert.equal(document.querySelectorAll('.event').length,0);await click('Activate Smart policy');assert.ok(document.querySelector('.segments button[aria-pressed="true"]')?.textContent?.includes('SMART'));
 await act(async()=>smartRoot.unmount());
});

test('storage protection gives inline feedback for pending, granted, existing, declined and failed requests',async()=>{
 const {default:OfflineFiles}=await import('./OfflineFiles');
 const protectionRoot=createRoot(document.getElementById('root')!);
 const original=Object.getOwnPropertyDescriptor(navigator,'storage');
 let calls=0,resolveRequest:(value:boolean)=>void=()=>{};
 const storage={persisted:async()=>false,persist:()=>{calls++;return new Promise<boolean>(resolve=>{resolveRequest=resolve;});}};
 Object.defineProperty(navigator,'storage',{value:storage,configurable:true});
 try{
  await act(async()=>protectionRoot.render(<OfflineFiles/>));await wait(30);
  await click('Request storage protection');
  const pending=document.querySelector<HTMLButtonElement>('[aria-describedby="storage-protection-status"]')!;
  assert.equal(pending.disabled,true);assert.equal(pending.getAttribute('aria-busy'),'true');
  await act(async()=>pending.click());assert.equal(calls,1,'Repeated clicks cannot overlap a pending request');
  await act(async()=>resolveRequest(true));
  const status=()=>document.getElementById('storage-protection-status')!.textContent!;
  assert.ok(status().includes('protection is active'));assert.equal(pending.disabled,false);
  storage.persisted=async()=>true;await click('Check storage protection');assert.equal(calls,1,'Existing protection needs no new request');
  storage.persisted=async()=>false;storage.persist=async()=>false;
  await click('Check storage protection');assert.ok(status().includes('did not grant'));assert.ok(status().includes('still work offline'));
  storage.persist=async()=>{throw Error('Permission request failed');};
  await click('Request storage protection');assert.ok(status().includes('Permission request failed'));assert.equal(pending.disabled,false);
  Object.defineProperty(navigator,'storage',{value:undefined,configurable:true});
  await click('Request storage protection');assert.ok(status().includes('not supported'));assert.equal(pending.disabled,false);
 }finally{
  await act(async()=>protectionRoot.unmount());
  if(original)Object.defineProperty(navigator,'storage',original);else Reflect.deleteProperty(navigator,'storage');
 }
});


test('campus and timetable upload options store real files and retain category across remount',async()=>{
 const {default:OfflineFiles}=await import('./OfflineFiles');
 const {readLibrary,readFileBlob}=await import('./library');
 let essentialsRoot=createRoot(document.getElementById('root')!);
 await act(async()=>essentialsRoot.render(<OfflineFiles campus/>));await wait(30);
 for(const [button,label,name,category] of [
  ['Upload campus map','Select campus files for offline storage','campus-map.pdf','campus'],
  ['Upload timetable','Select timetable files for offline storage','weekly-timetable.pdf','timetable']
 ]){
  const picker=document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  let clicks=0;picker.addEventListener('click',()=>clicks++);
  await click(button);assert.equal(clicks,1);
  const file=Object.assign(new Blob(['%PDF-1.4 study essentials'],{type:'application/pdf'}),{name});
  Object.defineProperty(picker,'files',{value:[file],configurable:true});
  await act(async()=>picker.dispatchEvent(new dom.window.Event('change',{bubbles:true})));
  assert.ok(text().includes('Review offline storage'));await click('Confirm and store files');await wait(30);
  const saved=(await readLibrary()).files.find(f=>f.name===name)!;
  assert.equal(saved.category,category);assert.equal(await (await readFileBlob(saved.id))!.text(),'%PDF-1.4 study essentials');
 }
 await act(async()=>essentialsRoot.unmount());essentialsRoot=createRoot(document.getElementById('root')!);
 await act(async()=>essentialsRoot.render(<OfflineFiles campus/>));await wait(30);
 assert.ok(text().includes('Campus files saved offline: 1'));assert.ok(text().includes('Timetables saved offline: 1'));
 assert.ok(text().includes('campus-map.pdf'));assert.ok(text().includes('weekly-timetable.pdf'));
 await act(async()=>essentialsRoot.unmount());
});

test('500 MB default and budget presets review, confirm, persist and preserve custom choices',async()=>{
 const {default:OfflineFiles}=await import('./OfflineFiles');
 const {MB,newLibrary,readLibrary,commitLibrary}=await import('./library');
 assert.equal(newLibrary().settings.limit,500*MB);
 let value=await readLibrary();
 await commitLibrary(value.revision,current=>({...current,settings:{...current.settings,limit:50*MB,budgetVersion:undefined}}));
 let budgetRoot=createRoot(document.getElementById('root')!);
 await act(async()=>budgetRoot.render(<OfflineFiles/>));await wait(30);
 assert.equal((await readLibrary()).settings.limit,500*MB,'Old default upgrades to 500 MB');
 await click('250 MB');assert.ok(text().includes('New storage budget: 250.0 MB'));
 await click('Cancel');assert.equal((await readLibrary()).settings.limit,500*MB);
 await click('250 MB');await click('Confirm storage limit');await wait(30);
 assert.equal((await readLibrary()).settings.limit,250*MB);
 await act(async()=>budgetRoot.unmount());budgetRoot=createRoot(document.getElementById('root')!);
 await act(async()=>budgetRoot.render(<OfflineFiles/>));await wait(30);
 assert.ok(text().includes('250 MB · active'));
 await click('500 MB');await click('Confirm storage limit');await wait(30);
 assert.equal((await readLibrary()).settings.limit,500*MB);
 await setInput(document.querySelector<HTMLInputElement>('input[type="number"]')!,'50');
 await click('Review limit');await click('Confirm storage limit');await wait(30);
 await act(async()=>budgetRoot.unmount());budgetRoot=createRoot(document.getElementById('root')!);
 await act(async()=>budgetRoot.render(<OfflineFiles/>));await wait(30);
 assert.equal((await readLibrary()).settings.limit,50*MB,'Explicit custom 50 MB stays selected');
 await act(async()=>budgetRoot.unmount());
});


test('Campus & Timetable is a separate clickable page from general PDF files',async()=>{
 const campusRoot=createRoot(document.getElementById('root')!);await act(async()=>campusRoot.render(<App/>));
 assert.equal(document.querySelectorAll('nav[aria-label="Main navigation"] button')[1]?.textContent,'Campus & Timetable');
 await click('Campus uploads');await wait(30);
 assert.equal(document.querySelector('.page-heading h1')?.textContent,'Campus & Timetable');
 assert.ok(text().includes('Upload campus map'));assert.ok(text().includes('Upload timetable'));
 assert.ok(document.querySelector('input[aria-label="Select campus files for offline storage"]'));
 assert.equal(document.querySelector('input[aria-label="Select files for offline storage"]'),null);
 assert.ok(text().includes('campus-map.pdf'));assert.ok(text().includes('weekly-timetable.pdf'));
 await click('Offline Files');await wait(30);
 assert.ok(document.querySelector('input[aria-label="Select files for offline storage"]'));
 assert.equal(document.querySelector('input[aria-label="Select campus files for offline storage"]'),null);
 assert.ok(!text().includes('campus-map.pdf') || !document.querySelector('.file-grid')?.textContent?.includes('campus-map.pdf'));
 await act(async()=>campusRoot.unmount());
});


test('What-If alternatives, decision selector and invalid simulator input respond correctly',async()=>{
 localStorage.removeItem('offlineflow-current-run-v2');location.hash='#What-If%20Lab';
 const labRoot=createRoot(document.getElementById('root')!);await act(async()=>labRoot.render(<App/>));
 assert.ok(text().includes('No eviction to explore yet.'));await click('Load sample experiment');
 const option=document.querySelector<HTMLButtonElement>('.whatif-option')!;assert.ok(option);
 await act(async()=>option.click());await click('Try selected alternative');assert.ok(text().includes('Main run unchanged'));
 const chooser=document.querySelector<HTMLSelectElement>('[aria-label="Decision to replay"]')!;
 await act(async()=>{chooser.value=chooser.options[0].value;chooser.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 assert.equal(document.querySelector('.replay-list'),null,'Decision selection clears stale replay');
 await click('Replay actual decision');assert.ok(document.querySelector('.replay-list'));
 await click('Cache Simulator');await setInput(document.querySelector<HTMLTextAreaElement>('textarea')!,'');await click('Run sequence');
 assert.ok(document.querySelector('#request-error'));
 await setInput(document.querySelector<HTMLTextAreaElement>('textarea')!,'A,B,C,A,D');await click('Run sequence');assert.equal(document.querySelector('#request-error'),null);
 await act(async()=>labRoot.unmount());
});

test('uploaded PDF opens locally while browser reports offline and campus shows readiness feedback',async()=>{
 const {default:OfflineFiles}=await import('./OfflineFiles');
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL;let localBlob:Blob|undefined;
 URL.createObjectURL=blob=>{localBlob=blob as Blob;return 'blob:https://offlineflow.test/offline-pdf';};URL.revokeObjectURL=()=>{};
 const online=Object.getOwnPropertyDescriptor(navigator,'onLine');Object.defineProperty(navigator,'onLine',{value:false,configurable:true});
 const pdfRoot=createRoot(document.getElementById('root')!);
 try{
  await act(async()=>pdfRoot.render(<OfflineFiles campus/>));await wait(30);
  assert.ok(document.querySelector('.campus-offline-status'));assert.ok(text().includes('Offline · actual browser connection'));
  const card=Array.from(document.querySelectorAll('.file-card')).find(x=>x.textContent?.includes('campus-map.pdf'))!;assert.ok(card);
  await act(async()=>card.querySelector<HTMLButtonElement>('.file-actions button')!.click());await wait(30);
  assert.equal(document.querySelector('iframe')?.getAttribute('src'),'blob:https://offlineflow.test/offline-pdf');assert.equal(localBlob?.type,'application/pdf');assert.ok((await localBlob!.text()).includes('%PDF'));
  await byLabel('Close file viewer');assert.equal(document.querySelector('iframe'),null);
 }finally{await act(async()=>pdfRoot.unmount());URL.createObjectURL=create;URL.revokeObjectURL=revoke;if(online)Object.defineProperty(navigator,'onLine',online);else Reflect.deleteProperty(navigator,'onLine');}
});

test('website update notification appears after controller replacement without forcing a reload',async()=>{
 const original=Object.getOwnPropertyDescriptor(navigator,'serviceWorker');const worker=new dom.window.EventTarget();Object.assign(worker,{controller:{}});
 Object.defineProperty(navigator,'serviceWorker',{value:worker,configurable:true});
 const updateRoot=createRoot(document.getElementById('root')!);
 try{await act(async()=>updateRoot.render(<App/>));await act(async()=>worker.dispatchEvent(new dom.window.Event('controllerchange')));
  assert.ok(text().includes('A website update is ready.'));assert.ok(Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='Update website'));
 }finally{await act(async()=>updateRoot.unmount());if(original)Object.defineProperty(navigator,'serviceWorker',original);else Reflect.deleteProperty(navigator,'serviceWorker');}
});
