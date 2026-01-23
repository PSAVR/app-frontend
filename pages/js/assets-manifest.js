window.ASSET_MANIFEST = {
  facil: {
    scene: {
      id: "modelo-facil",
      src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/facil/easy-scenario2_ios_final.glb",
      position: "-4 0 -7",
      rotation: "0 -90 0"
    },
    /*visitors: [
      { entityId: "static-visitor",  assetId: "lvl1-visitor",  src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/m1sitted.glb", components: { "idle-pose": "" },           // componente sin valor
        attrs: {
          position: "-1.5 0.2 -3.8",
          scale: "0.5 0.5 0.5",
          visible: "true"
        }},
      { entityId: "static-visitor2", assetId: "lvl1-visitor2", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p1.glb", components: { "idle-pose": "" },
        attrs: {
            position:"-2.3 0.2 -2.3",
            scale:"0.35 0.35 0.35",
            visible: "true"} },
      { entityId: "static-visitor3", assetId: "lvl1-visitor3", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/exit_ios.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-3.5 0.2 -6.3",
          scale: "1 1 1",
          rotation: "0 90 0",
          visible: "false"
        }},
      { entityId: "static-visitor4", assetId: "lvl1-visitor4", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/womanclapping.glb", components: { "idle-pose": "" },
        attrs: {
          position: "0.8 0.3 -6",
          scale: "1.1 0.9 0.9",
          visible: "true"
        }}
    ]*/
  },

  intermedio: {
    scene: {
      id: "modelo-inter",
      src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/inter/inter-class_ios5.glb",
      rotation: "0 180 0",
      position: "-2 -0.5 -6.5"
    },
    visitors: [
      { entityId: "static-visitor2_1", assetId: "lvl2-visitor",  src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/mansitted.glb", components: { "idle-pose": "", "fix-mixamo-shine": "" },
        attrs: {
          position: "-5 -0.6 -8",
          scale: "1.3 1.5 1.3"
        }},
      { entityId: "static-visitor2_2", assetId: "lvl2-visitor2", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p12bored.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-4.6 -0.3 -4.3",
          scale: "0.35 0.4 0.4"
        }},
      { entityId: "static-visitor2_3", assetId: "lvl2-visitor3", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p9.glb", components: { "idle-pose": "" },
        attrs: {
            position: "1.2 -0.5 -0.6",
            scale: "0.5 0.5 0.5"
        }},
      { entityId: "static-visitor2_4", assetId: "lvl2-visitor4", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/exit.glb", components: { "idle-pose": "", "fix-mixamo-shine": "" },
        attrs: {
          position: "-6 -0.4 -1",
          scale: "1.3 1.32 1.3",
          rotation: "0 90 0",
          visible: "false"
        }},
      { entityId: "static-visitor2_5", assetId: "lvl2-visitor5", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p5.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-2 -0.5 -11",
          scale: "0.4 0.45 0.4"
        }}
    ]
  },

  dificil: {
    scene: {
      id: "modelo-dificil",
      src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/dif/lecturehall2.glb",
      position: "-19.4 -0.75 4"
    },
    visitors: [
      { entityId: "static-visitor-3",   assetId: "lvl3-visitor",   src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/mansitted.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-1.4 0.8 -11",
          scale: "1.3 1.5 1.3"
        }},
      { entityId: "static-visitor-3_1", assetId: "lvl3-visitor-1", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/womanclapping.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-13 1 -10.3",
          scale: "1.2 1.2 1.2",
        }},
      { entityId: "static-visitor-3_2", assetId: "lvl3-visitor-2", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p12bored.glb", components: { "idle-pose": "" },
        attrs: {
          position: "1.8 -0.1 -4",
          scale: "0.35 0.44 0.35"
        }},
      { entityId: "static-visitor-3_3", assetId: "lvl3-visitor-3", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p5.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-4.8 -1 -5",
          scale: "0.4 0.4 0.4"
        }},
      { entityId: "static-visitor-3_4", assetId: "lvl3-visitor-4", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/p9.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-11.8 0.4 -7",
          scale: "0.4 0.4 0.4"
        }},
      { entityId: "static-visitor-3_5", assetId: "lvl3-visitor-5", src: "https://pub-f87255c375b24881b5f81a9c0d85cedc.r2.dev/models/people/m1sitted.glb", components: { "idle-pose": "" },
        attrs: {
          position: "-12.6 1.5 -11.7",
          scale: "0.6 0.55 0.5"
        }}
    ]
  }
};
