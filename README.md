# twin_ui: inspection-cell digital twin dashboard

Static web page (no build step), hosted on GitHub Pages like the other 3form demos.
It talks to `twin_server` (REST + WebSocket) and embeds the Unity WebGL twin.

```
index.html         page structure (EN/TC text filled in by js/i18n.js)
css/app.css        3form design tokens (from 3form-co-website DESIGN.md)
js/config.js       backend URL + Unity build file names  <- edit for deployment
js/api.js          REST calls, team login token (sessionStorage), live WebSocket
js/charts.js       hand-drawn SVG charts (NG-rate line, reject-reason bars)
js/unity.js        loads the Unity build and forwards live snapshots to it
js/i18n.js         English / Traditional Chinese strings
js/app.js          wires everything together
unity/Build/       Unity WebGL build output (copied from PoC/web_build/twin/Build)
```

## Run locally

```bash
# terminal 1: backend
cd ../twin_server && conda activate agentic_AI && python -m twin.server
# terminal 2: this page
python3 -m http.server 5173
# open http://localhost:5173  (or ?api=http://other-host:8000, ?lang=tc)
```

The page origin must be listed in `twin_server/config/settings.yaml` → `api.cors_origins`.

## Update the 3D twin

In Unity: menu **Twin → 4 Build for Web** (or `TwinBatch.BuildWeb` in batch mode), then
copy `PoC/web_build/twin/Build/*` into `unity/Build/`.
