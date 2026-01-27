import { getSessionUser } from "../../../assets/js/authClient.js";

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
const API_URL = `${config?.API?.BASE_URL || "/api"}/admin/concours`;
const STATUS_URL = `${config?.API?.BASE_URL || "/api"}/admin/concours/status`;
const loginUrl = config?.LOGIN?.BASE_URL || "/view/Authentification/connection/connection.html";
const forbiddenUrl = "/view/errors/403/403.html";

const form = document.getElementById("concours-form");
const messageEl = document.getElementById("form-message");
const bodyEl = document.getElementById("concours-body");
const refreshButton = document.getElementById("refresh-button");
const cancelButton = document.getElementById("cancel-button");
const saveButton = document.getElementById("save-button");

const allowedStatuses = ["pas commence", "en cours", "attente", "resultat", "evalue"];
let concoursList = [];

function setMessage(text, type = "") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success");
  if (type) {
    messageEl.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR");
}

function presidentLabel(entry) {
  const nom = entry?.presidentNom || "";
  const prenom = entry?.presidentPrenom || "";
  if (nom || prenom) return `${prenom} ${nom}`.trim();
  if (entry?.numPresident) return `#${entry.numPresident}`;
  return "-";
}

function renderEmpty(text) {
  if (!bodyEl) return;
  bodyEl.innerHTML = `
    <tr>
      <td colspan="7" class="empty">${text}</td>
    </tr>
  `;
}

function statusOptions(current) {
  return allowedStatuses
    .map((status) => {
      const selected = status === current ? "selected" : "";
      return `<option value="${status}" ${selected}>${status}</option>`;
    })
    .join("");
}

function renderTable(list) {
  if (!bodyEl) return;
  if (!list.length) {
    renderEmpty("Aucun concours trouve.");
    return;
  }

  bodyEl.innerHTML = "";

  list.forEach((entry) => {
    const num = Number(entry.numConcours);
    const selectId = `status-select-${num}`;
    const dates = `
      <div class="date-cell">
        <strong>${formatDate(entry.dateDebut)}</strong>
        <span>${formatDate(entry.dateFin)}</span>
      </div>
    `;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${num}</td>
      <td>${entry.theme || "-"}</td>
      <td>${dates}</td>
      <td>${entry.lieu || "-"}</td>
      <td>${presidentLabel(entry)}</td>
      <td>
        <div class="status-cell">
          <span class="status-chip">${entry.etat || "-"}</span>
          <div class="status-line">
            <select id="${selectId}">
              ${statusOptions(entry.etat)}
            </select>
            <button class="btn ghost" data-action="status-update" data-id="${num}" data-select-id="${selectId}">
              Mettre a jour
            </button>
          </div>
        </div>
      </td>
      <td>
        <button class="btn ghost" data-action="edit" data-id="${num}">Editer</button>
      </td>
    `;

    bodyEl.appendChild(tr);
  });
}

function getField(id) {
  return document.getElementById(id);
}

function clearForm() {
  const fields = ["numConcours", "theme", "dateDebut", "dateFin", "etat", "lieu", "numPresident"];
  fields.forEach((id) => {
    const el = getField(id);
    if (!el) return;
    if (id === "etat") {
      el.value = "pas commence";
    } else {
      el.value = "";
    }
  });
}

function fillForm(entry) {
  const mapping = {
    numConcours: entry.numConcours,
    theme: entry.theme,
    dateDebut: entry.dateDebut,
    dateFin: entry.dateFin,
    etat: entry.etat,
    lieu: entry.lieu,
    numPresident: entry.numPresident || "",
  };

  Object.entries(mapping).forEach(([id, value]) => {
    const el = getField(id);
    if (el) el.value = value ?? "";
  });
}

function buildPayload() {
  const numConcours = getField("numConcours")?.value || "";
  const theme = getField("theme")?.value.trim() || "";
  const dateDebut = getField("dateDebut")?.value || "";
  const dateFin = getField("dateFin")?.value || "";
  const etat = getField("etat")?.value || "";
  const lieu = getField("lieu")?.value.trim() || "";
  const numPresidentRaw = getField("numPresident")?.value || "";

  const payload = {
    theme,
    dateDebut,
    dateFin,
    etat,
    lieu,
    numPresident: numPresidentRaw ? parseInt(numPresidentRaw, 10) : null,
  };

  if (numConcours) {
    payload.numConcours = parseInt(numConcours, 10);
  }

  return payload;
}

function validate(payload) {
  const required = ["theme", "dateDebut", "dateFin", "etat", "lieu"];
  const missing = required.filter((key) => !payload[key]);
  if (missing.length) {
    setMessage(`Champs obligatoires manquants: ${missing.join(", ")}.`, "error");
    return false;
  }
  if (payload.dateFin < payload.dateDebut) {
    setMessage("La date de fin doit etre apres la date de debut.", "error");
    return false;
  }
  return true;
}

async function apiRequest(method, payload = null, url = API_URL) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (res.status === 401) {
    window.location.href = loginUrl;
    return null;
  }
  if (res.status === 403) {
    window.location.href = forbiddenUrl;
    return null;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { res, data };
}

async function loadConcours() {
  renderEmpty("Chargement...");
  const result = await apiRequest("GET");
  if (!result) return;

  const { res, data } = result;
  if (!res.ok) {
    setMessage("Impossible de charger les concours.", "error");
    renderEmpty("Erreur de chargement.");
    return;
  }

  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  concoursList = list;
  renderTable(concoursList);
}

async function handleSubmit(event) {
  event.preventDefault();
  const payload = buildPayload();
  if (!validate(payload)) return;

  const isUpdate = typeof payload.numConcours === "number";
  const method = isUpdate ? "PUT" : "POST";

  if (saveButton) saveButton.disabled = true;
  setMessage(isUpdate ? "Mise a jour..." : "Creation...", "");

  const result = await apiRequest(method, payload);
  if (!result) {
    if (saveButton) saveButton.disabled = false;
    return;
  }

  const { res, data } = result;
  if (!res.ok || !data?.success) {
    setMessage(data?.message || `Erreur (${res.status}).`, "error");
    if (saveButton) saveButton.disabled = false;
    return;
  }

  setMessage(isUpdate ? "Concours mis a jour." : "Concours cree.", "success");
  clearForm();
  await loadConcours();
  if (saveButton) saveButton.disabled = false;
}

async function updateStatus(numConcours, selectId) {
  const select = document.getElementById(selectId);
  const etat = select ? select.value : "";
  if (!etat) return;

  setMessage(`Mise a jour du statut #${numConcours}...`, "");
  const result = await apiRequest("PUT", { numConcours, etat }, STATUS_URL);
  if (!result) return;

  const { res, data } = result;
  if (!res.ok || !data?.success) {
    setMessage(data?.message || `Erreur statut (${res.status}).`, "error");
    return;
  }

  setMessage(`Statut du concours #${numConcours} mis a jour.`, "success");
  await loadConcours();
}

function handleTableClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  const numConcours = parseInt(id, 10);
  const entry = concoursList.find((item) => Number(item.numConcours) === numConcours);
  if (!entry) return;

  if (action === "edit") {
    fillForm(entry);
    setMessage(`Edition du concours #${numConcours}.`, "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "status-update") {
    const selectId = target.dataset.selectId;
    if (selectId) updateStatus(numConcours, selectId);
  }
}

async function init() {
  let session = null;
  try {
    session = await getSessionUser();
  } catch (e) {
    session = null;
  }

  if (!session) {
    window.location.href = loginUrl;
    return;
  }

  clearForm();
  await loadConcours();
}

if (form) {
  form.addEventListener("submit", handleSubmit);
}

if (bodyEl) {
  bodyEl.addEventListener("click", handleTableClick);
}

if (refreshButton) {
  refreshButton.addEventListener("click", loadConcours);
}

if (cancelButton) {
  cancelButton.addEventListener("click", () => {
    clearForm();
    setMessage("");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
