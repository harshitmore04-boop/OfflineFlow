import React from 'react';
import {createRoot} from 'react-dom/client';
import Login from './Login';
import StartupBoundary from './StartupBoundary';
import {prepareOffline} from './offline';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><StartupBoundary><Login/></StartupBoundary></React.StrictMode>);

(window as Window & {offlineflowStarted?:()=>void}).offlineflowStarted?.();

prepareOffline(()=>{});
