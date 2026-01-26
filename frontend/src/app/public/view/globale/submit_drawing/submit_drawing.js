import { getSessionUser } from "../../../assets/js/authClient.js";
import { ImageToBase64 } from "../../../assets/js/ImageBase64/Base64.js";
const dev = {
  role: "sudo",
};

const formatEnum = {
  A4: "A4",
  A3: "A3",
  A2: "A2",
  A1: "A1",
  A0: "A0",
  Numerical: "Numérique",
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

const dropBox = document.getElementById("drop-box");
const fileInput = document.getElementById("drawing-input");
const previewBox = document.getElementById("preview");
const infoBox = document.getElementById("file-info");
const defaultPreview = previewBox ? previewBox.innerHTML : "";
const defaultInfo = infoBox ? infoBox.innerHTML : "";

const commentaireInput = document.getElementById("commentaire-input");
const formatInput = document.getElementById("formatInput");
const techniqueInput = document.getElementById("technique");
const numConcursInput = document.getElementById("numConcours");

let selectedFile = null;
let selectedBase64 = null;

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

  populateFormatOptions();
  await populateConcoursOptions(safeUser);
}

function populateFormatOptions() {
  if (!formatInput) return;
  formatInput.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Choisir un format";
  formatInput.appendChild(placeholder);

  Object.entries(formatEnum).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    formatInput.appendChild(option);
  });
}

async function populateConcoursOptions(user) {
  if (!numConcursInput) return;
  numConcursInput.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Chargement des concours...";
  numConcursInput.appendChild(placeholder);

  const BASE_URL = `${config?.API?.BASE_URL || "/api"}/get/concours`;
  const nom = user.lastName || user.last_name || user.nom || user.name || "";
  const prenom = user.firstName || user.first_name || user.prenom || "";
  const login = user.login || user.username || user.user_name || "";

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nom, prenom, login }),
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : Array.isArray(data.concours) ? data.concours : Array.isArray(data.data) ? data.data : [];

    numConcursInput.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.disabled = true;
      empty.selected = true;
      empty.textContent = "Aucun concours disponible";
      numConcursInput.appendChild(empty);
      return;
    }

    const choose = document.createElement("option");
    choose.value = "";
    choose.disabled = true;
    choose.selected = true;
    choose.textContent = "Choisir un concours";
    numConcursInput.appendChild(choose);

    items.forEach((item) => {
      const option = document.createElement("option");

      if (typeof item === "string" || typeof item === "number") {
        option.value = String(item);
        option.textContent = String(item);
      } else {
        const value = item.id || item.numConcours || item.num_concours || item.num || item.value || "";
        const label = item.label || item.name || item.title || item.titre || item.nom || (value ? `Concours ${value}` : "Concours");
        option.value = String(value);
        option.textContent = String(label);
      }

      numConcursInput.appendChild(option);
    });
  } catch (error) {
    console.warn("Unable to load concours list", error);
    numConcursInput.innerHTML = "";
    const errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.disabled = true;
    errorOption.selected = true;
    errorOption.textContent = "Erreur de chargement";
    numConcursInput.appendChild(errorOption);
  }
}

function setInfoMessage(message, type) {
  if (!infoBox) return;
  infoBox.innerHTML = "";
  const p = document.createElement("p");
  p.className = `info-message${type ? " " + type : ""}`;
  p.textContent = message;
  infoBox.appendChild(p);
}

function renderFileInfo(file) {
  if (!infoBox) return;
  infoBox.innerHTML = "";

  const nameLine = document.createElement("p");
  nameLine.className = "info-line";
  nameLine.textContent = `name: ${file.name}`;

  const sizeLine = document.createElement("p");
  sizeLine.className = "info-line";
  sizeLine.textContent = `size: ${formatBytes(file.size)}`;

  const typeLine = document.createElement("p");
  typeLine.className = "info-line";
  typeLine.textContent = `type: ${file.type || "image"}`;

  infoBox.appendChild(nameLine);
  infoBox.appendChild(sizeLine);
  infoBox.appendChild(typeLine);
}

function renderPreviewSource(source) {
  if (!previewBox) return;
  previewBox.innerHTML = "";

  if (!source) {
    previewBox.innerHTML = defaultPreview;
    return;
  }

  const img = document.createElement("img");
  img.src = source;
  img.alt = "drawing preview";
  previewBox.appendChild(img);
}

function buildDataUrl(base64, mime) {
  if (!base64) return "";
  return `data:${mime || "image/png"};base64,${base64}`;
}

async function handleFile(file) {
  if (!file) {
    selectedFile = null;
    selectedBase64 = null;
    renderPreviewSource("");
    if (infoBox) infoBox.innerHTML = defaultInfo;
    return;
  }

  if (file.type && !file.type.startsWith("image/")) {
    selectedFile = null;
    selectedBase64 = null;
    renderPreviewSource("");
    setInfoMessage("Only image files are allowed.", "error");
    return;
  }

  selectedFile = file;
  renderFileInfo(file);
  try {
    selectedBase64 = await ImageToBase64(file);
  } catch (error) {
    selectedBase64 = null;
  }

  if (!selectedBase64) {
    renderPreviewSource("");
    setInfoMessage("Unable to read image preview.", "error");
    return;
  }

  renderPreviewSource(buildDataUrl(selectedBase64, file.type || "image/png"));
}

async function submit_drawing() {
  if (!selectedFile) {
    setInfoMessage("Select an image before sending.", "error");
    return null;
  }

  setInfoMessage("Sending...", "");

  const BASE_URL = `${config?.API?.BASE_URL || "/api"}/submit/drawing`;
  try {
    const imageBase64 = selectedBase64 || (await ImageToBase64(selectedFile));
    if (!imageBase64) {
      setInfoMessage("Unable to read image.", "error");
      return null;
    }

    const payload = {
      image: imageBase64,
      name: selectedFile.name,
      mime: selectedFile.type || "image/png",
      commentaire: commentaireInput ? commentaireInput.value.trim() : "",
      format: formatInput ? formatInput.value : "",
      technique: techniqueInput ? techniqueInput.value.trim() : "",
      numConcurs: numConcursInput ? parseInt(numConcursInput.value, 10) || 0 : 0,
    };

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // IMPORTANT (cookie session)
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setInfoMessage(`Upload failed (${res.status}).`, "error");
      return null;
    }

    setInfoMessage("Upload complete.", "success");
    return await res.json();
  } catch (e) {
    setInfoMessage("Network error.", "error");
    return null;
  }
}

function reset() {
  selectedFile = null;
  selectedBase64 = null;
  if (fileInput) fileInput.value = "";
  if (previewBox) previewBox.innerHTML = defaultPreview;
  if (infoBox) infoBox.innerHTML = defaultInfo;
  if (dropBox) dropBox.classList.remove("is-dragover");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

if (dropBox && fileInput) {
  dropBox.addEventListener("click", () => fileInput.click());

  dropBox.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropBox.classList.add("is-dragover");
  });

  dropBox.addEventListener("dragleave", () => {
    dropBox.classList.remove("is-dragover");
  });

  dropBox.addEventListener("drop", (event) => {
    event.preventDefault();
    dropBox.classList.remove("is-dragover");
    const file = event.dataTransfer.files[0];
    handleFile(file);
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    handleFile(file);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}

window.submit_drawing = submit_drawing;
window.reset = reset;
