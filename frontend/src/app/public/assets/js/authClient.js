async function loadConfig() {
  // Cache-bust to ensure config is reloaded on refresh.
  const module = await import(`./config.js`);
  return module.default;
}

const config = await loadConfig();
const BASE_URL_ = config.API.BASE_URL + "/authClient";

export async function getSessionUser() {
  try {
    const res = await fetch("/api/authClient", {
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.access ? data : null;
  } catch (e) {
    console.error("Session fetch failed", e);
    return null;
  }
}
