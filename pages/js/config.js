const CONFIG_ESCENARIOS = {
    facil: {
      modelo: {
        src: "#modelo-facil",
        path: "../models/facil/easy-scenario2.glb",
        rotation: '0 -90 0',
        scale: '8 8 8',
        position: '-33 -10 -55',
      },
      luces: [
        { type: 'ambient', color: '#DDDDDD', intensity: '2' },
        { type: 'directional', color: '#FFFFFF', intensity: '2', position: '5 10 -5' },
        { type: 'point', color: '#FFFDD0', intensity: '1.5', position: '0 3 0', distance: '5', castShadow: 'true' }
      ]
    }, 
    intermedio: {
      modelo: {
        src: "#modelo-inter",
        path: "../models/inter/inter-class.glb",
        scale: '12 12 12',
        position: '-25 -20 -80',
        rotation: '0 180 0',
      },
      luces: [
        { type: 'ambient', color: '#A0A0A0', intensity: '0.1' },
        { type: 'directional', color: '#FFFFFF', intensity: '2', position: '8 15 -10' },
        { type: 'directional', color: '#FFFFFF', intensity: '1.8', position: '-8 5 10' },
        { type: 'directional', color: '#EFFFFF', intensity: '11.5', position: '-20 10 -15' },
      ]
    },
    dificil: { 
      modelo: {
        src: "#modelo-dificil",
        path: "../models/dif/lecturehall2.glb",
        position: '-29 -2 9',
        scale: '1.5 1.5 1.5',
        rotation: '0 0 0',
      },
      luces: [
        { type: 'ambient', color: '#DDDDFF', intensity: '2' },
        { type: 'directional', color: '#FFFFFF', intensity: '2.5', position: '2 4 2' },
        { type: 'point', color: '#99CCFF', intensity: '0.2', position: '-3 2 2' }
      ]
    } 
  };
  