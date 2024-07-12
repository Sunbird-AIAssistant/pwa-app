// installPrompt.js

let deferredPrompt;

(function() {
  function isPWAInstalled() {
    const isIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    const isInStandaloneMode = () => (
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    );

    return isIOS() ? isInStandaloneMode() : window.matchMedia('(display-mode: standalone)').matches;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Check if the PWA is already installed
    if (!isPWAInstalled()) {
      // Automatically show the install prompt
      showInstallPrompt();
    }
  });

  function showInstallPrompt() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    }
  }

  window.addEventListener('appinstalled', () => {
    // Log install to analytics
    console.log('PWA was installed');
  });
})();
