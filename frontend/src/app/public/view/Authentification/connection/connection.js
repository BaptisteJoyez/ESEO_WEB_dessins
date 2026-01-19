const MOCK_MODE = true; // ⚠️ TEMPORAIRE (DEV ONLY)

async function loadConfig() {
  // Cache-bust to ensure config is reloaded on refresh.
  const module = await import("../../../assets/js/config.js");
  return module.default;
}

const config = await loadConfig();
const BOARD_URL = config.BOARD.BASE_URL;
const BASE_URL = config.API.BASE_URL + "/user/login";

const userData = {
  username: "",
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
    if (!MOCK_MODE) {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData_),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      data = await res.json();
    } else {
      // 🎭 MOCK BACKEND
      data = {
        verified: true,
        user: {
          firstName: "John",
          lastName: "Doe",
          role: "competitor",
          club: "Mock Club",
        },
      };
    }

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
