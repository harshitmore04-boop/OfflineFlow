(function () {
  var root = document.getElementById('root');
  var timer = setTimeout(function () {
    var hint = document.getElementById('startup-hint');
    if (hint) hint.textContent = 'The app has not started. Check your connection, then use Repair app loading.';
  }, 12000);
  window.offlineflowStarted = function () { clearTimeout(timer); };
  var button = document.getElementById('startup-repair');
  button.addEventListener('click', async function () {
    var hint = document.getElementById('startup-hint');
    if (!navigator.onLine) { hint.textContent = 'Reconnect to the internet before repairing app loading. Your stored files remain on this device.'; return; }
    button.disabled = true; hint.textContent = 'Refreshing app assets. Your stored PDFs will be kept.';
    try {
      if ('serviceWorker' in navigator) {
        var registrations = await navigator.serviceWorker.getRegistrations();
        var script = new URL('./sw.js', document.baseURI).href;
        for (var r of registrations) {
          if ([r.active, r.waiting, r.installing].some(function(w) { return w && w.scriptURL === script; })) await r.unregister();
        }
      }
      if ('caches' in window) for (var key of await caches.keys()) if (key.startsWith('offlineflow-shell-')) await caches.delete(key);
      location.reload();
    } catch (_) { button.disabled = false; hint.textContent = 'Repair could not finish. Reconnect and try again. Your stored documents were not deleted.'; }
  });
})();
