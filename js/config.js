// Where the dashboard finds the backend. Override for testing with ?api=http://host:port
// (Step 5 sets apiBase to the Railway URL.)
window.TWIN_CONFIG = {
  apiBase: "https://3form-twin-api.onrender.com",
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
