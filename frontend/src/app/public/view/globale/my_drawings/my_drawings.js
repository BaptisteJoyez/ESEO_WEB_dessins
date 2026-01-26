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
const config = await loadConfig();

const yearFilter = document.getElementById("filter-year");
const concoursFilter = document.getElementById("filter-concours");
const resetButton = document.getElementById("filter-reset");

let allDrawings = [];
let currentUser = null;

async function initDashboard() {
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

  currentUser = safeUser;
  await loadUserDrawings();
}

async function loadUserDrawings() {
  const login = currentUser?.login || currentUser?.username || currentUser?.identifiant || "";
  if (!login) {
    renderEmptyState("Login manquant.");
    return;
  }

  const BASE_URL = `${config?.API?.BASE_URL || "/api"}/get/drawings`;

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // IMPORTANT (cookie session)
      body: JSON.stringify({ login }),
    });

    if (!res.ok) {
      renderEmptyState("Erreur lors du chargement des dessins.");
      return;
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : Array.isArray(data.drawings) ? data.drawings : [];
    allDrawings = list;

    populateFilters(allDrawings);
    applyFilters();
  } catch (e) {
    renderEmptyState("Erreur reseau lors du chargement.");
  }
}

function extractYear(entry) {
  const raw = entry?.dateRemise || entry?.date_remise || entry?.dateRemise || "";
  if (!raw) return "";
  return String(raw).slice(0, 4);
}

function extractConcours(entry) {
  return entry?.numConcours || entry?.num_concours || entry?.num || "";
}

function extractTheme(entry) {
  return entry?.theme || entry?.description_concours || "";
}

function populateFilters(drawings) {
  if (yearFilter) {
    yearFilter.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Toutes les annees";
    yearFilter.appendChild(allOption);
  }

  if (concoursFilter) {
    concoursFilter.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Tous les concours";
    concoursFilter.appendChild(allOption);
  }

  const yearSet = new Set();
  const concoursMap = new Map();

  drawings.forEach((entry) => {
    const year = extractYear(entry);
    if (year) yearSet.add(year);

    const concours = extractConcours(entry);
    if (concours) {
      const theme = extractTheme(entry);
      concoursMap.set(String(concours), theme);
    }
  });

  if (yearFilter) {
    Array.from(yearSet)
      .sort((a, b) => Number(b) - Number(a))
      .forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
  }

  if (concoursFilter) {
    Array.from(concoursMap.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .forEach(([numConcours, theme]) => {
        const option = document.createElement("option");
        option.value = numConcours;
        option.textContent = theme ? `Concours ${numConcours} - ${theme}` : `Concours ${numConcours}`;
        concoursFilter.appendChild(option);
      });
  }
}

function applyFilters() {
  let filtered = [...allDrawings];
  const yearValue = yearFilter?.value || "";
  const concoursValue = concoursFilter?.value || "";

  if (yearValue) {
    filtered = filtered.filter((entry) => extractYear(entry) === yearValue);
  }

  if (concoursValue) {
    filtered = filtered.filter((entry) => String(extractConcours(entry)) === concoursValue);
  }

  renderCarousel(filtered);
}

function normalizeBase64(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("data:")) return trimmed;
    return `data:image/png;base64,${trimmed}`;
  }

  if (typeof entry === "object") {
    const raw = entry.leDessin || entry.drawing || entry.image || entry.data || entry.content || entry.base64;
    if (!raw || typeof raw !== "string") return null;
    if (raw.startsWith("data:")) return raw;
    const mime = entry.mime || entry.type || "image/png";
    return `data:${mime};base64,${raw}`;
  }

  return null;
}

function renderEmptyState(message) {
  const carouselInner = document.getElementById("carousel-inner");
  const indicators = document.getElementById("carousel-indicators");
  if (!carouselInner || !indicators) return;

  indicators.innerHTML = "";
  carouselInner.innerHTML = `
    <div class="carousel-item active">
      <div class="placeholder-card">
        <div class="placeholder-image"></div>
        <div class="placeholder-text">
          <p>${message}</p>
        </div>
      </div>
    </div>
  `;
}

function renderCarousel(drawings) {
  const carouselInner = document.getElementById("carousel-inner");
  const indicators = document.getElementById("carousel-indicators");
  if (!carouselInner || !indicators) return;

  const list = drawings
    .map((entry) => ({ src: normalizeBase64(entry), meta: entry }))
    .filter((entry) => entry.src);

  if (!list.length) {
    renderEmptyState("Aucun dessin pour ce filtre.");
    return;
  }

  carouselInner.innerHTML = "";
  indicators.innerHTML = "";

  list.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = `carousel-item${index === 0 ? " active" : ""}`;

    const img = document.createElement("img");
    img.src = entry.src;
    img.alt = `Dessin ${index + 1}`;
    img.loading = "lazy";
    img.className = "d-block w-100";

    item.appendChild(img);
    carouselInner.appendChild(item);

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-bs-target", "#drawingsCarousel");
    button.setAttribute("data-bs-slide-to", String(index));
    button.setAttribute("aria-label", `Slide ${index + 1}`);
    if (index === 0) {
      button.className = "active";
      button.setAttribute("aria-current", "true");
    }
    indicators.appendChild(button);
  });
}

if (yearFilter) {
  yearFilter.addEventListener("change", applyFilters);
}

if (concoursFilter) {
  concoursFilter.addEventListener("change", applyFilters);
}

if (resetButton) {
  resetButton.addEventListener("click", () => {
    if (yearFilter) yearFilter.value = "";
    if (concoursFilter) concoursFilter.value = "";
    applyFilters();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
