// Test-only preload: inspect/fire the actual registered scheduler callback.
// Does not change production interval duration, lifecycle state or authorization.
import net from 'node:net';
const timers=new Map(),set=globalThis.setInterval,clear=globalThis.clearInterval;
globalThis.setInterval=function(fn,delay,...args){const timer=set(fn,delay,...args);if(new Error().stack?.includes('/manager/context-memory-scheduler.js'))timers.set(timer,{fn,delay});return timer;};
globalThis.clearInterval=function(timer){timers.delete(timer);return clear(timer);};
const nativeFetch=globalThis.fetch;
globalThis.fetch=(url,...args)=>{if(new URL(String(url)).hostname!=='127.0.0.1')throw Error('TEST_NON_LOOPBACK_FETCH');return nativeFetch(url,...args);};
const listen=net.Server.prototype.listen;
net.Server.prototype.listen=function(...args){if(typeof args[0]==='number')args.splice(1,0,'127.0.0.1');this.once('listening',()=>process.send?.({kind:'ready',port:this.address().port}));return listen.apply(this,args);};
process.on('message',message=>{if(message.kind==='inspect'){process.send?.({kind:'reply',id:message.id,timers:[...timers.values()].map(t=>t.delay)});}if(message.kind==='fire'){for(const t of timers.values())t.fn();process.send?.({kind:'reply',id:message.id});}});
