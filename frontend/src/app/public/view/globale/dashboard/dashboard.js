import { getSessionUser } from "../../../assets/js/authClient.js";
const dev = {
  role: "sudo",
};
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

  // backend may return { user: {...} } OR {...}
  let safeUser;

  if (user && user.user) {
    safeUser = user.user;
  } else {
    safeUser = user;
  }

  configureDashboard(safeUser);
}

/* =========================================================
   DASHBOARD CONFIG
========================================================= */
function configureDashboard(user) {
  if (!user || !user.role) {
    applyRoleRestrictions(dev.role); // penser a le retirer merci
  } else {
    applyRoleRestrictions(user.role);
  }
  displayUserInfo(user);
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

/* =========================================================
   ROLE MANAGEMENT
========================================================= */
function applyRoleRestrictions(role) {
  const safeRole = typeof role === "string" && role.trim() ? role.trim().toLowerCase() : "competitor";

  const hide = (...ids) =>
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });

  console.log("Dashboard role:", safeRole);

  switch (safeRole) {
    case "competitor":
      hide("assess", "assign_assessors", "close_competition", "overview_stat", "manage_members", "manage_competition");
      break;

    case "assessor":
      hide("club_drawing", "submit_drawing", "assign_assessors", "close_competition", "manage_members", "manage_competition");
      break;

    case "president":
      hide("club_drawing", "submit_drawing", "assess", "manage_members", "manage_competition");
      break;

    case "director":
      hide("submit_drawing", "assess", "assign_assessors", "close_competition", "manage_competition");
      break;

    case "admin":
      hide("submit_drawing", "assess", "assign_assessors", "close_competition", "club_drawing", "my_drawings", "my_results");
      break;
    case "restricted":
      hide("submit_drawing", "assess", "assign_assessors", "close_competition", "club_drawing", "my_drawings", "my_results", "overview_stat", "manage_members", "manage_competition");
      break;
    case "sudo":
      hide();
      break;
    default:
      console.warn("Unknown user role:", role);
  }
}

/* =========================================================
   BOOTSTRAP
========================================================= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
