(function navDebugSafe() {
  const origAssign  = window.location.assign.bind(window.location);
  const origReplace = window.location.replace.bind(window.location);

  window.location.assign = function (url) {
    console.warn("[NAV] location.assign ->", url, "\n", new Error().stack);
    return origAssign(url);
  };

  window.location.replace = function (url) {
    console.warn("[NAV] location.replace ->", url, "\n", new Error().stack);
    return origReplace(url);
  };

  const origPush = history.pushState.bind(history);
  const origRep  = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    console.warn("[NAV] history.pushState ->", url, "\n", new Error().stack);
    return origPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    console.warn("[NAV] history.replaceState ->", url, "\n", new Error().stack);
    return origRep(state, title, url);
  };

  window.addEventListener("popstate", () => {
    console.warn("[NAV] popstate ->", location.href);
  });

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (a) console.warn("[NAV] click <a> ->", a.href, "\n", new Error().stack);
    },
    true
  );
})();


let mediaRecorder = null;
let recordedChunks = [];
let uploadOnStop = false;
let segundosTranscurridos = 0;
let segundosRestantes = 0;
let intervaloContador = null;
let estadoSesion = 'idle';

const API_BASE = '';

window.addEventListener('pagehide', (e) => console.warn('[PAGE] pagehide', e.persisted));
document.addEventListener('visibilitychange', () => console.warn('[PAGE] visibility', document.visibilityState));
window.addEventListener('freeze', () => console.warn('[PAGE] freeze'));
window.addEventListener('unhandledrejection', (e) => console.error('[ERR] unhandledrejection', e.reason));
window.addEventListener('error', (e) => console.error('[ERR] error', e.message, e.filename, e.lineno));


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
      credentials: 'include'
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
  const mensaje = 'No se detecto ninguna voz, por favor intentar de nuevo.';

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

async function pollSessionResult({ base, task_id, ctx, timeoutMs = 180000 }) {
  const t0 = Date.now();
  let attempt = 0;

  // 1s, 2s, 4s, 8s, 12s, 15s, 15s...
  const schedule = [1000, 2000, 4000, 8000, 12000, 15000];

  while (true) {
    const url = `${base}/api/sessions/audio_result/${encodeURIComponent(task_id)}?ctx=${encodeURIComponent(ctx)}`;
    const r = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: authHeaders(),
    });

    if (!r.ok) {
      let body = "";
      try { body = await r.text(); } catch {}
      throw new Error(`Error consultando resultado (${r.status}): ${body.slice(0, 160)}`);
    }

    const data = await r.json();
    if (data?.status === "done") return data;

    if (Date.now() - t0 > timeoutMs) {
      throw new Error("Timeout esperando resultado del modelo");
    }

    const idx = Math.min(attempt, schedule.length - 1);
    //let waitMs = schedule[idx];

    // jitter +/- 20% para evitar que muchos usuarios consulten al mismo tiempo
    //const jitter = 0.8 + Math.random() * 0.4;
    //waitMs = Math.round(waitMs * jitter);
    //attempt++;
    //await new Promise(res => setTimeout(res, waitMs));

    const waitMs = Math.round(15000 * (0.8 + Math.random() * 0.4));
    await new Promise(res => setTimeout(res, waitMs));

  }
}


async function enviarAudioYMostrarResultados(blob, ext='webm') {
  showLoading3D();

  try {
    const base = '';
    const user_id = await getUserId();
    if (!user_id) {
      hideLoading3D();
      alert('Sesión no válida. Inicia sesión.');
      return;
    }

    const nivel = getNivelDesdeURL();
    const form = new FormData();
    form.append('audio', blob, `speech.${ext}`);
    form.append('immersion_level_name', nivel);

    const enqueue = await fetch(`${base}/api/sessions/audio_async`, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: authHeaders(),
    });

    const enqueueData = await enqueue.json().catch(() => ({}));
    if (!enqueue.ok) {
      hideLoading3D();
      throw new Error(enqueueData.error || "Fallo en audio_async");
    }

    const { task_id, ctx } = enqueueData;
    if (!task_id || !ctx) {
      hideLoading3D();
      throw new Error("Respuesta inválida: falta task_id o ctx");
    }

    const doneData = await pollSessionResult({ base, task_id, ctx, timeoutMs: 180000 });

    const data = doneData?.result || doneData;


    const payload = data;
    const star_rating = Number(
      payload?.detail?.star_rating ??
      payload?.model?.stars ??
      0
    );

    
    const ansiedadRaw = payload?.model?.anxiety_pct ?? payload?.anxiety_pct;
    const ansiedadNum = Number(ansiedadRaw);
    const ansiedadValida = Number.isFinite(ansiedadNum);
    
    const band         = payload?.model?.band          ?? payload?.band          ?? null;
    const pauseCount   = payload?.model?.pause_count   ?? payload?.pause_count   ?? null;
    const pauseRatio   = payload?.model?.pause_ratio   ?? payload?.pause_ratio   ?? null;
    const pausesPerMin = payload?.model?.pauses_per_min?? payload?.pauses_per_min?? null;

    const silenceSeconds = payload?.model?.silence_seconds ?? null;
    if (silenceSeconds !== null && silenceSeconds >= 30) {
      hideLoading3D();
      if (typeof showResult3D === 'function') {
        showResult3D('Se detectaron más de 30 segundos de silencio. El audio fue descalificado, por favor intentar de nuevo.', 0, 'Audio descalificado');
      } else {
        alert('Se detectaron más de 30 segundos de silencio. El audio fue descalificado.');
      }
      return;
    }

    if (!ansiedadValida) {
      console.warn('Ansiedad inválida recibida desde el backend:', ansiedadRaw);
      hideLoading3D();
      showNoVoiceModal();
      return;
    }

    

    hideLoading3D();

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
  console.log("[NAV] OK pressed -> main.html");
  window.location.href = '/pages/main.html';
};


async function iniciarGrabacion() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });

    recordedChunks = [];

    const preferred = [
      'audio/mp4',
      'audio/aac',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];
    const mimeType = preferred.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';

    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    const track = stream.getAudioTracks()[0];
    track.addEventListener('ended', () => {
      window.__lastReason = 'mic_track_ended';
      console.warn('🎤 Track ended (iOS capture failure)');
      try { finalizarSesion(false); } catch {}
      showMicBanner("Se perdió el micrófono. Toca INICIAR y vuelve a intentar.");
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      showMicBanner("Error grabando audio en iPhone. Intenta de nuevo.");
    };

    mediaRecorder.onstop = async () => {
      try {
        const type = mimeType || recordedChunks?.[0]?.type || 'audio/mp4';
        const ext  = type.includes('mp4') ? 'mp4'
                 : type.includes('aac') ? 'aac'
                 : 'webm';
    
        console.log('[REC]', { type, ext, chunks: recordedChunks.length, totalBytes: recordedChunks.reduce((a,c)=>a+(c?.size||0),0) });
    
        const blob = new Blob(recordedChunks, { type });
        if (uploadOnStop) {
          await enviarAudioYMostrarResultados(blob, ext);
        } else {
          console.warn('[NAV] Redirect to main. Reason=', window.__lastReason);
          showMicBanner(
            "La grabación se detuvo antes de enviar. Toca INICIAR para intentar de nuevo.",
            "#664d03", "#fff3cd", "#ffecb5"
          );
        }
      } finally {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        restablecerUI();
      }
    };


    // chunks periódicos (menos memoria)
    mediaRecorder.start(1000); // 1s chunks
    console.log('Grabación iniciada', { mimeType });
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
