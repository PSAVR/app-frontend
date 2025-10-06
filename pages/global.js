let mediaRecorder;
let audioChunks = [];
let tiempoTerminado = false;

/* ========= (opcional, ya no lo usamos) WAV local =========
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  }
  writeString(view, 0, 'RIFF'); view.setUint32(4, length - 8, true);
  writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true); view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * numOfChan * 2, true); view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true); writeString(view, 36, 'data');
  view.setUint32(40, length - 44, true);
  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
  let pos = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let chan = 0; chan < numOfChan; chan++) {
      const sample = Math.max(-1, Math.min(1, channels[chan][i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
  }
  return new Blob([bufferArray], { type: 'audio/wav' });
}
=========================================================== */

function getNivelDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('nivel') || 'facil';
}
function nivelAId(n) {
  const map = { facil: 1, intermedio: 2, dificil: 3 };
  return map[String(n).toLowerCase()] ?? 1;
}
async function getUserId() {
  const ls = localStorage.getItem('user_id');
  if (ls) return Number(ls);
  try {
    const base = (window.API_BASE || 'http://localhost:4000');
    const r = await fetch(`${base}/api/auth/me`, { credentials: 'include' });
    if (!r.ok) return null;
    const me = await r.json();
    localStorage.setItem('user_id', me.user_id);
    return me.user_id;
  } catch { return null; }
}

/* === Modal dinámico (ansiedad, progreso, estrellas) === */
function drawStars(n = 0) {
  const row = document.getElementById("estrellas-ultima-sesion");
  if (!row) return;
  row.innerHTML = '';
  for (let i = 0; i < Math.max(0, n); i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.textContent = '★';
    row.appendChild(s);
  }
}
function mostrarModalProgreso(resumen, datos = null) {
  const overlay = document.getElementById('progreso-modal');
  if (!overlay) { console.error("No se encontró el modal progreso-modal"); return; }

  const resumenEl = document.getElementById("resumen-progreso");
  if (resumenEl) resumenEl.textContent = resumen || "¡Sesión completada!";

  // Si el backend devolvió métricas, muéstralas
  if (datos) {
    const { ansiedad_pct = null, progress_percentage = null, star_rating = null } = datos;
    const aPct = document.getElementById('ansiedad-pct');
    const pPct = document.getElementById('progreso-pct');
    const sNum = document.getElementById('estrellas-num');
    if (aPct) aPct.textContent = ansiedad_pct == null ? '—' : Math.round(ansiedad_pct);
    if (pPct) pPct.textContent = progress_percentage == null ? '—' : Math.round(progress_percentage);
    if (sNum) sNum.textContent = star_rating == null ? '—' : star_rating;
    drawStars(star_rating || 0);
  } else {
    // fallback si no hay datos
    const cont = document.getElementById("estrellas-ultima-sesion");
    if (cont) cont.innerHTML = "★★★";
  }

  overlay.style.display = "flex";
  overlay.classList.add("active");

  const btnRepetir = document.getElementById("btn-repetir");
  const btnSalir = document.getElementById("btn-salir");
  if (btnRepetir) btnRepetir.onclick = (e) => { e.preventDefault(); overlay.classList.remove("active"); overlay.style.display = "none"; window.location.reload(); };
  if (btnSalir)   btnSalir.onclick   = (e) => { e.preventDefault(); overlay.classList.remove("active"); overlay.style.display = "none"; window.location.href = "../../index.html"; };
}

/* === Envío al backend y despliegue del resultado === */
async function enviarAudioYMostrarResultados(blobWebm) {
  try {
    const base = (window.API_BASE || 'http://localhost:4000');
    const user_id = await getUserId();
    if (!user_id) { alert('Sesión no válida. Inicia sesión.'); return; }

    const nivel = getNivelDesdeURL();
    const level_id = nivelAId(nivel);

    const form = new FormData();
    form.append('audio', blobWebm, 'speech.webm');   // el server convierte a WAV
    form.append('user_id', String(user_id));
    form.append('level_id', String(level_id));

    const r = await fetch(`${base}/api/sessions/audio`, {
      method: 'POST',
      body: form,
      credentials: 'include'
    });
    const data = await r.json();

    if (!r.ok) throw new Error(data.error || 'Fallo procesando audio');

    // Esperamos: { model: { anxiety_pct }, detail: { progress_percentage, star_rating }, ... }
    const ansiedad_pct        = data?.model?.anxiety_pct ?? null;
    const progress_percentage = data?.detail?.progress_percentage ?? null;
    const star_rating         = data?.detail?.star_rating ?? null;

    mostrarModalProgreso("¡Tiempo completado! Buen trabajo.", {
      ansiedad_pct, progress_percentage, star_rating
    });
  } catch (err) {
    console.error('Error al enviar audio:', err);
    alert('No se pudo procesar la simulación. Revisa el servidor.');
    mostrarModalProgreso("Sesión finalizada, pero no se pudo evaluar.");
  }
}

/* === Grabación === */
async function iniciarGrabacion() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blobWebm = new Blob(audioChunks, { type: 'audio/webm' });

      if (tiempoTerminado) {
        // -> integrar con modelo
        await enviarAudioYMostrarResultados(blobWebm);
      } else {
        // Si el usuario detuvo antes, regresar al inicio
        setTimeout(() => { window.location.href = '../../index.html'; }, 1000);
      }
    };

    audioChunks = [];
    mediaRecorder.start();
    console.log("🎙️ Grabación iniciada");
  } catch (error) {
    console.error("Error accediendo al micrófono:", error);
  }
}

function detenerGrabacion() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log("⏹️ Grabación detenida");
  }
}

/* === Escena (igual que tu original, no toco escenarios) === */
document.addEventListener('DOMContentLoaded', () => {
  const escena = document.getElementById('escena-vr');
  const nivel = getNivelDesdeURL();
  const config = CONFIG_ESCENARIOS[nivel];

  if (!config) {
    console.warn(`No hay configuración para el nivel: ${nivel}`);
    return;
  }

  // Modelo
  const modelo = document.createElement('a-entity');
  modelo.setAttribute('gltf-model', config.modelo.src);
  modelo.setAttribute('scale', config.modelo.scale);
  modelo.setAttribute('position', config.modelo.position);
  modelo.setAttribute('rotation', config.modelo.rotation);
  document.getElementById('contenedor-modelo').appendChild(modelo);

  // Luces
  config.luces.forEach(luz => {
    const entidadLuz = document.createElement('a-light');
    Object.entries(luz).forEach(([key, value]) => entidadLuz.setAttribute(key, value));
    escena.appendChild(entidadLuz);
  });

  // Contador + grabación
  const tiempo = parseInt(localStorage.getItem('tiempoSeleccionado'));
  if (tiempo && !isNaN(tiempo)) {
    const tiempoTotalSegundos = tiempo * 60;
    const textoContador = document.querySelector('#contador-texto');
    let segundosRestantes = tiempoTotalSegundos;

    iniciarGrabacion();

    const intervalo = setInterval(() => {
      const minutos = Math.floor(segundosRestantes / 60);
      const segundos = segundosRestantes % 60;

      if (textoContador) {
        textoContador.setAttribute('text', {
          value: `Tiempo restante: ${minutos}:${segundos < 10 ? '0' + segundos : segundos}`,
          color: 'orange',
          font: 'mozillavr',
          width: 4
        });
      }

      if (segundosRestantes <= 0) {
        clearInterval(intervalo);
        tiempoTerminado = true;
        detenerGrabacion();
      }
      segundosRestantes--;
    }, 1000);
  } else {
    console.warn('No se encontró tiempo seleccionado.');
  }
});


/*let mediaRecorder;
  let audioChunks = [];
  let tiempoTerminado = false;
  
  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
  
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
  
    writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numOfChan * 2, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);
  
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }
  
    let pos = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let chan = 0; chan < numOfChan; chan++) {
        const sample = Math.max(-1, Math.min(1, channels[chan][i]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
    }
  
    return new Blob([bufferArray], { type: 'audio/wav' });
  }
  
  async function iniciarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
  
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
  
      mediaRecorder.onstop = async () => {
        const blobWebm = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await blobWebm.arrayBuffer();
        const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);
  
        const wavBlob = audioBufferToWav(audioBuffer);
        const wavUrl = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = wavUrl;
        a.download = 'grabacion.wav';
        a.click();
        URL.revokeObjectURL(wavUrl);

        if (tiempoTerminado) {
          // Mostrar resultados al terminar el tiempo
          mostrarModalProgreso("¡Tiempo completado! Buen trabajo.");
        } else {
          // Si el usuario detuvo antes, regresar al inicio
          setTimeout(() => {
            window.location.href = '../../index.html';
          }, 1000);
        }
      };
  
      audioChunks = [];
      mediaRecorder.start();
      console.log("🎙️ Grabación iniciada");
    } catch (error) {
      console.error("Error accediendo al micrófono:", error);
    }
  }
  
  function detenerGrabacion() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      console.log("⏹️ Grabación detenida");
    }
  }

  function getNivelDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('nivel') || 'facil'; // valor por defecto
  }

  // Función para mostrar el modal de estrellas
function mostrarModalProgreso(resumen = "¡Sesión completada! Bien hecho!") {
  console.log("Intentando mostrar modal de progreso...");
  
  const overlay = document.getElementById('progreso-modal');
  if (!overlay) {
    console.error("No se encontró el modal progreso-modal");
    return;
  }

  console.log("Modal encontrado, configurando...");

  // Actualizar el resumen
  const resumenEl = document.getElementById("resumen-progreso");
  if (resumenEl) {
    resumenEl.textContent = resumen;
  }

  // Mostrar 3 estrellas fijas
  const contenedorEstrellas = document.getElementById("estrellas-ultima-sesion");
  if (contenedorEstrellas) {
    contenedorEstrellas.innerHTML = "★★★";
    console.log("Estrellas configuradas");
  } else {
    console.error("No se encontró el contenedor de estrellas");
  }

  // Mostrar el modal
  overlay.style.display = "flex";
  overlay.classList.add("active");
  
  console.log("Modal mostrado");

  // Configurar botones
  const btnRepetir = document.getElementById("btn-repetir");
  const btnSalir = document.getElementById("btn-salir");

  if (btnRepetir) {
    btnRepetir.onclick = (e) => {
      e.preventDefault();
      console.log("Botón repetir clickeado");
      overlay.style.display = "none";
      overlay.classList.remove("active");
      window.location.reload();
    };
  }

  if (btnSalir) {
    btnSalir.onclick = (e) => {
      e.preventDefault();
      console.log("Botón salir clickeado");
      overlay.style.display = "none";
      overlay.classList.remove("active");
      window.location.href = "../../index.html";
    };
  }
}


  document.addEventListener('DOMContentLoaded', () => {
    const escena = document.getElementById('escena-vr');
    const nivel = getNivelDesdeURL();
    const config = CONFIG_ESCENARIOS[nivel];
  
    if (!config) {
      console.warn(`No hay configuración para el nivel: ${nivel}`);
      return;
    }
  
    // Cargar modelo
    const modelo = document.createElement('a-entity');
    modelo.setAttribute('gltf-model', config.modelo.src);
    modelo.setAttribute('scale', config.modelo.scale);
    modelo.setAttribute('position', config.modelo.position);
    modelo.setAttribute('rotation', config.modelo.rotation);
    document.getElementById('contenedor-modelo').appendChild(modelo);
  
    // Cargar luces
    config.luces.forEach(luz => {
      const entidadLuz = document.createElement('a-light');
      Object.entries(luz).forEach(([key, value]) => {
        entidadLuz.setAttribute(key, value);
      });
      escena.appendChild(entidadLuz);
    });

    const tiempo = parseInt(localStorage.getItem('tiempoSeleccionado'));
    if (tiempo && !isNaN(tiempo)) {
      const tiempoTotalSegundos = tiempo * 60;
      const textoContador = document.querySelector('#contador-texto');
      let segundosRestantes = tiempoTotalSegundos;
  
      iniciarGrabacion();
  
      const intervalo = setInterval(() => {
        const minutos = Math.floor(segundosRestantes / 60);
        const segundos = segundosRestantes % 60;
  
        if (textoContador) {
            textoContador.setAttribute('text', {
                value: `Tiempo restante: ${minutos}:${segundos < 10 ? '0' + segundos : segundos}`,
                color: 'orange',
                font: 'mozillavr',
                width: 4
              });
        }
  
        if (segundosRestantes <= 0) {
          clearInterval(intervalo);
          tiempoTerminado = true;
          detenerGrabacion();
        }
  
        segundosRestantes--;
      }, 1000);
    } else {
      console.warn('No se encontró tiempo seleccionado.');
    }
  });
*/