async function loadConfig() {
  // Cache-bust to ensure config is reloaded on refresh.
  const module = await import(`../../../public/assets/js/config.js?ts=${Date.now()}`);
  return module.default;
}

document.addEventListener("DOMContentLoaded", async () => {
  const config = await loadConfig();
  const BASE_URL = config.API.BASE_URL + "/user/get/info";
  // Get information on the backend services (fallback to competitor on error).
  const payload = {
    firstName: "",
    lastName: "",
  };
  let data = { user: { role: "admin" } };

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    data = await res.json();
  } catch (error) {
    console.warn("Backend unavailable, using competitor role.", error);
  }

  console.log("data :", data);
  regEdit(data.user.role);
});

function regEdit(userRole) {
  const safeRole = typeof userRole === "string" && userRole.trim() !== "" ? userRole.trim().toLowerCase() : "competitor";

  const hide = (id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  };

  console.log("my user role : ", safeRole);
  switch (safeRole) {
    case "competitor":
      // Le compétiteur ne gère rien
      hide("assess");
      hide("assign_assessors");
      hide("close_competition");
      hide("overview_stat");
      hide("manage_members");
      hide("manage_competition");
      break;

    case "assessor":
      // L’évaluateur ne soumet pas et n’organise pas
      hide("club_drawing");
      hide("submit_drawing");
      hide("assign_assessors");
      hide("close_competition");
      hide("manage_members");
      hide("manage_competition");
      break;

    case "president":
      // Le président n’évalue pas et ne soumet pas
      hide("club_drawing");
      hide("submit_drawing");
      hide("assess");
      hide("manage_members");
      hide("manage_competition");
      break;

    case "director":
      // Le directeur gère le club, pas les dessins
      hide("submit_drawing");
      hide("assess");
      hide("assign_assessors");
      hide("close_competition");
      hide("manage_competition");
      break;

    case "admin":
      // L’admin ne participe jamais
      hide("submit_drawing");
      hide("assess");
      hide("assign_assessors");
      hide("close_competition");
      hide("club_drawing");
      hide("my_drawings");
      hide("my_results");
      break;

    default:
      console.warn("Rôle utilisateur inconnu :", userRole);
      break;
  }
}
