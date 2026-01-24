// assets-loader.js
function getNivel() {
  const params = new URLSearchParams(window.location.search);
  return params.get("nivel")?.toLowerCase() || "facil";
}

function applyVisitorConfig(v) {
  const el = document.getElementById(v.entityId);
  if (!el) return;

  // modelo
  el.setAttribute("gltf-model", `#${v.assetId}`);

  // attrs: position, scale, rotation, visible...
  if (v.attrs) {
    for (const [k, val] of Object.entries(v.attrs)) {
      el.setAttribute(k, val);
    }
  }

  // components: idle-pose, fix-mixamo-shine...
  if (v.components) {
    for (const [name, val] of Object.entries(v.components)) {
      el.setAttribute(name, val); // "" sirve para componentes sin valor
    }
  }
}

function ensureAssetItem(assetsEl, id, src) {
  let item = document.getElementById(id);

  // si existe pero no tiene src, se lo ponemos
  if (item) {
    const cur = item.getAttribute("src");
    if (!cur) item.setAttribute("src", src);
    return;
  }

  item = document.createElement("a-asset-item");
  item.setAttribute("id", id);
  item.setAttribute("src", src);
  assetsEl.appendChild(item);
}


function waitAssetItemLoaded(assetId, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const item = document.getElementById(assetId);
    if (!item) return resolve(false);

    if (item.hasLoaded) return resolve(true);

    const onLoaded = () => resolve(true);
    item.addEventListener("loaded", onLoaded, { once: true });

    setTimeout(() => resolve(false), timeoutMs);
  });
}

function applySceneConfig(sceneCfg) {
  const cont = document.querySelector("#contenedor-modelo");
  if (!cont || !sceneCfg?.id) return;
  cont.setAttribute("gltf-model", `#${sceneCfg.id}`);
  if (sceneCfg.position) {
    cont.setAttribute("position", sceneCfg.position);
  }
  if (sceneCfg.rotation) {
    cont.setAttribute("rotation", sceneCfg.rotation);
  }
  if (sceneCfg.scale) {
    cont.setAttribute("scale", sceneCfg.scale);
  }
}

function waitEntityModelLoaded(entityId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const el = document.getElementById(entityId);
    if (!el) return resolve();

    if (el.getObject3D("mesh")) return resolve();

    const onLoaded = () => resolve();
    el.addEventListener("model-loaded", onLoaded, { once: true });

    setTimeout(() => resolve(), timeoutMs);
  });
}

async function loadLevelAssets() {
  const nivel = getNivel();
  const cfg = window.ASSET_MANIFEST?.[nivel] || window.ASSET_MANIFEST?.facil;
  const assetsEl = document.querySelector("a-assets");
  if (!assetsEl || !cfg) return;

  ensureAssetItem(assetsEl, cfg.scene.id, cfg.scene.src);
  for (const v of (cfg.visitors || [])) ensureAssetItem(assetsEl, v.assetId, v.src);

  await waitAssetItemLoaded(cfg.scene.id, 15000);

  applySceneConfig(cfg.scene);
  for (const v of (cfg.visitors || [])) applyVisitorConfig(v);

  await waitEntityModelLoaded("contenedor-modelo", 20000);
  await Promise.all((cfg.visitors || []).map(v => waitEntityModelLoaded(v.entityId, 20000)));

  if (typeof safeShowScene === "function") safeShowScene();
}


window.addEventListener("DOMContentLoaded", loadLevelAssets);