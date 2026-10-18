import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
const dom=new JSDOM('<div id="root"></div>',{url:'https://offlineflow.test/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,localStorage:dom.window.localStorage,sessionStorage:dom.window.sessionStorage,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
Object.assign(globalThis,{ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
const {createRoot}=await import('react-dom/client');const {default:Login}=await import('./Login');
const root=createRoot(document.getElementById('root')!);
const click=async(label:string)=>{const button=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()===label);assert.ok(button,label);await act(async()=>button.click());};
const fill=async(selector:string,value:string)=>{const input=document.querySelector<HTMLInputElement>(selector)!;assert.ok(input,selector);await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new window.Event('input',{bubbles:true}));});};
const submit=async()=>{await act(async()=>document.querySelector('form')!.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));};
test('demo create account, email login, mobile code and logout preserve files without storing passwords',async()=>{
 localStorage.setItem('preserve-document-state','yes');await act(async()=>root.render(<Login/>));assert.equal(document.querySelector('a[href^="/signin-with-chatgpt"]'),null);
 await click('Create account');await fill('input[autocomplete="name"]','Student');await fill('input[type="email"]','student@example.com');await fill('input[type="tel"]','9876543210');await fill('input[type="password"]','demo123');await submit();assert.ok(document.body.textContent?.includes('Keep what matters.'));assert.ok(!localStorage.getItem('offlineflow-demo-profiles')?.includes('demo123'));await click('Log out');
 await fill('input[type="email"]','student@example.com');await fill('input[type="password"]','anydemo');await submit();assert.ok(document.querySelector('.logout-link'));await click('Log out');
 await click('Mobile');await fill('input[type="tel"]','9876543210');await submit();const code=document.querySelector('.demo-code strong')!.textContent!;await fill('input[placeholder="Enter the displayed demo code"]','000000');await submit();assert.match(document.body.textContent||'',/does not match/);await fill('input[placeholder="Enter the displayed demo code"]',code);await submit();assert.ok(document.querySelector('.logout-link'));await click('Log out');assert.equal(sessionStorage.getItem('offlineflow-workspace-open'),null);assert.equal(localStorage.getItem('preserve-document-state'),'yes');assert.match(document.body.textContent||'',/Continue saved demo profile/);await act(async()=>root.unmount());
});
