console.log('[logout.js] cargado. path =', window.location.pathname);

const API_BASE = 'https://vr-backend-api-asdperfqg9a4fncv.canadacentral-01.azurewebsites.net';

function createLogoutButton(){
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith('/pages/game.html')) {
    console.log('[logout.js] En página VR, no muestro botón');
    return;
  }

  if (document.getElementById('btnLogout')) return;

  const btn = document.createElement('button');
  btn.id = 'btnLogout';
  btn.type = 'button';
  btn.setAttribute('aria-label','Cerrar Sesión');
  btn.textContent = 'Cerrar Sesión';

  btn.style.position = 'fixed';
  btn.style.top = '20px';
  btn.style.right = '18px';
  btn.style.zIndex = '9999';
  btn.style.padding = '20px 30px';
  btn.style.border = 'none';
  btn.style.borderRadius = '10px';
  btn.style.fontSize = '18px';
  btn.style.fontWeight = '550';
  btn.style.fontFamily = '"Poppins", sans-serif';
  btn.style.cursor = 'pointer';

  btn.style.backgroundColor = '#9488cf';
  btn.style.color = '#ffffff';
  btn.style.boxShadow = '0 4px 12px rgba(116,106,166,0.3)';
  btn.style.transition = 'background-color 0.2s ease, transform 0.1s ease';

  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = '#9488cf';
    btn.style.transform = 'scale(1.05)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = '#9488cf';
    btn.style.transform = 'scale(1)';
  });

  btn.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method:'POST', credentials:'include' });
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      try { localStorage.clear(); } catch {}
      window.location.href = '/index.html';
    }
  });

  document.body.appendChild(btn);
  console.log('[logout.js] botón añadido al DOM');
}

document.addEventListener('DOMContentLoaded', createLogoutButton);
window.addEventListener('load', () => {
  if (!document.getElementById('btnLogout')) {
    console.log('[logout.js] Reintento post-load');
    createLogoutButton();
  }
});
