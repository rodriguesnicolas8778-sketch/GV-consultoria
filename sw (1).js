/* Golden Vision · guarda as telas do app para abrir rápido. Os dados sempre vêm do servidor. */
const CACHE = "gv-plataforma-v1";
const ARQUIVOS = ["./", "index.html", "manifest.webmanifest", "icone-192.png", "icone-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // servidor do Google e bibliotecas: sempre pela internet
  // telas: tenta a internet primeiro (versão mais nova) e usa a cópia guardada se estiver sem conexão
  e.respondWith(fetch(e.request).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
