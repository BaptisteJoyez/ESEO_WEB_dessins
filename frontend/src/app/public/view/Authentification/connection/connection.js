async function loadConfig() {
  // Cache-bust to ensure config is reloaded on refresh.
  const module = await import("../../../assets/js/config.js");
  return module.default;
}

const config = await loadConfig();
const BOARD_URL = config.BOARD.BASE_URL;
const BASE_URL = config.API.BASE_URL + "/user/login";

const userData = {
  login: "",
  password: "",
};

async function login(event) {
  event.preventDefault();
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  userData.username = usernameEl ? usernameEl.value : "";
  userData.password = passwordEl ? passwordEl.value : "";

  alert(`userData: ${userData.username}, ${userData.password}`);

  await sender(userData);
}

const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", login);
}

async function sender(userData_) {
  let data = null;

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData_),
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    data = await res.json();
    if (data.verified) {
      location.href = BOARD_URL;
    } else {
      alert("Invalid credentials");
    }
  } catch (error) {
    console.warn("Backend unavailable, using mock mode", error);
    alert("Backend unavailable (mock mode)");
  }
}
