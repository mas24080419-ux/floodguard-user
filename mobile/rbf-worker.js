'use strict';
importScripts('./rbf-core.js?v=2','./rbf-loader.js?v=2');
let enginePromise;
self.onmessage=async event=>{const d=event.data;try{const engine=await(enginePromise=enginePromise||FGRBFLoader.open().catch(e=>{enginePromise=null;throw e;}));const values=await engine.predict(d.ids,d.rain,d.tide,(done,total)=>self.postMessage({id:d.id,progress:[done,total]}));self.postMessage({id:d.id,values},[values.buffer]);}catch(e){self.postMessage({id:d.id,error:e.message});}};
