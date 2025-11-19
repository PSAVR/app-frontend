AFRAME.registerComponent("idle-pose", {
  init: function () {

    this.el.addEventListener("model-loaded", () => {
      const mesh = this.el.getObject3D("mesh");
      if (!mesh || !mesh.animations?.length) return;

      const clip = mesh.animations[0];
      const clipName = clip.name;

      this.el.setAttribute("animation-mixer", `clip: ${clipName}; loop: repeat; timeScale: 0`);

      const wait = () => {
        const mix = this.el.components["animation-mixer"];
        if (!mix) return setTimeout(wait, 10);

        const action = mix.mixer._actions[0];
        action.play();
        action.time = 0;
        mix.mixer.update(0);

        action.paused = true;

        console.log("Pose inicial establecida sin T-Pose");
      };

      wait();
    });
  }
});

function applyMinDistance(visitors, minGap = 10) {
  visitors.sort((a, b) => a.triggerTime - b.triggerTime);

  for (let i = 1; i < visitors.length; i++) {
    const minAllowed = visitors[i-1].triggerTime + minGap;
    if (visitors[i].triggerTime < minAllowed) {
      visitors[i].triggerTime = minAllowed;
    }
  }
}

const EMOJI_MAP = {
  'fx-laugh': ["😂","🤣","😆"],
  'fx-yawn' : ["🥱","😪","😴"],
  'fx-murmur':["😐","🤔","😶"],
  'fx-door': ["😶","🏃‍♂️","👋"],
  'fx-wthought': ["💭","🤯","😵‍💫"],
  'fx-cough': ["🤧","😷"]
};

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

AFRAME.registerComponent("lvl1-visitor-event", {
  schema:{ enabled:{default:false} },

  init:function(){
    if (!this.data.enabled) return;

    this.visitors = [
      "#static-visitor",
      "#static-visitor2",
      "#static-visitor4"
    ];

    let TOTAL_TIME;
    let MIN_TIME;
    let MAX_TIME;

    if (window.evalMode) {
      TOTAL_TIME = 30;
      MIN_TIME   = 3;
      MAX_TIME   = 27;
    } 
    else {
      // Modo normal
      const minutos = parseInt(localStorage.getItem("tiempoSeleccionado") || "1");
      TOTAL_TIME = minutos * 60;

      MIN_TIME = TOTAL_TIME * 0.10;  
      MAX_TIME = TOTAL_TIME * 0.70;  
    }


    let NUM_EVENTS = this.visitors.length * 2; 

    if (window.evalMode) {
      NUM_EVENTS = 3; 
    }

    this.events = [];

    for (let i = 0; i < NUM_EVENTS; i++) {
      const id = this.visitors[Math.floor(Math.random() * this.visitors.length)];
      const t  = Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME;
      this.events.push({ id, t });
    }

    this.events.push({
      id: "#static-visitor3",
      t : Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME
    });

    this.events.sort((a,b)=>a.t-b.t);

    console.log("📋 EVENTOS PROGRAMADOS:");
    this.events.forEach((e,i)=> console.log(`   #${i+1} → ${e.id} @ ${e.t.toFixed(1)}s`) );

    this.startTime = null;
    this.fired = 0;
  },

  tick:function(time){
    if (!window.visitorEventEnabled) return;

    if (!this.startTime) this.startTime = time;
    const secs = (time - this.startTime)/1000;

    while (this.fired < this.events.length && secs >= this.events[this.fired].t) {
      this.playFullAnimationOnceFor(this.events[this.fired].id);
      this.fired++;
    }
  },

playFullAnimationOnce: function () {
    const el = document.querySelector("#static-visitor");
    if (!el) return console.error("No existe #static-visitor");

    const mesh = el.getObject3D("mesh");
    if (!mesh) {
      return el.addEventListener(
        "model-loaded",
        () => this.playFullAnimationOnce(),
        { once: true }
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

      // empezamos SIEMPRE desde el inicio
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;

      action.play();

      console.log("▶ Animación completa ejecutada una vez desde el inicio");

      const audio = document.querySelector("#fx-murmur");
      audio?.components?.sound?.playSound();
    };

    waitMixer();
  },
  playFullAnimationOnceFor: function (selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  const mesh = el.getObject3D("mesh");
  if (!mesh) {
    return el.addEventListener("model-loaded",
      () => this.playFullAnimationOnceFor(selector),
      { once: true }
    );
  }

  const clip = mesh.animations[0];
  const clipName = clip.name;


  if (selector === "#static-visitor3") {
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

    let audioId = null;

    if (selector === "#static-visitor4") {
      audioId = "fx-laugh";
    }
    else if(selector === "#static-visitor3") {
      audioId = "fx-door";
    }
    else if (selector === "#static-visitor") {
      audioId = "fx-yawn";
    }
    else {
      audioId = "fx-murmur";
    }

    const audioEl = document.querySelector("#" + audioId);
    audioEl?.components?.sound?.playSound();

    triggerEmojiBurst(audioId);


    console.log("▶ Animación ejecutada una vez en:", selector);
    if (selector === "#static-visitor3") {
        const onFinish = () => {
            el.setAttribute("visible", false);
            el.setAttribute("timeScale", 0.01);
            console.log("👻 Visitor3 ocultado tras animación");
            mix.mixer.removeEventListener("finished", onFinish);
        };

        mix.mixer.addEventListener("finished", onFinish);
    }
  };

  waitMixer();
}
});
