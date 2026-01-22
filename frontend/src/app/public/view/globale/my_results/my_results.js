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
  // if (!user) {
  //   window.location.href = loginUrl;
  //   return;
  // }

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
    // Note : Assurez-vous que 'config' est bien accessible ici
    // Sinon remplacez par l'URL en dur ou importez config
    const BASE_URL = config.API.BASE_URL + "/get/user/images"; 
    try {
        const res = await fetch(BASE_URL, {
            credentials: "include",
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Erreur fetch:", e);
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

function renderNotesTable(imagesData) {
    const tableBody = document.getElementById("notes-table-body");
    
    // Sécurité : si le tableau n'existe pas dans le HTML de cette section, on arrête
    if (!tableBody) return;

    const rawList = extractBase64List(imagesData);

    if (rawList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Aucune note disponible pour le moment.</td></tr>';
        return;
    }

    tableBody.innerHTML = ""; // Nettoyage

    rawList.forEach((entry, index) => {
        const imgSrc = normalizeBase64(entry);
        
        // Valeurs par défaut si les champs n'existent pas encore en BDD
        const note = entry.note || "En attente";
        const commentaire = entry.commentaire || "Pas de commentaire.";
        const titre = entry.titre || `Dessin ${index + 1}`;

        // Ligne 1 : Infos principales
        const rowInfo = document.createElement("tr");
        rowInfo.className = "row-info";
        rowInfo.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="drawing-cell">
                    ${imgSrc ? `<img src="${imgSrc}" class="mini-preview" alt="Aperçu">` : ''}
                    <span>${titre}</span>
                </div>
            </td>
            <td class="text-accent">${note}</td>
        `;

        // Ligne 2 : Commentaire détaillé
        const rowNote = document.createElement("tr");
        rowNote.className = "row-note";
        rowNote.innerHTML = `
            <td colspan="3">
                <div class="note-content">
                    <strong>Commentaire :</strong> ${commentaire}
                </div>
            </td>
        `;

        tableBody.appendChild(rowInfo);
        tableBody.appendChild(rowNote);
    });
}

async function initMyResults() {
    // 1. On récupère les données
    const data = await getUserDrawing();

    if (data) {
        // 2. On lance l'affichage du tableau
        renderNotesTable(data);
        // 3. On affiche aussi les images dans le carousel
        makeImage(data); 
    }
}