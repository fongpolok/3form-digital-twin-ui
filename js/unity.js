// Loads the Unity WebGL twin into the canvas and forwards live snapshots to it.
const cfg = window.TWIN_CONFIG.unity;
let instance = null;
let ready = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("load failed: " + src));
    document.head.appendChild(s);
  });
}

// Returns "started" | "missing" | "failed". onProgress(0..1)
export async function startUnity(canvas, onProgress) {
  const loaderUrl = `${cfg.base}/${cfg.loader}`;
  const exists = await fetch(loaderUrl, { method: "HEAD" }).then((r) => r.ok).catch(() => false);
  if (!exists) return "missing";
  try {
    await loadScript(loaderUrl);
    window.onTwinReady = () => { ready = true; };
    instance = await window.createUnityInstance(canvas, {
      dataUrl: `${cfg.base}/${cfg.data}`,
      frameworkUrl: `${cfg.base}/${cfg.framework}`,
      codeUrl: `${cfg.base}/${cfg.code}`,
      companyName: "3form Engineering",
      productName: "3form Inspection Cell Twin",
      productVersion: "1.0",
      matchWebGLToCanvasSize: true,
    }, onProgress);
    return "started";
  } catch (err) {
    console.error("[twin] Unity failed to start", err);
    return "failed";
  }
}

export function sendSnapshot(raw) {
  if (instance && ready) instance.SendMessage("TwinLink", "OnSnapshot", raw);
}
