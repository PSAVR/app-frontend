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
  visitors.sort((a, b) => a.triggerTime - b.triggerTime);

  for (let i = 1; i < visitors.length; i++) {
    const minAllowed = visitors[i-1].triggerTime + minGap;
    if (visitors[i].triggerTime < minAllowed) {
      visitors[i].triggerTime = minAllowed;
    }
  }
}

AFRAME.registerComponent("lvl3-visitor-event", {
  schema: { enabled:{ default:false } },

  init: function () {
    console.log("🚨 evalMode dentro de lvl3 INIT =", window.evalMode);

    if (!this.data.enabled) return;

    let TOTAL_TIME, MIN_TIME, MAX_TIME, NUM_EVENTS;

    if (window.evalMode) {
      TOTAL_TIME = 30;
      MIN_TIME   = 4;
      MAX_TIME   = 15;
    } else {
      const minutos = parseInt(localStorage.getItem("tiempoSeleccionado") || "1");
      TOTAL_TIME = minutos * 60;
      MIN_TIME   = TOTAL_TIME * 0.10;
      MAX_TIME   = TOTAL_TIME * 0.60;
    }

    const TARGETS = [
      "#static-visitor-3",
      "#static-visitor-3_1",
      "#static-visitor-3_2",
      "#static-visitor-3_3",
      "#static-visitor-3_4",
      "#static-visitor-3_5"
    ];

 
    NUM_EVENTS = TARGETS.length * 2;  

    if (window.evalMode) NUM_EVENTS = 3;  

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

    applyMinDistance(this.visitors, 4.5);

    this.startTime = null;

    console.log("📋 EVENTOS NIVEL 3 PROGRAMADOS:");
    this.visitors.forEach((v,i)=>
      console.log(`   #${(i+1).toString().padStart(2,"0")} → ${v.selector} @ ${v.triggerTime.toFixed(1)}s`)
    );
  },

  tick: function (t) {
    if (!this.data.enabled) return;
    if (!window.visitorEventEnabled) return;

    if (this.startTime === null) this.startTime = t;
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
        () => this.playFullAnimationOnceFor(selector),
        { once:true }
      );
    }

    const clip = mesh.animations[0];
    const clipName = clip.name;

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

      let audioId = "fx-murmur";

      if (selector === "#static-visitor-3_1") audioId = "fx-laugh";
      else if (selector === "#static-visitor-3_2" || selector === "#static-visitor-3_5") audioId = "fx-yawn";
      else if (selector === "#static-visitor-3_4") audioId = "fx-wthought";

      document.querySelector("#"+audioId)?.components?.sound?.playSound();
      triggerEmojiBurst(audioId);
    };

    waitMixer();
  }
});

