const modelosPorNivel = {
    facil: '../../models/facil/facilscenarioo.glb',
    intermedio: '../../models/inter/classroom.glb',
    dificil: '../../models/dif/dificil_wop.glb'
  };
  
  let mediaRecorder;
  let audioChunks = [];
  
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
  
        setTimeout(() => {
          window.location.href = '../../index.html';
        }, 1000);
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
  
  document.addEventListener('DOMContentLoaded', () => {
    // Cargar el modelo del nivel
    const scene = document.querySelector('a-scene');
  
    scene.addEventListener('click', () => {
        scene.enterVR();
    });
    const escena = document.querySelector('#nivel-vr');
    const nivel = escena?.getAttribute('data-nivel') || 'facil';
  
    const assets = document.querySelector('a-assets');
    const asset = document.createElement('a-asset-item');
    asset.setAttribute('id', `modelo-${nivel}`);
    asset.setAttribute('src', modelosPorNivel[nivel]);
    assets.appendChild(asset);
  
    const escenario = document.createElement('a-entity');
    escenario.setAttribute('id', `escenario-${nivel}`);
  
    const modelo = document.createElement('a-entity');
    modelo.setAttribute('gltf-model', `#modelo-${nivel}`);
    if (nivel === 'facil') {
        modelo.setAttribute('position', '-2 -10.3 -10');
        modelo.setAttribute('rotation', '0 -90 0');
        modelo.setAttribute('scale', '1 1 1');    
    }
    if (nivel === 'dificil') {
        modelo.setAttribute('position', '0 -1 -4');
        modelo.setAttribute('rotation', '0 0 0');
        modelo.setAttribute('scale', '1.5 1.5 1.5');    
    }
    if (nivel === 'intermedio') {
        modelo.setAttribute('position', '0 -24 -106');
        modelo.setAttribute('rotation', '0 -90 0');
        modelo.setAttribute('scale', '1 1 1');    
    }
  
    escenario.appendChild(modelo);
    escena.appendChild(escenario);
  
    // Control del contador
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
                font: 'mozillavr', // fuente en negrita, o puedes probar 'kelsonsans'
                width: 4
              });
        }
  
        if (segundosRestantes <= 0) {
          clearInterval(intervalo);
          detenerGrabacion();
        }
  
        segundosRestantes--;
      }, 1000);
    } else {
      console.warn('No se encontró tiempo seleccionado.');
    }
  });
  