import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import 'fake-indexeddb/auto';
const dom=new JSDOM('',{url:'https://offlineflow.test'});Object.assign(globalThis,{sessionStorage:dom.window.sessionStorage,localStorage:dom.window.localStorage});
const {createEmailAuth}=await import('./emailAuth');const {setLibraryOwner,newLibrary,commitLibrary,readLibrary,readFileBlob}=await import('./library');const history=await import('./history');const {setHistoryOwner}=history;
const config={url:'https://project.supabase.co',key:'sb_publishable_test'};
test('OTP requests use provider verification, reject invalid codes and revoke sessions',async()=>{
 const calls:{url:string;body:any;headers:any}[]=[];let fail=false;
 const mock:typeof fetch=async(input,options)=>{calls.push({url:String(input),body:options?.body?JSON.parse(String(options.body)):undefined,headers:options?.headers});if(fail)return new Response('{}',{status:403});if(String(input).endsWith('/verify'))return Response.json({access_token:'token',expires_in:3600,user:{id:'student-a',email:'student@example.com',email_confirmed_at:'2026-10-14'}});if(String(input).endsWith('/user'))return Response.json({id:'student-a',email:'student@example.com',email_confirmed_at:'2026-10-14'});return Response.json({});};
 const auth=createEmailAuth(config,mock);await auth.send(' STUDENT@example.com ');assert.deepEqual(calls[0].body,{email:'student@example.com',create_user:true});assert.equal(calls[0].headers.apikey,config.key);
 await assert.rejects(()=>auth.verify('student@example.com','12'),/six-digit/);
 const session=await auth.verify('student@example.com','123456');assert.equal(calls.at(-1)?.body.type,'email');auth.save(session);assert.equal(auth.read()?.user.id,'student-a');await auth.validate(session);await auth.logout(session);assert.equal(calls.at(-1)?.headers.Authorization,'Bearer token');auth.clear();assert.equal(auth.read(),null);
 fail=true;await assert.rejects(()=>auth.verify('student@example.com','000000'),/invalid or expired/);
 const missing=createEmailAuth({url:'',key:''},mock);await assert.rejects(()=>missing.send('student@example.com'),/not connected/);
});
test('sessions reject expiry and other project data; verified users have separate file and experiment stores',async()=>{
 const auth=createEmailAuth(config);auth.save({access_token:'token',expires_at:Date.now()-1,user:{id:'a',email:'a@example.com'}});assert.equal(auth.read(),null);
 setLibraryOwner('a');let library=await readLibrary();const file={id:'private-note',name:'private.txt',type:'text/plain',size:4,added:1,lastAccess:1,accessCount:0,priority:2 as const,pinned:false,available:true};await commitLibrary(library.revision,()=>({...newLibrary(),files:[file]}),[{id:file.id,blob:new Blob(['note'])}]);setHistoryOwner('a');localStorage.setItem(history.DRAFT_KEY,'account-a');
 setLibraryOwner('b');assert.equal((await readLibrary()).files.length,0);assert.equal(await readFileBlob(file.id),undefined);setHistoryOwner('b');assert.equal(localStorage.getItem(history.DRAFT_KEY),null);
 setLibraryOwner('a');assert.equal(await (await readFileBlob(file.id))!.text(),'note');setHistoryOwner('a');assert.equal(localStorage.getItem(history.DRAFT_KEY),'account-a');setLibraryOwner('');setHistoryOwner('');
});
test('signup sends profile metadata while existing-user sign in does not change it',async()=>{
 const profile={full_name:'Example User',place:'Sample City',postal_code:'123456',country:'India'};
 const bodies:any[]=[];
 const mock:typeof fetch=async(_,options)=>{bodies.push(JSON.parse(String(options?.body)));return Response.json({access_token:'token',expires_in:3600,user:{id:'student',email:'student@example.com',email_confirmed_at:'2026-10-18',user_metadata:profile}});};
 const auth=createEmailAuth(config,mock);
 await auth.send('student@example.com',true,profile);assert.deepEqual(bodies[0].data,profile);
 await auth.send('student@example.com',false,profile);assert.equal(bodies[1].create_user,false);assert.equal(bodies[1].data,undefined);
 const session=await auth.verify('student@example.com','123456');assert.deepEqual(session.user.profile,profile);
 auth.save(session);assert.deepEqual(auth.read()?.user.profile,profile);auth.clear();
});
