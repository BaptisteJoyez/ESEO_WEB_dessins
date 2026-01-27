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
const CLUBS_URL = `${config?.API?.BASE_URL || "/api"}/clubs`;
const loginUrl = config?.LOGIN?.BASE_URL || "/view/Authentification/connection/connection.html";

const titleEl = document.getElementById("page-title");
const subtitleEl = document.getElementById("page-subtitle");
const panelTitleEl = document.getElementById("panel-title");
const panelBackEl = document.getElementById("panel-back");
const messageEl = document.getElementById("club-message");
const contentEl = document.getElementById("club-content");

function setMessage(text, type = "") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success");
  if (type) {
    messageEl.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeBase64(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString("fr-FR");
}

function renderEmpty(text) {
  if (!contentEl) return;
  contentEl.innerHTML = `<div class="empty">${escapeHtml(text)}</div>`;
}

async function apiGet(url) {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = loginUrl;
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

function clubLink(numClub) {
  return `club_drawings.html?clubId=${encodeURIComponent(numClub)}`;
}

function renderClubs(list) {
  if (!contentEl) return;
  if (!list.length) {
    renderEmpty("Aucun club trouve.");
    return;
  }

  const cards = list
    .map((club) => {
      const numClub = escapeHtml(club.numClub);
      const nom = escapeHtml(club.nomClub || `Club ${numClub}`);
      const ville = escapeHtml(club.ville || "Ville inconnue");
      const region = escapeHtml(club.region || "-");
      const membres = escapeHtml(club.nbMembres ?? club.nombreAdherents ?? 0);
      const dessins = escapeHtml(club.nbDessins ?? 0);

      return `
        <article class="club-card">
          <h3>${nom}</h3>
          <div class="club-meta">
            <span>#${numClub}</span>
            <span>${ville} • ${region}</span>
          </div>
          <div class="club-stats">
            <span class="stat-chip">${membres} membre(s)</span>
            <span class="stat-chip">${dessins} dessin(s)</span>
          </div>
          <a class="btn ghost" href="${clubLink(club.numClub)}">Voir les dessins</a>
        </article>
      `;
    })
    .join("");

  contentEl.innerHTML = `<div class="club-list">${cards}</div>`;
}

function drawingsHeader(club, count) {
  const nom = escapeHtml(club?.nomClub || "Club");
  const ville = escapeHtml(club?.ville || "-");
  const region = escapeHtml(club?.region || "-");
  return `
    <div class="club-card">
      <h3>${nom}</h3>
      <div class="club-meta">
        <span>${ville} • ${region}</span>
        <span>${count} dessin(s)</span>
      </div>
      <div class="club-stats">
        <span class="stat-chip">Club #${escapeHtml(club?.numClub || "-")}</span>
      </div>
    </div>
  `;
}

function renderClubDrawings(club, drawings) {
  if (!contentEl) return;
  if (!drawings.length) {
    contentEl.innerHTML = `${drawingsHeader(club, 0)}<div class="empty">Aucun dessin pour ce club.</div>`;
    return;
  }

  const cards = drawings
    .map((entry) => {
      const src = normalizeBase64(entry.leDessin);
      const concoursLabel = entry.theme ? `Concours ${entry.numConcours} - ${entry.theme}` : `Concours ${entry.numConcours}`;
      const auteur = `${entry.prenom || ""} ${entry.nom || ""}`.trim() || entry.login || "Auteur inconnu";

      return `
        <article class="drawing-card">
          <img src="${src}" alt="Dessin ${escapeHtml(entry.numDessin)}" loading="lazy" />
          <div class="drawing-body">
            <p class="drawing-title">${escapeHtml(concoursLabel)}</p>
            <div class="drawing-meta">
              <span>Par ${escapeHtml(auteur)}</span>
              <span>Remis le ${formatDate(entry.dateRemise)}</span>
              <span>Format ${escapeHtml(entry.format || "-")} • ${escapeHtml(entry.technique || "-")}</span>
            </div>
            <span class="status-chip">${escapeHtml(entry.etat || "-")}</span>
          </div>
        </article>
      `;
    })
    .join("");

  contentEl.innerHTML = `
    ${drawingsHeader(club, drawings.length)}
    <div class="drawings-grid">${cards}</div>
  `;
}

async function loadClubsView() {
  setMessage("Chargement des clubs...");
  renderEmpty("Chargement...");

  const result = await apiGet(CLUBS_URL);
  if (!result) return;

  const { res, data } = result;
  if (!res.ok || !data?.success) {
    setMessage(data?.message || `Erreur (${res.status}).`, "error");
    renderEmpty("Erreur de chargement des clubs.");
    return;
  }

  const list = Array.isArray(data.data) ? data.data : [];
  setMessage(`${list.length} club(s) charge(s).`, "success");
  renderClubs(list);
}

async function loadClubDrawingsView(clubId) {
  const url = `${CLUBS_URL}/${encodeURIComponent(clubId)}/drawings`;
  setMessage(`Chargement du club #${clubId}...`);
  renderEmpty("Chargement...");

  const result = await apiGet(url);
  if (!result) return;

  const { res, data } = result;
  if (res.status === 404) {
    setMessage("Club introuvable.", "error");
    renderEmpty("Club introuvable.");
    return;
  }
  if (!res.ok || !data?.success) {
    setMessage(data?.message || `Erreur (${res.status}).`, "error");
    renderEmpty("Erreur de chargement du club.");
    return;
  }

  const club = data.club || { numClub: clubId };
  const drawings = Array.isArray(data.data) ? data.data : [];

  if (titleEl) titleEl.textContent = `Dessins - ${club.nomClub || `Club ${clubId}`}`;
  if (subtitleEl) subtitleEl.textContent = "Voici toutes les images associees a ce club.";
  if (panelTitleEl) panelTitleEl.textContent = `Club ${club.nomClub || clubId}`;
  if (panelBackEl) panelBackEl.hidden = false;

  setMessage(`${drawings.length} dessin(s) trouves.`, "success");
  renderClubDrawings(club, drawings);
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

  const params = new URLSearchParams(window.location.search);
  const clubId = params.get("clubId");

  if (!clubId) {
    if (panelBackEl) panelBackEl.hidden = true;
    await loadClubsView();
    return;
  }

  await loadClubDrawingsView(clubId);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
