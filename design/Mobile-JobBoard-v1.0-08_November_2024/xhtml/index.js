// Register Service worker to control making site work offline
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('app.js')
	.then(() => { console.log('Service Worker Registered'); });
}
  
// Code to handle install prompt on desktop
let deferredPrompt;
const pwaBtn = document.querySelector('.pwa-btn');
const installText = document.querySelector('.pwa-text');
var PwaKey = 'pwa-offcanvas';
var PwaValue = getCookie(PwaKey);

/* for ios start*/
function isThisDeviceRunningiOS(){
  if (['iPad Simulator', 'iPhone Simulator','iPod Simulator', 'iPad','iPhone','iPod','ios'].includes(navigator.platform) || navigator.userAgent.indexOf('Mac OS X') != -1){ 
	installText.innerHTML = 'Install "JobBoard - Job Search Mobile App Template" to your home screen for easy access click to safari share option "Add to Home Screen".';
	pwaBtn.remove();
	return true;
  }
}
isThisDeviceRunningiOS();
/* for ios end*/

window.addEventListener('beforeinstallprompt', (e) => {
	
	// Prevent Chrome 67 and earlier from automatically showing the prompt
	e.preventDefault();
	
	// Stash the event so it can be triggered later.
	deferredPrompt = e;
	
	pwaBtn.addEventListener('click', () => {
		// hide our user interface that shows our A2HS button
		//pwaBtn.style.display = 'none';
		
		// Show the prompt
		deferredPrompt.prompt();
		
		// Wait for the user to respond to the prompt
		deferredPrompt.userChoice.then((choiceResult) => {
			if (choiceResult.outcome === 'accepted') {
				setCookie(PwaKey, false);
			}
			deferredPrompt = null;
		});
	});
	
});

jQuery(document).ready(function() {
    
	// PWA
	jQuery('.pwa-btn, .pwa-close').on('click',function(){
		jQuery('.pwa-offcanvas').offcanvas('hide');	
		setCookie(PwaKey, true);
	});
	
	// PWA Display Mode Standalone
	if (!window.matchMedia('(display-mode: standalone)').matches) {
		setTimeout(function(){
			jQuery('.pwa-offcanvas').offcanvas("show");
		}, 3000);
	}
});