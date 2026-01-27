import { getSessionUser } from "../../../assets/js/authClient.js";
/* =========================================================
       CONFIG LOADING
    ========================================================= */
async function loadConfig() {
  try {
    const module = await import("../../../assets/js/config.js");
    return module.default;
  } catch (e) {
    console.warn("Config not loaded, using defaults");
    return null;
  }
}

/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */
async function initDashboard() {
  const config = await loadConfig();

  const loginUrl = config.LOGIN.BASE_URL || "/view/Authentification/connection/connection.html";

  let user = null;
  console.log("testing smt ");
  try {
    user = await getSessionUser();
  } catch (e) {
    console.warn("Unable to fetch session user", e);
  }

  // 🔐 Not authenticated → redirect to login no need in dev need to be reactivated when backend is set up
  if (!user) {
    window.location.href = loginUrl;
    return;
  }

  console.log("user ", user);

  // backend may return { user: {...} } OR {...}
  let safeUser;

  if (user && user.user) {
    safeUser = user.user;
  } else {
    safeUser = user;
  }

  console.log("user safe :", safeUser);

  configureDashboard(safeUser);
}

/* =========================================================
   DASHBOARD CONFIG
========================================================= */
function configureDashboard(user) {
  displayUserInfo(user);
  const isAdmin = !!user?.isAdmin || user?.role === "admin";
  setSectionVisible("manage_competition", isAdmin);
  setSectionVisible("overview_stat", isAdmin);
}

/* =========================================================
   USER INFO DISPLAY
========================================================= */
function displayUserInfo(user = {}) {
  const { firstName, firstname, lastName, lastname, role = "#role", club = "#club" } = user;

  setText("first-name", `first name : ${firstName || firstname || "#name"}`);
  setText("last-name", `last name : ${lastName || lastname || "#name"}`);
  setText("role", `role : ${role}`);
  setText("club", `club : ${club}`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setSectionVisible(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = visible ? "" : "none";
}
/* =========================================================
   BOOTSTRAP
========================================================= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
