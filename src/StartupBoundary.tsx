import {Component,type ReactNode} from 'react';
import {DRAFT_KEY} from './history';
export default class StartupBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main style={{maxWidth:600,margin:'60px auto',padding:24}}><h1>OfflineFlow could not open this session</h1><p>Your stored documents are still on this device. Restart the current simulator session to try again.</p><button onClick={()=>{try{localStorage.removeItem(DRAFT_KEY);}catch{}location.hash='';location.reload();}}>Restart simulator session</button><button onClick={()=>location.reload()}>Reload website</button></main>:this.props.children;}
}
