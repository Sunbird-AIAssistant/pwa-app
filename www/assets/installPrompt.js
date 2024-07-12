// installPrompt.js

let deferredPrompt;

function showInstallDialog() {
  const overlay = document.getElementById('overlay');
  const installDialog = document.getElementById('installDialog');
  overlay.style.display = 'block';
  installDialog.style.display = 'block';
}

function hideInstallDialog() {
  const overlay = document.getElementById('overlay');
  const installDialog = document.getElementById('installDialog');
  overlay.style.display = 'none';
  installDialog.style.display = 'none';
}

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
    // Show the custom install dialog
    showInstallDialog();
  }
});

document.querySelector('#installDialog .install').addEventListener('click', () => {
  hideInstallDialog();
  // Show the install prompt
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
});

document.querySelector('#installDialog .cancel').addEventListener('click', () => {
  hideInstallDialog();
});

window.addEventListener('appinstalled', () => {
  // Log install to analytics
  console.log('PWA was installed');
});
