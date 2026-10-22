self.addEventListener('push', event => {
  let payload={title:'Riyad as-Salihin',body:'A moment for your reading.',url:'/',tag:'riyad-reminder'}
  try { payload={...payload,...event.data.json()} } catch { /* Always display a visible notification. */ }
  const options={body:payload.body,icon:new URL('icons/icon-192.png',self.registration.scope).href,badge:new URL('icons/icon-192.png',self.registration.scope).href,tag:payload.tag,data:{url:payload.url},requireInteraction:false}
  if(payload.vibration)options.vibrate=[200,100,200]
  event.waitUntil(self.registration.showNotification(payload.title,options))
})
self.addEventListener('notificationclick',event=>{
  event.notification.close()
  const destination=new URL(event.notification.data?.url||'/',self.registration.scope)
  if(destination.origin!==self.location.origin)return
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{for(const window of windows){if('navigate'in window)await window.navigate(destination.href);return window.focus()}return clients.openWindow(destination.href)}))
})
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()))
