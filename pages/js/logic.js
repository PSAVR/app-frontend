let nivelSeleccionado = null;
let tiempoSeleccionado = null;
let estadoActual = 'seleccionando-nivel';

window.setSeleccion = function (level, minutes) {
  const MAP = { 1:'facil', 2:'intermedio', 3:'dificil', facil:'facil', intermedio:'intermedio', dificil:'dificil' };
  nivelSeleccionado  = MAP[level] || (typeof level === 'string' ? level : 'facil');
  tiempoSeleccionado = Number(minutes) || 1;
  console.log('[setSeleccion]', { nivelSeleccionado, tiempoSeleccionado });
};

window.irAJuego = window.irAJuego || irAJuego;


async function ensureMicPermission() {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const st = await navigator.permissions.query({ name: 'microphone' });
      if (st.state === 'granted') return true;   
    }
  } catch (_) {}

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch (err) {
    console.warn('Permiso de micrófono rechazado o falló:', err);
    return false;
  }
}

async function irAJuego() {

  const ok = await ensureMicPermission();
  if (!ok) {
    alert('Necesitas permitir el micrófono para continuar. Revísalo en el candado del navegador.');
    return; 
  }
  const nivel = nivelSeleccionado || 'facil';
  const tiempo = tiempoSeleccionado || 1;

  console.log('Navegando a juego con:', { nivel, tiempo });

  try {
    localStorage.setItem('nivelSeleccionado', nivel);
    localStorage.setItem('tiempoSeleccionado', tiempo);
    console.log('Datos guardados en localStorage');
  } catch (e) { 
    console.error('Error guardando en localStorage:', e);
  }

  setTimeout(() => {
    window.location.href = `game.html?nivel=${nivel}`;
  }, 300);
}

function setClickable(menuEl, enabled) {
  if (window.MODAL_OPEN) return;
  if (!menuEl) return;
  const boxes = menuEl.querySelectorAll('a-box');
  boxes.forEach(el => {
    if (enabled) el.classList.add('clickable');
    else el.classList.remove('clickable');
  });
}

function mostrarMenu(mostrarDificultad) {
  if (window.MODAL_OPEN) return;
  const menuD = document.querySelector('#menu-dificultad');
  const menuT = document.querySelector('#menu-tiempo');

  if (mostrarDificultad) {
    if (menuD) { menuD.setAttribute('visible','true');  setClickable(menuD, true); }
    if (menuT) { menuT.setAttribute('visible','false'); setClickable(menuT, false); }
  } else {
    if (menuD) { menuD.setAttribute('visible','false'); setClickable(menuD, false); }
    if (menuT) { menuT.setAttribute('visible','true');  setClickable(menuT, true); }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  console.log('Iniciando aplicación');
  
  mostrarMenu(true);

  function elegirNivel(niv) {
    if (estadoActual !== 'seleccionando-nivel') {
      console.warn('Ignorando selección de nivel - estado incorrecto:', estadoActual);
      return;
    }

    nivelSeleccionado = niv;
    estadoActual = 'seleccionando-tiempo';
    
    console.log(`Nivel seleccionado: ${niv}`);
    
    setTimeout(() => {
      mostrarMenu(false);
    }, 100);
  }

function openInstructionsPage(levelSel, minutes) {
  const MAP = { facil: 1, intermedio: 2, dificil: 3 };
  const levelId = Number.isFinite(levelSel)
    ? Number(levelSel)
    : (MAP[String(levelSel).toLowerCase()] || 1);
  const seconds = Math.max(1, Math.round(Number(minutes) || 1)) * 60;

  const qs = new URLSearchParams({ level_id: String(levelId), seconds: String(seconds) });
  const href = location.pathname.includes('/pages/')
    ? 'instrucciones.html'
    : '/pages/instrucciones.html';

  console.log('[NAV] -> instrucciones', { levelId, seconds, href });
  window.location.assign(`${href}?${qs.toString()}`);
}

window.openInstructionsPage = openInstructionsPage;
  function elegirTiempo(min) {
  if (estadoActual !== 'seleccionando-tiempo') return;
  tiempoSeleccionado = min;
  console.log(`Tiempo seleccionado: ${min} minutos`);
  setTimeout(() => {
    openInstructionsPage(nivelSeleccionado, min); 
  }, 300);
}

  setTimeout(() => {
    if (window.MODAL_OPEN) return;
    const btnFacil = document.querySelector('#boton-facil');
    const btnIntermedio = document.querySelector('#boton-intermedio');
    const btnDificil = document.querySelector('#boton-dificil');

    if (btnFacil) {
      btnFacil.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Click en Fácil');
        elegirNivel('facil');
      });
    }

    if (btnIntermedio) {
      btnIntermedio.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Click en Intermedio');
        elegirNivel('intermedio');
      });
    }

    if (btnDificil) {
      btnDificil.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Click en Difícil');
        elegirNivel('dificil');
      });
    }

    const btn1min = document.querySelector('#boton-1min');
    const btn2min = document.querySelector('#boton-2min');
    const btn3min = document.querySelector('#boton-3min');

    if (btn1min) {
      btn1min.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Click en 1 minuto');
        elegirTiempo(1);
      });
    }

    if (btn2min) {
      btn2min.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Click en 2 minutos');
        elegirTiempo(2);
      });
    }

    if (btn3min) {
      btn3min.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Click en 3 minutos');
        elegirTiempo(3);
      });
    }

    console.log('Event listeners configurados');
  }, 500);
});