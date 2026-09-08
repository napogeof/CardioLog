export function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('CardioLog ServiceWorker registrado con éxito:', registration.scope);
        })
        .catch((error) => {
          console.warn('Error al registrar ServiceWorker:', error);
        });
    });
  }
}
