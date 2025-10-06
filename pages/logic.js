// --- Estado elegido por el usuario ---
let nivelSeleccionado = null;
let tiempoSeleccionado = null;
let estadoActual = 'seleccionando-nivel';

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

// --- Ir a inmersión con el nivel/tiempo seleccionados ---
async function irAJuego() {

  const ok = await ensureMicPermission();
  if (!ok) {
    alert('Necesitas permitir el micrófono para continuar. Revísalo en el candado del navegador.');
    return; 
  }
  const nivel = nivelSeleccionado || 'facil';
  const tiempo = tiempoSeleccionado || 1;

  console.log('🎮 Navegando a juego con:', { nivel, tiempo });

  try {
    localStorage.setItem('nivelSeleccionado', nivel);
    localStorage.setItem('tiempoSeleccionado', tiempo);
    console.log('✅ Datos guardados en localStorage');
  } catch (e) { 
    console.error('❌ Error guardando en localStorage:', e);
  }

  setTimeout(() => {
    window.location.href = `game.html?nivel=${nivel}`;
  }, 300);
}

function setClickable(menuEl, enabled) {
  if (!menuEl) return;
  // activamos/desactivamos SOLO los a-box del menú
  const boxes = menuEl.querySelectorAll('a-box');
  boxes.forEach(el => {
    if (enabled) el.classList.add('clickable');
    else el.classList.remove('clickable');
  });
}

function mostrarMenu(mostrarDificultad) {
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
  console.log('📱 Iniciando aplicación');
  
  // Estado inicial - mostrar solo dificultad
  mostrarMenu(true);

  // 1) FUNCIONES DE NIVEL
  function elegirNivel(niv) {
    if (estadoActual !== 'seleccionando-nivel') {
      console.warn('⚠️ Ignorando selección de nivel - estado incorrecto:', estadoActual);
      return;
    }

    nivelSeleccionado = niv;
    estadoActual = 'seleccionando-tiempo';
    
    console.log(`🎯 Nivel seleccionado: ${niv}`);
    
    // Cambiar a menú de tiempo
    setTimeout(() => {
      mostrarMenu(false);
    }, 100);
  }

  // 2) FUNCIONES DE TIEMPO
  function elegirTiempo(min) {
    if (estadoActual !== 'seleccionando-tiempo') {
      console.warn('⚠️ Ignorando selección de tiempo - estado incorrecto:', estadoActual);
      return;
    }

    tiempoSeleccionado = min;
    console.log(`⏱️ Tiempo seleccionado: ${min} minutos`);
    
    // Ir al juego
    setTimeout(() => {
      irAJuego();
    }, 300);
  }

  // 3) EVENT LISTENERS
  // Usar setTimeout para asegurar que el DOM esté completamente cargado
  setTimeout(() => {
    // Listeners de dificultad
    const btnFacil = document.querySelector('#boton-facil');
    const btnIntermedio = document.querySelector('#boton-intermedio');
    const btnDificil = document.querySelector('#boton-dificil');

    if (btnFacil) {
      btnFacil.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔘 Click en Fácil');
        elegirNivel('facil');
      });
    }

    if (btnIntermedio) {
      btnIntermedio.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔘 Click en Intermedio');
        elegirNivel('intermedio');
      });
    }

    if (btnDificil) {
      btnDificil.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔘 Click en Difícil');
        elegirNivel('dificil');
      });
    }

    // Listeners de tiempo
    const btn1min = document.querySelector('#boton-1min');
    const btn2min = document.querySelector('#boton-2min');
    const btn3min = document.querySelector('#boton-3min');

    if (btn1min) {
      btn1min.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔘 Click en 1 minuto');
        elegirTiempo(1);
      });
    }

    if (btn2min) {
      btn2min.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔘 Click en 2 minutos');
        elegirTiempo(2);
      });
    }

    if (btn3min) {
      btn3min.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔘 Click en 3 minutos');
        elegirTiempo(3);
      });
    }

    console.log('🚀 Event listeners configurados');
  }, 500);
});

/*let tiempoSeleccionado = null;
let nivelSeleccionado = null;

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

async function cargarNivel(dificultad) {

  const ok = await ensureMicPermission();
  if (!ok) {
    alert('Necesitas permitir el micrófono para continuar. Revísalo en el candado del navegador.');
    return; 
  }

  window.location.href = `game.html?nivel=${dificultad}`;


  if (tiempoSeleccionado) {
    setTimeout(() => {
      window.location.href = 'main.html'; //aca podemos cambiar a la parte de resultados y estrellitas
    }, tiempoSeleccionado * 60 * 1000); // minutos → milisegundos
  }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#boton-facil').addEventListener('click', () => {
    cargarNivel('facil');
    document.querySelector('#menu-dificultad').setAttribute('visible', 'false');
    document.querySelector('#menu-tiempo').setAttribute('visible', 'true');
  });

  document.querySelector('#boton-intermedio').addEventListener('click', () => {
    cargarNivel('intermedio');
    document.querySelector('#menu-dificultad').setAttribute('visible', 'false');
    document.querySelector('#menu-tiempo').setAttribute('visible', 'true');
  });

  document.querySelector('#boton-dificil').addEventListener('click', () => {
    cargarNivel('dificil');
    document.querySelector('#menu-dificultad').setAttribute('visible', 'false');
    document.querySelector('#menu-tiempo').setAttribute('visible', 'true');
  });

  document.querySelector('#boton-1min').addEventListener('click', () => {
    tiempoSeleccionado = 1;
    localStorage.setItem('tiempoSeleccionado', tiempoSeleccionado);
    document.querySelector('#menu-tiempo').setAttribute('visible', 'false');
  });

  document.querySelector('#boton-2min').addEventListener('click', () => {
    tiempoSeleccionado = 2;
    localStorage.setItem('tiempoSeleccionado', tiempoSeleccionado);
    document.querySelector('#menu-tiempo').setAttribute('visible', 'false');
  });

  document.querySelector('#boton-3min').addEventListener('click', () => {
    tiempoSeleccionado = 3;
    localStorage.setItem('tiempoSeleccionado', tiempoSeleccionado);
    document.querySelector('#menu-tiempo').setAttribute('visible', 'false');
  });
});*/