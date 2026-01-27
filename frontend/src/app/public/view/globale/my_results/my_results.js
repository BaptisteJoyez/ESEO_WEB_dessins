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
const RESULTS_URL = `${config?.API?.BASE_URL || "/api"}/results/me`;
const loginUrl = config?.LOGIN?.BASE_URL || "/view/Authentification/connection/connection.html";

const messageEl = document.getElementById("results-message");
const bodyEl = document.getElementById("results-body");

function setMessage(text, type = "") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success");
  if (type) {
    messageEl.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function renderEmpty(text) {
  if (!bodyEl) return;
  bodyEl.innerHTML = `
    <tr>
      <td colspan="7" class="empty">${text}</td>
    </tr>
  `;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR");
}

function formatNote(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "-";
  return num.toFixed(1);
}

function renderResults(list) {
  if (!bodyEl) return;
  if (!list.length) {
    renderEmpty("Aucun resultat pour le moment.");
    return;
  }

  bodyEl.innerHTML = "";

  list.forEach((entry) => {
    const note = formatNote(entry.noteMoyenne);
    const concoursLabel = entry.theme ? `Concours ${entry.numConcours} - ${entry.theme}` : `Concours ${entry.numConcours}`;
    const classement = entry.classement ?? "-";
    const evalCount = entry.nbEvaluations ?? 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.numDessin}</td>
      <td>
        <div class="concours-cell">
          <strong>${concoursLabel}</strong>
          <span>${formatDate(entry.dateDebut)} - ${formatDate(entry.dateFin)}</span>
        </div>
      </td>
      <td>${formatDate(entry.dateRemise)}</td>
      <td>${classement}</td>
      <td><span class="note-chip">${note}</span></td>
      <td>${evalCount}</td>
      <td><span class="status-chip">${entry.etat || "-"}</span></td>
    `;

    bodyEl.appendChild(tr);
  });
}

async function loadResults() {
  renderEmpty("Chargement...");
  setMessage("");

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

  try {
    const res = await fetch(RESULTS_URL, {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401) {
      window.location.href = loginUrl;
      return;
    }

    const data = await res.json();
    if (!res.ok || !data?.success) {
      setMessage(data?.message || `Erreur (${res.status}).`, "error");
      renderEmpty("Erreur de chargement.");
      return;
    }

    const list = Array.isArray(data.data) ? data.data : [];
    setMessage(`${list.length} resultat(s) charge(s).`, "success");
    renderResults(list);
  } catch (error) {
    setMessage("Erreur reseau.", "error");
    renderEmpty("Erreur reseau.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadResults);
} else {
  loadResults();
}
