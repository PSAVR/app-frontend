let mediaRecorder = null;
let recordedChunks = [];
let uploadOnStop = false;
let segundosTranscurridos = 0;
let segundosRestantes = 0;
let intervaloContador = null;
let estadoSesion = 'idle';

function getNivelDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('nivel') || localStorage.getItem('nivelSeleccionado') || 'facil';
}

function nivelAId(n) {
  const map = { facil: 1, intermedio: 2, dificil: 3 };
  return map[String(n).toLowerCase()] ?? 1;
}

async function getUserId() {
  const ls = localStorage.getItem('user_id');
  if (ls) return Number(ls);
  try {
    const base = window.API_BASE || 'http://localhost:4000';
    const r = await fetch(`${base}/api/auth/me`, { credentials: 'include' });
    if (!r.ok) return null;
    const me = await r.json();
    localStorage.setItem('user_id', me.user_id);
    return me.user_id;
  } catch {
    return null;
  }
}

function renderStars(container, n) {
  container.innerHTML = '';
  const count = Math.max(0, Math.min(3, Number(n) || 0));
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.textContent = '★';
    container.appendChild(s);
  }
}

function showResultModal({ stars = 0, promoted = false, toLevelId = null }) {
  const overlay = document.getElementById('result-modal');
  const msgEl = document.getElementById('result-message');
  const starsEl = document.getElementById('result-stars');
  const okBtn = document.getElementById('result-ok');
  if (!overlay || !msgEl || !starsEl || !okBtn) {
    console.warn('Modal de resultados no encontrado');
    return;
  }

  if (promoted && toLevelId) {
    msgEl.textContent = `¡Excelente! Estás en el nivel ${toLevelId}.`;
  } else {
    msgEl.textContent = '¡Buen trabajo! Sigue intentándolo.';
  }

  renderStars(starsEl, stars);
  overlay.style.display = 'flex';
  okBtn.onclick = () => {
    overlay.style.display = 'none';
    window.location.href = '/pages/main.html';
  };
}

function showMicBanner(message, color = "#664d03", bg = "#fff3cd", border = "#ffeeba") {
  let bar = document.getElementById("mic-banner");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "mic-banner";
    bar.style.cssText = `
      position:fixed; top:16px; left:50%; transform:translateX(-50%);
      z-index:99999;
      background:${bg}; color:${color}; border:1px solid ${border};
      border-radius:12px; padding:14px 18px;
      font:500 14px Inter,system-ui,Arial,sans-serif;
      max-width:min(90vw,720px); text-align:center;
      box-shadow:0 6px 20px rgba(0,0,0,.15);
    `;
    document.body.appendChild(bar);
  }
  bar.textContent = message;
  setTimeout(() => bar?.remove?.(), 8000);
}

function handleMicError(err) {
  let msg = "No pudimos acceder al micrófono.";
  let color = "#842029", bg = "#f8d7da", border = "#f5c2c7"; // rojo claro

  switch (err?.name) {
    case "NotAllowedError":
      msg = "El micrófono está bloqueado. Actívalo en Configuración > Privacidad > Micrófono o permite el acceso desde el navegador.";
      break;
    case "NotFoundError":
      msg = "No se detectó ningún micrófono conectado o está apagado en los ajustes del sistema.";
      break;
    case "NotReadableError":
      msg = "Otro programa está usando el micrófono. Ciérralo e inténtalo nuevamente.";
      break;
    default:
      msg = `Error de micrófono: ${err?.name || "desconocido"}`;
  }

  showMicBanner(msg, color, bg, border);
  console.warn("Mic error:", err);
}

async function ensureMicReady() {
  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "microphone" });
      if (status.state === "denied") {
        handleMicError({ name: "NotAllowedError" });
        throw new Error("Mic denied");
      }
    } catch (_) { /* browsers sin permissions.query */ }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop()); 
    return true;
  } catch (err) {
    handleMicError(err);
    throw err;
  }
}

async function enviarAudioYMostrarResultados(blobWebm) {
  try {
    const base = window.API_BASE || 'http://localhost:4000';
    const user_id = await getUserId();
    if (!user_id) {
      alert('Sesión no válida. Inicia sesión.');
      return;
    }

    const nivel = getNivelDesdeURL();
    const form = new FormData();
    form.append('audio', blobWebm, 'speech.webm');
    form.append('user_id', String(user_id));
    form.append('immersion_level_name', nivel);

    const loading = document.getElementById('loading-modal');
    if (loading) loading.style.display = 'flex';

    const r = await fetch(`${base}/api/sessions/audio`, {
      method: 'POST',
      body: form,
      credentials: 'include'
    });
    const data = await r.json();
    if (loading) loading.style.display = 'none';
    if (!r.ok) throw new Error(data.error || 'Fallo procesando audio');

    const star_rating = Number(data?.detail?.star_rating ?? data?.model?.stars ?? 0);
    const LEVEL_ID = { facil: 1, intermedio: 2, dificil: 3 };
    const currentId = LEVEL_ID[nivel] || 1;
    const promoted = star_rating >= 3 && currentId < 3;
    const toLevelId = promoted ? currentId + 1 : null;

    showResultModal({ stars: star_rating, promoted, toLevelId });
  } catch (err) {
    console.error('Error al enviar audio:', err);
    alert('No se pudo procesar la simulación.');
    showResultModal({ stars: 0, promoted: false });
  }
}

async function iniciarGrabacion() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        if (uploadOnStop) {
          console.log('Enviando audio para procesamiento...');
          await enviarAudioYMostrarResultados(blob);
        } else {
          console.log('Menos de 30 segundos, redirigiendo a main...');
          window.location.href = '/pages/main.html';
        }
      } finally {
        try { stream.getTracks().forEach((t) => t.stop()); } catch {}
        restablecerUI();
      }
    };

    mediaRecorder.start();
    console.log('Grabación iniciada');
  } catch (err) {
    handleMicError(err);
    throw err;
  }
}

function detenerGrabacion() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('Grabación detenida, uploadOnStop:', uploadOnStop);
  }
}

function restablecerUI() {
  estadoSesion = 'idle';
  segundosTranscurridos = 0;
  segundosRestantes = 0;
  if (intervaloContador) clearInterval(intervaloContador);

  const btn = document.getElementById('action-btn') || document.getElementById('start-btn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'INICIAR';
  }

  const textoContador = document.querySelector('#contador-texto');
  if (textoContador) {
    textoContador.setAttribute('text', {
      value: 'Tiempo restante: 0:00',
      color: 'orange',
      font: 'mozillavr',
      width: 4
    });
  }
}

async function startImmersion() {
  try {
    await ensureMicReady();
  } catch (err) {
    estadoSesion = 'idle';
    throw err;
  }

  const minutos = parseInt(localStorage.getItem('tiempoSeleccionado'), 10) || 1;
  segundosRestantes = minutos * 60;
  segundosTranscurridos = 0;
  uploadOnStop = false;
  estadoSesion = 'recording';

  const btn = document.getElementById('action-btn') || document.getElementById('start-btn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'ENVIAR';
  }

  try {
    await iniciarGrabacion();
  } catch (err) {
    estadoSesion = 'idle';
    throw err;
  }
}

function finalizarSesion(subir) {
  console.log('finalizarSesion llamado - subir:', subir);
  uploadOnStop = !!subir;
  const btn = document.getElementById('action-btn') || document.getElementById('start-btn');
  if (btn) btn.disabled = true;
  if (intervaloContador) clearInterval(intervaloContador);
  detenerGrabacion();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.SKIP_GLOBAL_BINDINGS) return;
  const escena = document.getElementById('escena-vr');
  const nivel = getNivelDesdeURL();
  const config = CONFIG_ESCENARIOS[nivel];

  if (!config) {
    console.warn(`No hay configuración para el nivel: ${nivel}`);
  } else {
    const modelo = document.createElement('a-entity');
    modelo.setAttribute('gltf-model', config.modelo.src);
    modelo.setAttribute('scale', config.modelo.scale);
    modelo.setAttribute('position', config.modelo.position);
    modelo.setAttribute('rotation', config.modelo.rotation);
    document.getElementById('contenedor-modelo')?.appendChild(modelo);

    (config.luces || []).forEach((luz) => {
      const entidadLuz = document.createElement('a-light');
      Object.entries(luz).forEach(([k, v]) => entidadLuz.setAttribute(k, v));
      escena?.appendChild(entidadLuz);
    });
  }

  const btn = document.getElementById('action-btn') || document.getElementById('start-btn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'INICIAR';
    btn.addEventListener('click', () => {
      if (estadoSesion === 'idle') {
        btn.disabled = true;
        btn.textContent = 'Iniciando...';
        startImmersion()
          .then(() => {
            btn.disabled = false;
            btn.textContent = 'ENVIAR';
            // Iniciar el temporizador de game.html
            if (typeof startCountdown === 'function') {
              startCountdown();
            }
          })
          .catch((err) => {
            console.error(err);
            btn.disabled = false;
            btn.textContent = 'INICIAR';
          });
      } else if (estadoSesion === 'recording') {
        // CALCULAR EL TIEMPO TRANSCURRIDO CORRECTAMENTE
        let elapsed = 0;

        // Intentar obtener el tiempo desde game.html
        if (window.initialSeconds !== undefined && window.countdownSeconds !== undefined) {
          elapsed = Math.max(0, window.initialSeconds - window.countdownSeconds);
          console.log('Tiempo transcurrido (desde game.html):', elapsed, 'segundos');
        } else {
          // Fallback: usar segundosTranscurridos
          elapsed = segundosTranscurridos;
          console.log('Tiempo transcurrido (fallback):', elapsed, 'segundos');
        }

        // Detener el temporizador visual
        if (typeof stopTimer === 'function') {
          stopTimer();
        }

        if (elapsed < 30) {
          console.log('Menos de 30 segundos - NO enviar al modelo');
          finalizarSesion(false);
        } else {
          console.log('30+ segundos - ENVIAR al modelo');
          finalizarSesion(true);
        }
      }
    });
  } else {
    console.warn('No se encontró #action-btn / #start-btn');
  }
});

/* Export opcional por si lo necesitas en otras páginas */
window.ensureMicReady = ensureMicReady;
window.handleMicError = handleMicError;