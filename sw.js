const VERSION='chord-atlas-v18-6-mtrack-mono-20261112';
const AUDIO='chord-atlas-pwa-v16-audio';
const SHELL=['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./assets/audio/manifest.json','./assets/drums/pro/manifest.json'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('chord-atlas-')&&k!==VERSION&&k!==AUDIO).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  // La beta aislada no debe sobrescribir el HTML cacheado de la PWA estable.
  if(url.pathname.includes('/labs/audio-v18-7/'))return;
  if(url.pathname.includes('/assets/audio/')||url.pathname.includes('/assets/drums/')){
    event.respondWith(caches.open(AUDIO).then(async cache=>{
      const cached=await cache.match(event.request);if(cached)return cached;
      const response=await fetch(event.request);
      if(response.ok)await cache.put(event.request,response.clone());return response;
    }));return;
  }
  if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(async response=>{
      if(response.ok){const cache=await caches.open(VERSION);await cache.put('./index.html',response.clone());}
      return response;
    }).catch(async()=>(await caches.match('./index.html'))||Response.error()));return;
  }
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
