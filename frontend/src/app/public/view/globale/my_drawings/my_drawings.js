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

  const imageBase64 = getUserDrawing(safeUser);
  makeImage(imageBase64);
}

async function getUserDrawing(safeUser) {
  const BASE_URL = config.API.BASE_URL + "/get/user/images";
  try {
    const res = await fetch(BASE_URL, {
      credentials: "include", // IMPORTANT (cookie session)
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data; //sens etre mes image en format 64
  } catch (e) {
    return null;
  }
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
    const raw = entry.data || entry.base64 || entry.image || entry.content;
    if (!raw || typeof raw !== "string") return null;
    if (raw.startsWith("data:")) return raw;
    const mime = entry.mime || entry.type || "image/png";
    return `data:${mime};base64,${raw}`;
  }

  return null;
}

function extractBase64List(imagesBase64) {
  if (!imagesBase64) return [];
  if (Array.isArray(imagesBase64)) return imagesBase64;
  if (Array.isArray(imagesBase64.images)) return imagesBase64.images;
  if (Array.isArray(imagesBase64.data)) return imagesBase64.data;
  if (typeof imagesBase64 === "object") return Object.values(imagesBase64);
  return [];
}

function makeImage(imagesBase64) {
  const carouselInner = document.getElementById("carousel-inner");
  const indicators = document.getElementById("carousel-indicators");
  if (!carouselInner || !indicators) return;

  const list = extractBase64List(imagesBase64).map(normalizeBase64).filter(Boolean);

  if (!list.length) return;

  carouselInner.innerHTML = "";
  indicators.innerHTML = "";

  list.forEach((src, index) => {
    const item = document.createElement("div");
    item.className = `carousel-item${index === 0 ? " active" : ""}`;

    const img = document.createElement("img");
    img.src = src;
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
