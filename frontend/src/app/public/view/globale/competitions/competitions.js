/* =========================================
   1. GESTION DES DONNÉES (API)
   ========================================= */

// Simulation de l'appel API (À remplacer par ton fetch réel)
async function getContests() {
    // Si tu as une vraie URL : 
    // const BASE_URL = config.API.BASE_URL + "/get/contests";
    
    // Pour l'exemple, voici des fausses données :
    return [
        { id: 1, titre: "Portrait au fusain", date: "2023-12-10", status: "closed", url: "/concours/1" },
        { id: 2, titre: "Paysage d'hiver", date: "2024-01-15", status: "closed", url: "/concours/2" },
        { id: 3, titre: "Manga & Encre", date: "2025-11-20", status: "active", url: "/concours/3" },
        { id: 4, titre: "Perspective urbaine", date: "2025-11-25", status: "active", url: "/concours/4" },
        { id: 5, titre: "Couleurs du printemps", date: "2026-03-01", status: "future", url: "/concours/5" },
        { id: 6, titre: "Concept Art Robot", date: "2026-04-15", status: "future", url: "/concours/6" }
    ];
}

/* =========================================
   2. RENDU HTML
   ========================================= */

function renderContestItem(contest) {
    // Formatage simple de la date
    const dateObj = new Date(contest.date);
    const dateStr = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    // Création de l'élément cliquable
    const li = document.createElement('li');
    li.className = 'contest-item';
    li.onclick = () => {
        // Redirection au clic
        window.location.href = contest.url;
        // Ou si c'est une Single Page App : navigateTo(contest.url);
    };

    li.innerHTML = `
        <div>
            <span class="contest-name">${contest.titre}</span>
            <span class="contest-date">${dateStr}</span>
        </div>
        <span class="arrow-icon">➜</span>
    `;
    return li;
}

function updateList(containerId, countId, items) {
    const listContainer = document.getElementById(containerId);
    const countBadge = document.getElementById(countId);
    
    if (!listContainer || !countBadge) return;

    // Mise à jour du compteur
    countBadge.textContent = items.length;

    listContainer.innerHTML = ''; // Nettoyage

    if (items.length === 0) {
        listContainer.innerHTML = '<li class="contest-item" style="cursor:default; opacity:0.5;">Aucun concours</li>';
        return;
    }

    items.forEach(contest => {
        const itemElement = renderContestItem(contest);
        listContainer.appendChild(itemElement);
    });
}

/* =========================================
   3. INITIALISATION
   ========================================= */

async function initConcours() {
    const data = await getContests();
    
    if (!data) return;

    // Filtrage des données
    // (Adapte selon comment ton API renvoie le statut)
    const future = data.filter(c => c.status === 'future');
    const active = data.filter(c => c.status === 'active');
    const closed = data.filter(c => c.status === 'closed');

    // Remplissage des 3 colonnes
    updateList('list-future', 'count-future', future);
    updateList('list-active', 'count-active', active);
    updateList('list-closed', 'count-closed', closed);
}

// Lancement au chargement
document.addEventListener('DOMContentLoaded', initConcours);