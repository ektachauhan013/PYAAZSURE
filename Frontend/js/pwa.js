(() => {
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
  let promptEvent;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); promptEvent = event;
    document.documentElement.classList.add('can-install');
  });
  window.PyaazPWA = {
    async install(){
      if (!promptEvent) return false;
      promptEvent.prompt(); const result = await promptEvent.userChoice;
      promptEvent = null; document.documentElement.classList.remove('can-install');
      return result.outcome === 'accepted';
    }
  };
  window.addEventListener('appinstalled', () => document.documentElement.classList.remove('can-install'));
})();
