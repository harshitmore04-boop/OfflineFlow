export type OfflineStatus='preparing'|'ready'|'unsupported'|'failed';
let pending:Promise<void>|undefined;
export function prepareOffline(onStatus:(s:OfflineStatus)=>void,production=import.meta.env?.PROD===true){
 if(!('serviceWorker' in navigator)||!production){onStatus('unsupported');return;}
 onStatus('preparing');
 if(!pending)pending=(async()=>{
  const base=new URL('./',document.baseURI);
  const registration=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname,updateViaCache:'none'});
  await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Offline worker installation timed out.')),25000);navigator.serviceWorker.ready.then(()=>{clearTimeout(timeout);resolve();},error=>{clearTimeout(timeout);reject(error);});});
  const worker=registration.active??navigator.serviceWorker.controller;
  if(!worker)throw Error('Offline worker has not activated.');
  await new Promise<void>((resolve,reject)=>{
   const channel=new MessageChannel();
   const clean=()=>{clearTimeout(timeout);channel.port1.close();channel.port2.close();};
   const timeout=setTimeout(()=>{clean();reject(Error('Offline preparation timed out.'));},25000);
   channel.port1.onmessage=e=>{clean();e.data?.ready?resolve():reject(Error('Could not cache the app shell.'));};
   try{worker.postMessage({type:'VERIFY_OFFLINE'},[channel.port2]);}catch(error){clean();reject(error);}
  });
 })();
 const check=pending;
 // A later visit must verify again: browser storage may have been cleared.
 check.then(()=>onStatus('ready'),()=>onStatus('failed')).finally(()=>{if(pending===check)pending=undefined;});
}
