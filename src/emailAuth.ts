export type AuthSession={access_token:string;expires_at:number;user:{id:string;email:string}};
export type AuthConfig={url:string;key:string};
const env=import.meta.env;
export const authConfig:AuthConfig={url:env?.VITE_SUPABASE_URL||'',key:env?.VITE_SUPABASE_PUBLISHABLE_KEY||''};
export function configured(config=authConfig){try{return new URL(config.url).protocol==='https:'&&config.key.startsWith('sb_publishable_');}catch{return false;}}
const KEY='offlineflow-email-session-v1';
export function createEmailAuth(config=authConfig,request:typeof fetch=fetch){
 const base=config.url.replace(/\/$/,'');
 async function call(path:string,body?:unknown,token?:string){
  if(!configured(config))throw Error('Email OTP is not connected yet. The project owner must configure Supabase Auth and Brevo email delivery.');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await request(`${base}/auth/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(response.status===429?'Too many requests. Wait before requesting another code.':path==='verify'?'This code is invalid or expired. Request a new code and try again.':path==='user'?'Your session could not be verified. Sign in with a new code.':'Unable to send the code. Check the email address or contact the project owner.');
   return data;
  }catch(e){if(e instanceof Error&&e.name==='AbortError')throw Error('The request timed out. Check your connection and try again.');throw e;}finally{clearTimeout(timer);}
 }
 function address(email:string){const value=email.trim().toLowerCase();if(value.length>254||!/^\S+@\S+\.\S+$/.test(value))throw Error('Enter a valid email address.');return value;}
 return {
  enabled:configured(config),
  async send(email:string,createAccount=true){await call('otp',{email:address(email),create_user:createAccount});},
  async verify(email:string,code:string):Promise<AuthSession>{if(!/^\d{6}$/.test(code))throw Error('Enter the six-digit code from your email.');const data=await call('verify',{email:address(email),token:code,type:'email'});if(!data.access_token||!data.user?.id||data.user.email?.toLowerCase()!==address(email)||!data.user.email_confirmed_at)throw Error('The server did not return a verified email session.');return {access_token:data.access_token,expires_at:Date.now()+Number(data.expires_in||3600)*1000,user:{id:data.user.id,email:data.user.email}};},
  async validate(session:AuthSession){if(session.expires_at<=Date.now())throw Error('Your session expired. Sign in with a new code.');const user=await call('user',undefined,session.access_token);if(user.id!==session.user.id||!user.email_confirmed_at)throw Error('Your session could not be verified.');return {...session,user:{id:user.id,email:user.email}};},
  async logout(session:AuthSession){await call('logout?scope=local',{},session.access_token);},
  read():AuthSession|null{try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');const s=saved?.session;return saved?.project===base&&typeof s?.access_token==='string'&&s.access_token.length>0&&Number.isFinite(s.expires_at)&&s.expires_at>Date.now()&&typeof s.user?.id==='string'&&typeof s.user.email==='string'?s:null;}catch{return null;}},
  save(session:AuthSession){sessionStorage.setItem(KEY,JSON.stringify({project:base,session}));},
  clear(){try{sessionStorage.removeItem(KEY);}catch{}},
 };
}
export type EmailAuth=ReturnType<typeof createEmailAuth>;
