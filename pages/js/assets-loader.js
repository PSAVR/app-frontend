function getNivel() {
  const params = new URLSearchParams(window.location.search);
  return params.get("nivel")?.toLowerCase() || "facil";
}

function applyVisitorConfig(v) {
  const el = document.getElementById(v.entityId);
  if (!el) return;

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

function ensureAssetItem(assetsEl, id, src) {
  let item = document.getElementById(id);

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
  if (sceneCfg.position) cont.setAttribute("position", sceneCfg.position);
  if (sceneCfg.rotation) cont.setAttribute("rotation", sceneCfg.rotation);
  if (sceneCfg.scale) cont.setAttribute("scale", sceneCfg.scale);
}

function waitEntityModelLoaded(entityId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const el = document.getElementById(entityId);
    if (!el) return resolve(false);

    if (el.getObject3D("mesh")) return resolve(true);

    const onLoaded = () => resolve(true);
    el.addEventListener("model-loaded", onLoaded, { once: true });

    setTimeout(() => resolve(false), timeoutMs);
  });
}

function getCfgForNivel(nivel) {
  const key = (nivel || "").toLowerCase();
  return window.ASSET_MANIFEST?.[key] || window.ASSET_MANIFEST?.facil;
}

function collectAllVisitorEntityIds() {
  const ids = new Set();
  const m = window.ASSET_MANIFEST || {};
  Object.values(m).forEach(level => {
    (level.visitors || []).forEach(v => ids.add(v.entityId));
  });
  return Array.from(ids);
}

function hideAllVisitors() {
  for (const id of collectAllVisitorEntityIds()) {
    const el = document.getElementById(id);
    if (el) el.setAttribute("visible", "false");
  }
}

async function loadAssetsForNivel(nivel) {
  const cfg = getCfgForNivel(nivel);
  const assetsEl = document.querySelector("a-assets");
  if (!assetsEl || !cfg) return false;

  ensureAssetItem(assetsEl, cfg.scene.id, cfg.scene.src);
  for (const v of (cfg.visitors || [])) ensureAssetItem(assetsEl, v.assetId, v.src);

  await waitAssetItemLoaded(cfg.scene.id, 20000);

  applySceneConfig(cfg.scene);

  hideAllVisitors();
  for (const v of (cfg.visitors || [])) applyVisitorConfig(v);

  await waitEntityModelLoaded("contenedor-modelo", 25000);
  await Promise.all((cfg.visitors || []).map(v => waitEntityModelLoaded(v.entityId, 25000)));

  return true;
}

async function loadLevelAssets() {
  const nivel = getNivel();
  const ok = await loadAssetsForNivel(nivel);
  if (ok && typeof safeShowScene === "function") safeShowScene();
}

window.loadAssetsForNivel = loadAssetsForNivel;
window.loadLevelAssets = loadLevelAssets;

if (!window.__DISABLE_AUTO_LEVEL_LOAD) {
  window.addEventListener("DOMContentLoaded", loadLevelAssets);
}
