async function loadConfig() {
  // Cache-bust to ensure config is reloaded on refresh.
  const module = await import(`./config.js`);
  return module.default;
}

const config = await loadConfig();
const BASE_URL_ = config.API.BASE_URL + "/authClient";

export async function getSessionUser() {
  console.log("fetching session user from ", BASE_URL_);
  try {
    const res = await fetch(BASE_URL_, {
      credentials: "include", // IMPORTANT (cookie session)
    });

    if (!res.ok) {
      console.log("response not ok");
      return null;
    }

    const data = await res.json();
    console.log("session user data ", data);
    return data.authenticated ? data : null;
  } catch (e) {
    console.warn("Error fetching session user", e);
    return null;
  }
}
