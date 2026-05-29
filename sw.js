// Service Worker — Boussole Éco (v2)
// "Réseau d'abord" pour la page : on récupère toujours la dernière version en ligne.
// Le cache ne sert que de secours quand il n'y a pas de connexion.

const CACHE = 'boussole-v2';
const SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var req=e.request;
  // La page elle-même : réseau d'abord (toujours la dernière version)
  if(req.mode==='navigate' || req.destination==='document'){
    e.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){c.put('./index.html', copy);});
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(m){return m || caches.match('./');});
      })
    );
    return;
  }
  // Le reste (icônes, manifest) : cache d'abord
  e.respondWith(caches.match(req).then(function(cached){return cached || fetch(req);}));
});
