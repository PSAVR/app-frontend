let tiempoSeleccionado = null;

function cargarNivel(dificultad) {
  const modelo = document.querySelector('#modelo');
  
  switch(dificultad) {
    case 'facil':
      window.location.href = '/pages/facil/facil.html';
      break;
    case 'intermedio':
      window.location.href = '/pages/inter/inter.html';
      break;
    case 'dificil':
      window.location.href = '/pages/dificil/dificil.html';
      break;
    default:
      console.log('Dificultad no válida');
  }
  if (tiempoSeleccionado) {
    setTimeout(() => {
      window.location.href = 'main.html'; //aca podemos cambiar a la parte de resultados y estrellitas
    }, tiempoSeleccionado * 60 * 1000); // minutos → milisegundos
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#boton-1min').addEventListener('click', () => {
    tiempoSeleccionado = 1;
    localStorage.setItem('tiempoSeleccionado', tiempoSeleccionado);
    document.querySelector('#menu-tiempo').setAttribute('visible', 'false');
    document.querySelector('#menu-dificultad').setAttribute('visible', 'true');
  });

  document.querySelector('#boton-2min').addEventListener('click', () => {
    tiempoSeleccionado = 2;
    localStorage.setItem('tiempoSeleccionado', tiempoSeleccionado);
    document.querySelector('#menu-tiempo').setAttribute('visible', 'false');
    document.querySelector('#menu-dificultad').setAttribute('visible', 'true');
  });

  document.querySelector('#boton-facil').addEventListener('click', () => {
    cargarNivel('facil');
    document.querySelector('#menu-dificultad').setAttribute('visible', 'false');
  });

  document.querySelector('#boton-intermedio').addEventListener('click', () => {
    cargarNivel('intermedio');
  });

  document.querySelector('#boton-dificil').addEventListener('click', () => {
    console.log('Redirigiendo a dificil.html');
    cargarNivel('dificil');
    
  });
});