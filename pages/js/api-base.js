(function () {
  if (window.API_BASE) return;

  const LOCAL_API = 'http://localhost:4000';

  const PROD_API = 'https://vr-backend-api-asdperfqg9a4fncv.canadacentral-01.azurewebsites.net';

  const host = window.location.hostname;
  const isLocalhost = (host === 'localhost' || host === '127.0.0.1');

  window.API_BASE = isLocalhost ? LOCAL_API : PROD_API;

  if (!window.API_BASE) {
    console.warn("API_BASE no configurado para producción todavía.");
  }
})();

