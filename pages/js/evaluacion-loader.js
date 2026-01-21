function ensureEvalAssetItem(assetsEl, id, src) {
  let item = document.getElementById(id);

  if (item) {
    const cur = item.getAttribute("src");
    if (!cur) item.setAttribute("src", src);
    return item;
  }

  item = document.createElement("a-asset-item");
  item.setAttribute("id", id);
  item.setAttribute("src", src);
  assetsEl.appendChild(item);
  return item;
}

function waitEvalAssetLoaded(assetId, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const item = document.getElementById(assetId);
    if (!item) return resolve(false);

    if (item.hasLoaded) return resolve(true);

    const onLoaded = () => resolve(true);
    item.addEventListener("loaded", onLoaded, { once: true });

    setTimeout(() => resolve(false), timeoutMs);
  });
}

function waitEvalEntityModelLoaded(entityId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const el = document.getElementById(entityId);
    if (!el) return resolve();

    if (el.getObject3D("mesh")) return resolve();

    const onLoaded = () => resolve();
    el.addEventListener("model-loaded", onLoaded, { once: true });

    setTimeout(() => resolve(), timeoutMs);
  });
}

function applyEvalVisitorConfig(v) {
  const el = document.getElementById(v.entityId);
  if (!el) {
    console.warn(`[EvalLoader] Entidad no encontrada: ${v.entityId}`);
    return;
  }

  el.setAttribute("gltf-model", `#${v.assetId}`);

  if (v.attrs) {
    for (const [k, val] of Object.entries(v.attrs)) {
      el.setAttribute(k, val);
    }
  }

  if (v.components) {
    for (const [name, val] of Object.entries(v.components)) {
      el.setAttribute(name, val);
    }
  }
}

function hideAllEvalVisitors() {
  if (!window.EVAL_MANIFEST) return;

  window.EVAL_MANIFEST.escenarios.forEach(escenario => {
    escenario.visitors.forEach(v => {
      const el = document.getElementById(v.entityId);
      if (el) el.setAttribute("visible", "false");
    });
  });
}

function resetEvalVisitorSystems(targetIndex) {
  const scene = document.querySelector("a-scene");
  if (!scene) {
    console.error("[EvalLoader] No se encontró <a-scene>");
    return;
  }

  const components = [
    "lvl1-visitor-event",
    "lvl2-visitor-event",
    "lvl3-visitor-event"
  ];

  components.forEach((name, i) => {
    if (scene.hasAttribute(name)) {
      scene.removeAttribute(name);
    }
    
    if (i === targetIndex) {
      scene.setAttribute(name, "enabled: true");
      console.log(`[EvalLoader] Activado sistema: ${name}`);
    }
  });
}

async function preloadAllEvalAssets() {
  if (!window.EVAL_MANIFEST) {
    console.error("[EvalLoader] EVAL_MANIFEST no encontrado");
    return false;
  }

  const assetsEl = document.querySelector("a-assets");
  if (!assetsEl) {
    console.error("[EvalLoader] <a-assets> no encontrado");
    return false;
  }

  console.log("[EvalLoader] Precargando todos los assets...");

  const allAssets = [];

  window.EVAL_MANIFEST.escenarios.forEach(escenario => {
    ensureEvalAssetItem(assetsEl, escenario.scene.assetId, escenario.scene.src);
    allAssets.push(escenario.scene.assetId);

    escenario.visitors.forEach(v => {
      ensureEvalAssetItem(assetsEl, v.assetId, v.src);
      allAssets.push(v.assetId);
    });
  });

  const results = await Promise.all(
    allAssets.map(id => waitEvalAssetLoaded(id, 20000))
  );

  const allLoaded = results.every(r => r === true);
  
  if (allLoaded) {
    console.log("[EvalLoader] Todos los assets precargados correctamente");
  } else {
    console.warn("[EvalLoader] Algunos assets no se cargaron completamente");
  }

  return allLoaded;
}

async function switchToEvalScenario(index) {
  if (!window.EVAL_MANIFEST) {
    console.error("[EvalLoader] EVAL_MANIFEST no encontrado");
    return false;
  }

  const escenario = window.EVAL_MANIFEST.escenarios[index];
  if (!escenario) {
    console.error(`[EvalLoader] Escenario ${index} no existe`);
    return false;
  }

  console.log(`[EvalLoader] Cambiando a: ${escenario.nombre} (índice ${index})`);

  hideAllEvalVisitors();

  resetEvalVisitorSystems(index);

  const contenedor = document.querySelector("#contenedor-modelo");
  if (contenedor) {
    while (contenedor.firstChild) {
      contenedor.removeChild(contenedor.firstChild);
    }

    contenedor.setAttribute("position", "0 0 0");
    contenedor.setAttribute("rotation", "0 0 0");
    contenedor.setAttribute("scale", "1 1 1");

    const modelEntity = document.createElement("a-entity");
    modelEntity.setAttribute("gltf-model", `#${escenario.scene.assetId}`);

    if (escenario.scene.position) {
      modelEntity.setAttribute("position", escenario.scene.position);
    }
    if (escenario.scene.scale) {
      modelEntity.setAttribute("scale", escenario.scene.scale);
    }
    if (escenario.scene.rotation) {
      modelEntity.setAttribute("rotation", escenario.scene.rotation);
    }

    contenedor.appendChild(modelEntity);

      await new Promise(resolve => {
        modelEntity.addEventListener("model-loaded", () => {
          console.log(`[EvalLoader] Modelo cargado: ${escenario.nombre}`);
          resolve();
        });

        modelEntity.addEventListener("model-error", () => {
          console.error(`[EvalLoader] Error cargando: ${escenario.nombre}`);
          resolve();
        });

        setTimeout(resolve, 15000);
      });
    }

    escenario.visitors.forEach(v => {
      applyEvalVisitorConfig(v);
    });

    await Promise.all(
      escenario.visitors.map(v => waitEvalEntityModelLoaded(v.entityId, 10000))
    );

    const sky = document.querySelector("#sky");
    if (sky && escenario.skyColor) {
      sky.setAttribute("color", escenario.skyColor);
    }

    console.log(`[EvalLoader]  Escenario ${index} cargado completamente`);

    document.dispatchEvent(new CustomEvent("escenario-cambiado", {
      detail: { indice: index, escenario }
    }));

    return true;
}

async function initEvaluacionLoader() {
  console.log("[EvalLoader] Inicializando sistema de evaluación...");

  try {
    const preloaded = await preloadAllEvalAssets();
    
    if (!preloaded) {
      console.warn("[EvalLoader] Precarga incompleta, continuando de todas formas...");
    }

    const success = await switchToEvalScenario(0);

    if (success) {
      console.log("[EvalLoader] Sistema de evaluación listo");
    } else {
      console.warn("[EvalLoader] Escenario 0 cargado con advertencias");
    }
    
    document.dispatchEvent(new CustomEvent('eval-assets-ready'));
    
    return true;
  } catch (error) {
    console.error("[EvalLoader] Error inicializando:", error);
    return false;
  }
}

window.initEvaluacionLoader = initEvaluacionLoader;
window.switchToEvalScenario = switchToEvalScenario;
window.preloadAllEvalAssets = preloadAllEvalAssets;