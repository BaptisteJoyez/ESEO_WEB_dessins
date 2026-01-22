async function loadConfig() {
  const module = await import("../../../assets/js/config.js");
  return module.default;
}

const config = await loadConfig();

document.getElementById("dashboard").href = config.BOARD.BASE_URL || "../../globale/dashboard/dashboard.html";
document.getElementById("login").href = config.LOGIN.BASE_URL || "/view/Authentification/connection/connection.html";
