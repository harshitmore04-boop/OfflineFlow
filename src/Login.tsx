import Logo from './Logo';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,BookOpen,Layers,ShieldCheck,WifiOff,Mail,Phone,UserPlus} from 'lucide-react';
import App from './App';
import EmailOtpLogin from './EmailOtpLogin';
import {configured} from './emailAuth';
const SESSION='offlineflow-workspace-open';
const PROFILES='offlineflow-demo-profiles';
type Profile={name:string;email:string;phone:string};
function profiles():Profile[]{try{const data=JSON.parse(localStorage.getItem(PROFILES)||'[]');return Array.isArray(data)?data.filter(p=>typeof p?.name==='string'&&typeof p.email==='string'&&typeof p.phone==='string').slice(-10):[];}catch{return [];}}
function initial(){try{return sessionStorage.getItem(SESSION)==='yes';}catch{return false;}}
function DemoForm({online,enter}:{online:boolean;enter:(profile?:Profile)=>void}){
 const [mode,setMode]=useState<'email'|'phone'|'create'>('email');const [name,setName]=useState('');const [email,setEmail]=useState('');const [phone,setPhone]=useState('');const [password,setPassword]=useState('');const [code,setCode]=useState('');const [issued,setIssued]=useState('');const [error,setError]=useState('');const [saved,setSaved]=useState<Profile[]>(profiles);
 function change(next:'email'|'phone'|'create'){setMode(next);setError('');setIssued('');setCode('');setPassword('');}
 function submit(e:FormEvent){e.preventDefault();setError('');const address=email.trim().toLowerCase();const number=phone.replace(/\D/g,'');
  if(mode==='create'){
   if(!name.trim()){setError('Enter your name.');return;}
   if(saved.some(p=>p.email===address)){setError('A demo profile with this email already exists. Use email login.');return;}
   if(number&&number.length!==10){setError('Enter a 10 digit mobile number.');return;}
   if(number&&saved.some(p=>p.phone===number)){setError('This mobile number is already linked to a demo profile.');return;}
   const next=[...saved,{name:name.trim(),email:address,phone:number}].slice(-10);
   try{localStorage.setItem(PROFILES,JSON.stringify(next));setSaved(next);setPassword('');enter(next.at(-1));}catch{setError('Browser storage is unavailable. Use Open demo workspace instead.');}
  }else if(mode==='email'){
   if(!saved.some(p=>p.email===address)){setError('Create a demo account with this email first, or open the demo workspace.');return;}
   setPassword('');enter(saved.find(p=>p.email===address));
  }else{
   if(number.length!==10){setError('Enter a 10 digit mobile number.');return;}
   if(!saved.some(p=>p.phone===number)){setError('Create a demo account with this mobile number first.');return;}
   if(!issued){setIssued(String(Math.floor(Math.random()*900000)+100000));setCode('');return;}
   if(code!==issued){setError('The code does not match the demo code shown below.');return;}setIssued('');setCode('');enter(saved.find(p=>p.phone===number));
  }
 }
 return <><span className="login-icon"><Logo/></span><span className="demo-label">DEMO ACCESS</span><h2 id="login-title">{mode==='create'?'Create your account':'Welcome to OfflineFlow'}</h2><p>{mode==='create'?'Create a profile for your project demonstration.':'Choose how you want to enter your study workspace.'}</p><div className="login-tabs" role="tablist" aria-label="Demo login method">{([['email','Email',Mail],['phone','Mobile',Phone],['create','Create account',UserPlus]] as const).map(([id,label,Icon])=><button key={id} type="button" role="tab" aria-selected={mode===id} onClick={()=>change(id)}><Icon size={15}/>{label}</button>)}</div><form onSubmit={submit} className="demo-form">
 {mode==='create'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80} required placeholder="Your name"/></label>}
 {mode!=='phone'&&<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" maxLength={254} required placeholder="you@example.com"/></label>}
 {(mode==='phone'||mode==='create')&&<label>Mobile number {mode==='create'&&<small>(optional)</small>}<div className="phone-input"><span>+91</span><input type="tel" value={phone} onChange={e=>{setPhone(e.target.value);setIssued('');setCode('');}} inputMode="numeric" autoComplete="tel-national" required={mode==='phone'} maxLength={10} pattern="[0-9]{10}" placeholder="10 digit mobile number"/></div></label>}
 {mode!=='phone'&&<label>Demo password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="off" minLength={6} required placeholder="Use any 6 or more demo characters"/><small>Demo only. Use a made-up password; it is not saved or verified.</small></label>}
 {issued&&<><p className="demo-code">Demo verification code: <strong>{issued}</strong><small>No SMS is sent. Enter this code to try the flow.</small></p><label>Verification code<input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required placeholder="Enter the displayed demo code"/></label></>}
 {error&&<p className="login-error" role="alert">{error}</p>}<button className="primary login-action" type="submit">{mode==='create'?'Create demo account':mode==='email'?'Log in with email':issued?'Verify demo code':'Get demo code'}<ArrowRight size={17}/></button></form>
 <div className="login-divider"><span>{saved.length?'Already have a demo profile?':'Just exploring?'}</span></div><button className="login-action" type="button" onClick={()=>enter(saved.at(-1))}>{saved.length?'Continue saved demo profile':online?'Open demo workspace':'Open offline workspace'}<ArrowRight size={17}/></button><p className="login-note">These forms simulate login. Profiles stay in this browser; this is not secure account authentication.</p><div className="login-footer"><ShieldCheck size={17}/><span>Logging out keeps your saved study files on this device.</span></div></>;
}
function DemoLogin(){
 const [otpMode,setOtpMode]=useState(false);
 const [activeProfile,setActiveProfile]=useState<Profile|undefined>(()=>{try{return JSON.parse(sessionStorage.getItem('offlineflow-active-profile')||'null')||undefined;}catch{return undefined;}});const [entered,setEntered]=useState(initial);const [online,setOnline]=useState(navigator.onLine);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 useEffect(()=>{if(!entered)document.documentElement.dataset.theme='light';try{if(entered)sessionStorage.setItem(SESSION,'yes');else sessionStorage.removeItem(SESSION);}catch{}},[entered]);
 function leave(){setActiveProfile(undefined);try{sessionStorage.removeItem(SESSION);sessionStorage.removeItem('offlineflow-active-profile');}catch{}setEntered(false);return false;}
 if(otpMode)return <EmailOtpLogin onBack={()=>setOtpMode(false)}/>;
 if(entered)return <App onLogout={leave} profile={activeProfile}/>;
 return <div className="login-page"><header className="login-header"><a className="brand" href="#" aria-label="OfflineFlow home"><span className="brand-mark"><Logo/></span><span>Offline<span className="brand-light">Flow</span><small>YOUR OFFLINE STUDY WORKSPACE</small></span></a><span className="login-status"><span className="status-dot"/>{online?'Ready to connect':'Offline on this device'}</span></header><main className="login-layout"><section className="login-intro"><span className="eyebrow">LEARN WITHOUT LIMITS</span><h1>Your next study session.<br/><span>Ready wherever you are.</span></h1><p>Keep your notes close, protect essential PDFs and understand what stays in your offline library.</p><div className="login-features"><div><BookOpen size={22}/><span><strong>Your materials in one place</strong><small>PDFs, images and notes saved on this device.</small></span></div><div><ShieldCheck size={22}/><span><strong>Keep what matters</strong><small>Pin important documents and review every removal.</small></span></div><div><WifiOff size={22}/><span><strong>Keep learning offline</strong><small>Return to retained materials after offline setup.</small></span></div></div><div className="login-art" aria-hidden="true"><div className="study-sheet"><BookOpen size={26}/><strong>Operating Systems</strong><span>Lecture notes</span><i/><i/><i/></div><div className="study-pin"><ShieldCheck size={17}/> Kept offline</div><span className="study-orbit">FIFO · LRU · SMART</span></div></section><section className="login-card" aria-labelledby="login-title"><button className="login-action otp-entry" onClick={()=>setOtpMode(true)}><Mail size={17}/> Email OTP login</button><p className="login-note">Email OTP setup pending · demo access below</p><DemoForm online={online} enter={profile=>{setActiveProfile(profile);try{if(profile)sessionStorage.setItem('offlineflow-active-profile',JSON.stringify(profile));else sessionStorage.removeItem('offlineflow-active-profile');}catch{}setEntered(true);}}/></section></main><footer className="login-bottom">Study confidently. Keep essential materials within reach.</footer></div>;
}

export default function Login(){return configured()?<EmailOtpLogin/>:<DemoLogin/>;}
