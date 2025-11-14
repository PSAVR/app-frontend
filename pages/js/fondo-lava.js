(function () {
  window.addEventListener("load", () => {
    const canvas = document.getElementById("lavaCanvas");
    if (!canvas) {
      console.warn("[background-lava] No se encontró #lavaCanvas.");
      return;
    }
    const ctx = canvas.getContext("2d");
    const inAFrame = !!document.querySelector("a-scene");

    const BASE = "#e8dffb";
    const COLORS = ["#b89afc", "#a486fa", "#8f72f5", "#d9c8ff", "#a78cf8", "#9b84ef"];

    const BLOBS = [
      { r: 220, sx: 0.30, sy: 0.55, fx: 0.16, fy: 0.14, spx: 0.70, spy: 0.85, i: 0 },
      { r: 240, sx: 0.68, sy: 0.42, fx: 0.15, fy: 0.18, spx: 0.55, spy: 0.65, i: 1 },
      { r: 180, sx: 0.22, sy: 0.28, fx: 0.14, fy: 0.16, spx: 0.95, spy: 0.85, i: 2 },
      { r: 210, sx: 0.62, sy: 0.78, fx: 0.12, fy: 0.12, spx: 1.10, spy: 1.05, i: 3 },
      { r: 170, sx: 0.85, sy: 0.15, fx: 0.10, fy: 0.15, spx: 0.85, spy: 0.75, i: 4 },
      { r: 190, sx: 0.12, sy: 0.88, fx: 0.13, fy: 0.11, spx: 1.05, spy: 0.95, i: 5 },
    ];
    const BLOBS_2D_IDX = [0, 1, 3, 5];

    const SPEED = 0.25;
    const GLOW_BLUR = 46;
    const EDGE_ALPHA = 0.22;

    const SCALE_R_2D  = 4.5;  
    const MOVE_MUL_2D = 1.5; 
    const ASPECT_X_2D = 2;  
    const ASPECT_Y_2D = 0.88;
    const ROTATION_2D = 0.12; 

    const SCREEN_ALPHA_3D = 0.88;
    const SCREEN_ALPHA_2D = 0.74;
    const CORE_ALPHA_3D   = 0.75;
    const CORE_ALPHA_2D   = 0.48; 
    const CORE_RADIUS_3D  = 0.22;
    const CORE_RADIUS_2D  = 0.34; 
    const EDGE_ALPHA_2D   = 0.26; 
    const TINT_ALPHA_2D   = 0.5; 

    let tex = null;
    function ensureTexture() {
      if (!inAFrame) return;
      const skyEl = document.getElementById("sky");
      const mesh = skyEl && skyEl.getObject3D && skyEl.getObject3D("mesh");
      if (!mesh) return;
      if (!tex) {
        tex = new THREE.CanvasTexture(canvas);
        mesh.material.map = tex;
        mesh.material.needsUpdate = true;
      }
      tex.needsUpdate = true;
    }

    function drawBlob(x, y, R, color, t, idx, circular) {
      ctx.save();

      if (!circular) {
        const angle = ROTATION_2D * Math.sin(t * 0.5 + idx);
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(ASPECT_X_2D, ASPECT_Y_2D);
        x = 0; y = 0;
      }

      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = circular ? SCREEN_ALPHA_3D : SCREEN_ALPHA_2D;

      const coreAlpha = circular ? CORE_ALPHA_3D : CORE_ALPHA_2D;
      const core = `rgba(232,223,251,${coreAlpha})`;
      const innerR = R * (circular ? CORE_RADIUS_3D : CORE_RADIUS_2D);

      const rg = ctx.createRadialGradient(x, y, innerR, x, y, R);
      rg.addColorStop(0.0, core);
      rg.addColorStop(0.28, color);
      rg.addColorStop(1.0, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = circular ? EDGE_ALPHA : EDGE_ALPHA_2D;
      const rim = ctx.createRadialGradient(x, y, R * 0.65, x, y, R * 1.05);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(1, "#6f57b8");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(x, y, R * 1.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.70; 
      ctx.shadowColor = color;
      ctx.shadowBlur = GLOW_BLUR;
      ctx.beginPath();
      ctx.arc(x, y, R * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function draw(t) {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = BASE;
      ctx.fillRect(0, 0, w, h);

      const veil = ctx.createLinearGradient(0, 0, w, h);
      veil.addColorStop(0, "rgba(120,95,190,0.14)");
      veil.addColorStop(1, "rgba(80,60,155,0.12)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, w, h);

      const list = inAFrame ? BLOBS : BLOBS.filter((_, i) => BLOBS_2D_IDX.includes(i));

      list.forEach((b, idx) => {
        const color = COLORS[b.i % COLORS.length];
        const fx = inAFrame ? b.fx : b.fx * MOVE_MUL_2D;
        const fy = inAFrame ? b.fy : b.fy * MOVE_MUL_2D;
        const R  = inAFrame ? b.r  : b.r * SCALE_R_2D;

        const x = (b.sx + fx * Math.sin(t * b.spx + idx)) * w;
        const y = (b.sy + fy * Math.cos(t * b.spy + idx)) * h;

        drawBlob(x, y, R, color, t, idx, inAFrame);
      });

      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = inAFrame ? 0.10 : TINT_ALPHA_2D;
      ctx.fillStyle = BASE;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ensureTexture();
    }

    let start = null;
    function loop(ts) {
      if (!start) start = ts;
      const t = ((ts - start) / 1000) * SPEED;
      draw(t);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    if (!inAFrame) {
      const fit = () => {
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        const w = Math.floor(window.innerWidth * dpr);
        const h = Math.floor(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h;
          const s = canvas.style;
          s.position = "fixed"; s.top = "0"; s.left = "0";
          s.width = "100%";   s.height = "100%";
          s.zIndex = "-1";    s.pointerEvents = "none";
        }
      };
      fit();
      window.addEventListener("resize", () => requestAnimationFrame(fit));
    }
  });
})();
