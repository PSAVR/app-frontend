let mediaRecorder = null;
let recordedChunks = [];
let uploadOnStop = false;
let segundosTranscurridos = 0;
let segundosRestantes = 0;
let intervaloContador = null;
let estadoSesion = 'idle';

const API_BASE = 'https://vr-backend-api-asdperfqg9a4fncv.canadacentral-01.azurewebsites.net';

function getNivelDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('nivel') || localStorage.getItem('nivelSeleccionado') || 'facil';
}

function nivelAId(n) {
  const map = { facil: 1, intermedio: 2, dificil: 3 };
  return map[String(n).toLowerCase()] ?? 1;
}

function getToken() {
  return localStorage.getItem("access_token");
}

function authHeaders(extra = {}) {
  const t = getToken();
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
}

async function getUserId() {
  const ls = localStorage.getItem('user_id');
  if (ls) return Number(ls);

  try {
    const r = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      headers: authHeaders(),
    });
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

function capitalizarNivel(n) {
  const map = {
    1: "Facil",
    2: "Intermedio",
    3: "Dificil",
    "facil": "Facil",
    "intermedio": "Intermedio",
    "dificil": "Dificil"
  };
  return map[n] || n;
}

function buildFeedbackMessage({
  band,
  promoted,
  toLevelId,
  stars,
  currentLevelName,
  pauseCount = null,
  pauseRatio = null,
  pausesPerMin = null
}) {
  let texto = "";

  if (promoted && toLevelId) {
    texto = `¡Excelente trabajo! Esta sesion fue lo suficientemente buena como para llevarte al nivel ${capitalizarNivel(toLevelId)}. `;
  } else if (stars === 2) {
    texto = `Lo estas haciendo bien, se nota el esfuerzo por mejorar. `;
  } else if (stars === 1) {
    texto = `Gracias por intentarlo, cada sesion te ayuda a mejorar. `;
  } else {
    texto = `Sigue practicando, la mejora llegara con el tiempo. `;
  }

  if (band === "baja") {
    texto += "Lograste mantener la calma, sigue mejorando. ";
  } else if (band === "media") {
    texto += "Hubieron momentos donde los nervios te ganaron pero diste tu mejor esfuerzo. ";
  } else if (band === "alta") {
    texto += "Se noto mas tensión durante la sesion, pero eso es parte del proceso. ";
  }

  if (pauseRatio !== null) {
    if (pauseRatio > 0.45) {
      texto += "Notamos que hiciste bastantes pausas largas; con practica puedes hacer que tu discurso suene mas fluido. ";
    } else if (pauseRatio > 0.25) {
      texto += "Hiciste algunas pausas naturales al hablar, aunque a veces cortaron un poco el ritmo. ";
    } else {
      texto += "Mantuviste un ritmo continuo y tu mensaje fluyo bien. ";
    }
  }

  if (!promoted) {
    texto += `Te mantienes en el nivel ${capitalizarNivel(currentLevelName)}.`;
  }

  return texto.trim();
}


function showResultModal({
  stars = 0,
  promoted = false,
  toLevelId = null,
  band = null,
  pauseCount = null,
  pauseRatio = null,
  pausesPerMin = null
}) {
  const currentLevelName = getNivelDesdeURL();

  const mensajeHtml = buildFeedbackMessage({
    band,
    promoted,
    toLevelId,
    stars,
    currentLevelName,
    pauseCount,
    pauseRatio,
    pausesPerMin
  });

  const mensajePlano = mensajeHtml.replace(/<[^>]+>/g, '');

  if (typeof showResult3D === 'function') {
    showResult3D(mensajePlano, stars, 'Resultados');
  } else {
    alert(mensajePlano);
  }
}


function showNoVoiceModal() {
  const mensaje = 'No se detectó ninguna voz, por favor intentar de nuevo.';

  if (typeof showResult3D === 'function') {
    showResult3D(mensaje, 0, 'Resultados');
  } else {
    alert(mensaje);
  }
}



function showMicBanner(message, color = "#842029", bg = "#f8d7da", border = "#f5c2c7") {
  let bar = document.getElementById("mic-banner");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "mic-banner";
    bar.style.cssText = `
      position:fixed; top:16px; left:50%; transform:translateX(-50%);
      z-index:99999;
      background:${bg}; color:${color}; border:2px solid ${border};
      border-radius:16px; padding:18px 22px;
      font:600 16px Inter,system-ui,Arial,sans-serif;
      max-width:min(92vw,880px); text-align:center; line-height:1.35;
      box-shadow:0 10px 30px rgba(0,0,0,.25);
      backdrop-filter:saturate(1.2) blur(1.5px);
    `;
    document.body.appendChild(bar);
  }
  bar.textContent = message;
  setTimeout(() => bar?.remove?.(), 9000);
}

function setMainButtonLabel(label) {
  const domBtn =
    document.getElementById('action-btn') ||
    document.getElementById('start-btn');

  if (domBtn) {
    domBtn.textContent = label;
  }

  const text3d = document.getElementById('action-btn-text');
  if (text3d) {
    text3d.setAttribute('value', label.toUpperCase());
  }
}


function handleMicError(err) {
  let msg = "No pudimos acceder al microfono.";
  let color = "#842029", bg = "#f8d7da", border = "#f5c2c7"; 

  switch (err?.name) {
    case "NotAllowedError":
      msg = "El microfono esta bloqueado. Activalo en Configuracion > Privacidad > Microfono o permite el acceso desde el navegador.";
      break;
    case "NotFoundError":
      msg = "No se detecto ningun microfono conectado o esta apagado en los ajustes del sistema.";
      break;
    case "NotReadableError":
      msg = "Otro programa esta usando el microfono. Cierralo e intentalo nuevamente.";
      break;
    default:
      msg = `Error de microfono: ${err?.name || "desconocido"}`;
  }

  showMicBanner(msg, color, bg, border);
  console.warn("Mic error:", err);

  try { if (typeof window.stopTimer === 'function') window.stopTimer(); } catch {}
  const btn =
  document.getElementById('action-btn') ||
  document.getElementById('start-btn') ||
  document.getElementById('action-btn-3d');
  if (btn) { btn.disabled = false; setMainButtonLabel('INICIAR');}
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
  showLoading3D();

  try {
    const base = 'https://vr-backend-api-asdperfqg9a4fncv.canadacentral-01.azurewebsites.net';
    const user_id = await getUserId();
    if (!user_id) {
      alert('Sesión no válida. Inicia sesión.');
      return;
    }

    const nivel = getNivelDesdeURL();
    const form = new FormData();
    form.append('audio', blobWebm, 'speech.webm');
    form.append('immersion_level_name', nivel);


    const r = await fetch(`${base}/api/sessions/audio`, {
      method: 'POST',
      body: form,
      headers: authHeaders(),
    });


    const data = await r.json();

    const payload = data?.result || data;
    
    const ansiedadRaw = payload?.model?.anxiety_pct ?? payload?.anxiety_pct;
    const ansiedadNum = Number(ansiedadRaw);
    const ansiedadValida = Number.isFinite(ansiedadNum);
    
    const band         = payload?.model?.band          ?? payload?.band          ?? null;
    const pauseCount   = payload?.model?.pause_count   ?? payload?.pause_count   ?? null;
    const pauseRatio   = payload?.model?.pause_ratio   ?? payload?.pause_ratio   ?? null;
    const pausesPerMin = payload?.model?.pauses_per_min?? payload?.pauses_per_min?? null;


    if (!ansiedadValida) {
      console.warn('Ansiedad inválida recibida desde el backend:', ansiedadRaw);
      hideLoading3D();
      showNoVoiceModal();
      return;
    }

    if (!r.ok) {
      hideLoading3D();
      throw new Error(data.error || 'Fallo procesando audio');
    }

    hideLoading3D();

    const star_rating = Number(
      data?.detail?.star_rating ??
      payload?.detail?.star_rating ??
      payload?.model?.stars ??
      0
    );

    const LEVEL_ID = { facil: 1, intermedio: 2, dificil: 3 };
    const currentId = LEVEL_ID[nivel] || 1;
    const promoted = star_rating >= 3 && currentId < 3;
    const toLevelId = promoted ? currentId + 1 : null;

    showResultModal({
      stars: star_rating,
      promoted,
      toLevelId,
      band,
      pauseCount,
      pauseRatio,
      pausesPerMin
    });

  } catch (err) {
    console.error('Error al enviar audio:', err);
    if (typeof hideLoading3D === 'function') hideLoading3D();
    showNoVoiceModal();
  }
}

window.onResultOk = function () {
  window.location.href = '/pages/main.html';
};


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

  const btn =
  document.getElementById('action-btn') ||
  document.getElementById('start-btn') ||
  document.getElementById('action-btn-3d');

  if (btn) {
    btn.disabled = false;
    setMainButtonLabel('INICIAR');
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

  const btn =
  document.getElementById('action-btn') ||
  document.getElementById('start-btn') ||
  document.getElementById('action-btn-3d');

  if (btn) {
    btn.disabled = false;
    setMainButtonLabel('ENVIAR');
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
  const btn =
  document.getElementById('action-btn') ||
  document.getElementById('start-btn') ||
  document.getElementById('action-btn-3d');

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

  const btn =
  document.getElementById('action-btn') ||
  document.getElementById('start-btn') ||
  document.getElementById('action-btn-3d');

  if (btn) {
    btn.disabled = false;
    setMainButtonLabel('INICIAR');
    btn.addEventListener('click', () => {
      if (estadoSesion === 'idle') {
        btn.disabled = true;
        setMainButtonLabel('Iniciando...');
        startImmersion()
          .then(() => {
            btn.disabled = false;
            setMainButtonLabel('ENVIAR');
            if (typeof startCountdown === 'function') startCountdown();
          })
          .catch((err) => {
            console.error(err);
            btn.disabled = false;
            setMainButtonLabel('INICIAR');
          });
      }  else if (estadoSesion === 'recording') {
        let elapsed = 0;

        if (window.initialSeconds !== undefined && window.countdownSeconds !== undefined) {
          elapsed = Math.max(0, window.initialSeconds - window.countdownSeconds);
          console.log('Tiempo transcurrido (desde game.html):', elapsed, 'segundos');
        } else {
          elapsed = segundosTranscurridos;
          console.log('Tiempo transcurrido (fallback):', elapsed, 'segundos');
        }
      
        const debeSubir = elapsed >= 30;
        console.log(debeSubir
          ? '30+ segundos - ENVIAR al modelo'
          : 'Menos de 30 segundos - NO enviar al modelo');
        
        if (typeof window.finalizarSesionWrapper === 'function') {
          window.finalizarSesionWrapper(debeSubir);
        } else {
          if (typeof stopTimer === 'function') stopTimer();
          finalizarSesion(debeSubir);
        }
      }
    });
  } else {
    console.warn('No se encontró #action-btn / #start-btn / #action-btn-3d');
  }
});

window.ensureMicReady = ensureMicReady;
window.handleMicError = handleMicError;