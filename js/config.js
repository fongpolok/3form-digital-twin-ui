// Where the dashboard finds the backend. Override for testing with ?api=http://host:port
// Live backend: Render service 3form-twin-api.
window.TWIN_CONFIG = {
  apiBase: "https://threeform-twin-api.onrender.com",
  // Unity web build files, relative to this page.
  unity: {
    base: "unity/Build",
    loader: "twin.loader.js",
    data: "twin.data.unityweb",
    framework: "twin.framework.js.unityweb",
    code: "twin.wasm.unityweb",
  },
  trendMinutes: 30,
  pollSeconds: 5,
};
