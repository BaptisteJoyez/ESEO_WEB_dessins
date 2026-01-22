// Page dessins à évaluer
console.log("Page dessins à évaluer chargée");

// Données fictives pour l'exemple
const mockDrawings = [
  {
    id: 1,
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%234cc3ff' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='white' text-anchor='middle' dy='.3em'%3EDessin 1%3C/text%3E%3C/svg%3E",
    firstName: "Marie",
    lastName: "Dupont",
    submissionDate: "2026-01-15"
  },
  {
    id: 2,
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ffd166' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='white' text-anchor='middle' dy='.3em'%3EDessin 2%3C/text%3E%3C/svg%3E",
    firstName: "Pierre",
    lastName: "Martin",
    submissionDate: "2026-01-16"
  },
  {
    id: 3,
    imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ff6b9d' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='white' text-anchor='middle' dy='.3em'%3EDessin 3%3C/text%3E%3C/svg%3E",
    firstName: "Sophie",
    lastName: "Bernard",
    submissionDate: "2026-01-17"
  }
];

// Fonction pour formater la date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Fonction pour afficher les dessins dans le tableau
function displayDrawings(drawings) {
  const tbody = document.getElementById('drawings-tbody');
  
  if (!drawings || drawings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <p>Aucun dessin à évaluer pour le moment.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = drawings.map(drawing => `
    <tr>
      <td>
        <img 
          src="${drawing.imageUrl}" 
          alt="Dessin de ${drawing.firstName} ${drawing.lastName}"
          class="drawing-thumbnail"
          data-full-image="${drawing.imageUrl}"
        />
      </td>
      <td>
        <span class="artist-name">${drawing.firstName} ${drawing.lastName}</span>
      </td>
      <td>${formatDate(drawing.submissionDate)}</td>
      <td>
        <button class="btn-rate" data-drawing-id="${drawing.id}">
          ⭐ Noter
        </button>
      </td>
    </tr>
  `).join('');

  // Ajouter les écouteurs d'événements
  attachEventListeners();
}

// Fonction pour gérer le clic sur une miniature
function openImageModal(imageSrc) {
  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  
  modalImage.src = imageSrc;
  modal.classList.add('show'); // Ajout de la classe au lieu de style.display
}

// Fonction pour fermer le modal
function closeImageModal() {
  const modal = document.getElementById('image-modal');
  modal.classList.remove('show'); // Retrait de la classe
}

// Variables pour stocker le dessin en cours d'évaluation
let currentDrawingId = null;

// Fonction pour formater la date du jour
function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString('fr-FR', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Fonction pour obtenir la date au format ISO (pour envoi à la BDD)
function getCurrentDateISO() {
  return new Date().toISOString();
}

// Fonction pour ouvrir le modal de notation
function openRatingModal(drawingId) {
  currentDrawingId = drawingId;
  const drawing = mockDrawings.find(d => d.id === parseInt(drawingId));
  
  if (!drawing) {
    console.error('Dessin non trouvé');
    return;
  }
  
  const modal = document.getElementById('rating-modal');
  const image = document.getElementById('rating-drawing-image');
  const dateDisplay = document.getElementById('rating-current-date');
  const scoreInput = document.getElementById('rating-score');
  const commentInput = document.getElementById('rating-comment');
  
  // Remplir les données
  image.src = drawing.imageUrl;
  image.alt = `Dessin de ${drawing.firstName} ${drawing.lastName}`;
  dateDisplay.textContent = getCurrentDate();
  
  // Réinitialiser le formulaire
  scoreInput.value = 10;
  commentInput.value = '';
  document.getElementById('evaluator-firstname').value = '';
  document.getElementById('evaluator-lastname').value = '';
  
  modal.classList.add('show'); // Ajout de la classe
}

// Fonction pour fermer le modal de notation
function closeRatingModal() {
  const modal = document.getElementById('rating-modal');
  modal.classList.remove('show'); // Retrait de la classe
  currentDrawingId = null;
}

// Fonction pour gérer les boutons +/- de la note
function incrementScore() {
  const input = document.getElementById('rating-score');
  const currentValue = parseFloat(input.value);
  const newValue = Math.min(20, currentValue + 0.5);
  input.value = newValue;
}

function decrementScore() {
  const input = document.getElementById('rating-score');
  const currentValue = parseFloat(input.value);
  const newValue = Math.max(0, currentValue - 0.5);
  input.value = newValue;
}

// Fonction pour soumettre l'évaluation
async function submitRating() {
  const score = parseFloat(document.getElementById('rating-score').value);
  const comment = document.getElementById('rating-comment').value.trim();
  const evaluatorFirstname = document.getElementById('evaluator-firstname').value.trim();
  const evaluatorLastname = document.getElementById('evaluator-lastname').value.trim();
  const date = getCurrentDateISO();
  
  // Validation
  if (score < 0 || score > 20) {
    alert('La note doit être entre 0 et 20');
    return;
  }
  
  if (!evaluatorFirstname || !evaluatorLastname) {
    alert('Veuillez renseigner votre nom et prénom');
    return;
  }
  
  // Données à envoyer
  const ratingData = {
    drawingId: currentDrawingId,
    score: score,
    comment: comment,
    evaluatorFirstname: evaluatorFirstname,
    evaluatorLastname: evaluatorLastname,
    date: date
  };
  
  console.log('Envoi de l\'évaluation:', ratingData);
  
  // TODO: Remplacer par un appel API réel
  try {
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Afficher un message de succès
    alert(`✅ Évaluation enregistrée avec succès!\n\nÉvaluateur: ${evaluatorFirstname} ${evaluatorLastname}\nNote: ${score}/20\nDate: ${getCurrentDate()}`);
    
    // Fermer le modal
    closeRatingModal();
    
    // Optionnel: retirer le dessin de la liste ou le marquer comme évalué
    // displayDrawings(mockDrawings.filter(d => d.id !== currentDrawingId));
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error);
    alert('❌ Erreur lors de l\'envoi de l\'évaluation. Veuillez réessayer.');
  }
  
  // Code pour l'appel API réel (à décommenter et adapter):
  /*
  try {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratingData)
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi');
    }
    
    const result = await response.json();
    alert('✅ Évaluation enregistrée avec succès!');
    closeRatingModal();
    
    // Recharger la liste des dessins
    loadDrawings();
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error);
    alert('❌ Erreur lors de l\'envoi de l\'évaluation. Veuillez réessayer.');
  }
  */
}


// Fonction pour attacher les écouteurs d'événements
function attachEventListeners() {
  // Clic sur les miniatures
  document.querySelectorAll('.drawing-thumbnail').forEach(thumbnail => {
    thumbnail.addEventListener('click', (e) => {
      const imageSrc = e.target.getAttribute('data-full-image');
      openImageModal(imageSrc);
    });
  });

  // Clic sur les boutons de notation
  document.querySelectorAll('.btn-rate').forEach(button => {
    button.addEventListener('click', (e) => {
      const drawingId = e.target.getAttribute('data-drawing-id');
      console.log(`Bouton de notation cliqué pour le dessin #${drawingId}`);
      openRatingModal(drawingId);
    });
  });
}

// Gestion du modal
document.addEventListener('DOMContentLoaded', () => {
  // Afficher les dessins
  displayDrawings(mockDrawings);

  // Fermer le modal d'image avec le bouton X
  const closeBtn = document.getElementById('close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeImageModal);
  }

  // Fermer le modal d'image en cliquant sur l'overlay
  const modal = document.getElementById('image-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-overlay')) {
        closeImageModal();
      }
    });
  }

  // Fermer le modal de notation avec le bouton X
  const closeRatingBtn = document.getElementById('close-rating-modal');
  if (closeRatingBtn) {
    closeRatingBtn.addEventListener('click', closeRatingModal);
  }

  // Fermer le modal de notation en cliquant sur l'overlay
  const ratingModal = document.getElementById('rating-modal');
  if (ratingModal) {
    ratingModal.addEventListener('click', (e) => {
      if (e.target === ratingModal || e.target.classList.contains('modal-overlay')) {
        closeRatingModal();
      }
    });
  }

  // Clic sur l'image dans le modal de notation pour l'agrandir
  const ratingImage = document.getElementById('rating-drawing-image');
  if (ratingImage) {
    ratingImage.addEventListener('click', () => {
      openImageModal(ratingImage.src);
    });
  }

  // Boutons +/- pour la note
  const increaseBtn = document.querySelector('.score-increase');
  const decreaseBtn = document.querySelector('.score-decrease');
  
  if (increaseBtn) {
    increaseBtn.addEventListener('click', incrementScore);
  }
  
  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', decrementScore);
  }

  // Validation de l'input de note
  const scoreInput = document.getElementById('rating-score');
  if (scoreInput) {
    scoreInput.addEventListener('input', (e) => {
      let value = parseFloat(e.target.value);
      if (isNaN(value)) {
        e.target.value = 0;
      } else if (value < 0) {
        e.target.value = 0;
      } else if (value > 20) {
        e.target.value = 20;
      }
    });
  }

  // Bouton de soumission
  const submitBtn = document.getElementById('submit-rating');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitRating);
  }

  // Fermer les modals avec la touche Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageModal();
      closeRatingModal();
    }
  });
});

// TODO: Remplacer les données fictives par un appel API
// async function loadDrawings() {
//   try {
//     const response = await fetch('/api/drawings/to-rate');
//     const drawings = await response.json();
//     displayDrawings(drawings);
//   } catch (error) {
//     console.error('Erreur lors du chargement des dessins:', error);
//   }
// }
