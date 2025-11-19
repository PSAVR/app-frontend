
AFRAME.registerComponent("fix-mixamo-shine", {
  init() {
    this.el.addEventListener("model-loaded", () => {
      this.el.object3D.traverse((node) => {
        if (!node.isMesh || !node.material) return;

        const mat = node.material;

        mat.envMap = null;           
        mat.envMapIntensity = 0.0;   

        mat.metalness = 0.0;
        mat.roughness = 1.0;

        if (mat.color) mat.color.multiplyScalar(0.93);

        mat.needsUpdate = true;
      });

      console.log("🧽 FULL SHINE FIX applied to:", this.el.id);
    });
  }
});

function triggerEmojiBurst(audioId) {
  const set = EMOJI_MAP[audioId];
  if (!set) return;
  const slots = Math.max(0, MAX_ONSCREEN - ACTIVE_EMOJIS.size);
  if (slots === 0) return;
  const n = Math.min(slots, 3 + Math.floor(Math.random() * 3));
  console.log(`[Emojis] burst ${audioId} (${n})`);
  for (let i = 0; i < n; i++) {
    const face = set[Math.floor(Math.random() * set.length)];
    setTimeout(() => spawnEmoji(face), i * 120);
  }
}

function applyMinDistance(visitors, minGap = 10) {
  // Ordenar una sola vez
  visitors.sort((a, b) => a.triggerTime - b.triggerTime);

  for (let i = 1; i < visitors.length; i++) {
    const minAllowed = visitors[i-1].triggerTime + minGap;
    if (visitors[i].triggerTime < minAllowed) {
      visitors[i].triggerTime = minAllowed;
    }
  }
}



AFRAME.registerComponent("lvl2-visitor-event", {
  schema: { enabled: { default: false } },

  init: function () {
    if (!this.data.enabled) return;

    let TOTAL_TIME, MIN_TIME, MAX_TIME, NUM_EVENTS;

    if (window.evalMode) {
      TOTAL_TIME = 30;
      MIN_TIME   = 3;
      MAX_TIME   = 17;
    } else {
      const minutos = parseInt(localStorage.getItem("tiempoSeleccionado") || "1");
      TOTAL_TIME = minutos * 60;
      MIN_TIME   = TOTAL_TIME * 0.10;
      MAX_TIME   = TOTAL_TIME * 0.65;
    }

    const TARGETS = [
      "#static-visitor2_1",
      "#static-visitor2_2",
      "#static-visitor2_3",
      "#static-visitor2_5"
    ];

    NUM_EVENTS = TARGETS.length * 2; 
    if (window.evalMode) NUM_EVENTS = 4;   // << modo evaluación

    this.visitors = [];

    TARGETS.forEach(selector => {
      for (let i = 0; i < NUM_EVENTS / TARGETS.length; i++) {
        this.visitors.push({
          selector,
          triggered: false,
          triggerTime: Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME
        });
      }
    });

    this.visitors.push({
      selector: "#static-visitor2_4",
      triggered: false,
      triggerTime: Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME
    });

    applyMinDistance(this.visitors, 6);

    this.startTime = null;

    console.log("📋 EVENTOS NIVEL 2 PROGRAMADOS (FINAL):");
    this.visitors.forEach((v,i)=>
      console.log(`   #${(i+1).toString().padStart(2,"0")} → ${v.selector} @ ${v.triggerTime.toFixed(1)}s`)
    );
  },

  tick: function (t) {
    if (!this.data.enabled) return;

    if (!window.visitorEventEnabled) return;

    if (!this.startTime) this.startTime = t;
    const elapsed = (t - this.startTime) / 1000;

    this.visitors.forEach(v => {
      if (!v.triggered && elapsed >= v.triggerTime) {
        this.playFullAnimationOnceFor(v.selector);
        v.triggered = true;
      }
    });
  },

  playFullAnimationOnceFor: function (selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    const mesh = el.getObject3D("mesh");
    if (!mesh) {
      return el.addEventListener("model-loaded",
        () => this.playFullAnimationOnceFor(selector), { once:true });
    }

    const clipName = mesh.animations[0].name;

    if (selector === "#static-visitor2_4") {
      el.setAttribute("visible", true);
    }

    el.setAttribute("animation-mixer", {
      clip: clipName,
      loop: "once",
      clampWhenFinished: true,
      timeScale: 1
    });

    const waitMixer = () => {
      const mix = el.components["animation-mixer"];
      if (!mix) return setTimeout(waitMixer, 10);

      const action = mix.mixer._actions[0];
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();

      let audioId =
        selector === "#static-visitor2_1" ? "fx-murmur" :
        selector === "#static-visitor2_2" ? "fx-murmur" :
        selector === "#static-visitor2_3" ? "fx-wthought" :
        selector === "#static-visitor2_4" ? "fx-door" :
        selector === "#static-visitor2_5" ? "fx-cough2" :
                                           "fx-yawn";

      document.querySelector("#" + audioId)?.components?.sound?.playSound();
      triggerEmojiBurst(audioId);

      console.log(`▶ [LVL2] Animación: ${selector}`);

      if (selector === "#static-visitor2_4") {
        const done = () => {
          el.setAttribute("visible", false);
          mix.mixer.removeEventListener("finished", done);
        };
        mix.mixer.addEventListener("finished", done);
      }
    };

    waitMixer();
  }
});
