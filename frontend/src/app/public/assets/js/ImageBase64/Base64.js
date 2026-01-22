/**
 * Convertit une image en Base64 avec validations
 * @param {File} image - Fichier image à convertir
 * @param {Object} options - Options de configuration
 * @param {number} options.maxSizeMB - Taille maximale en MB (défaut: 10)
 * @param {string[]} options.allowedTypes - Types MIME autorisés
 * @returns {Promise<string|null>} Base64 sans préfixe data:image
 */
export function ImageToBase64(image, options = {}) {
  // Options par défaut
  const config = {
    maxSizeMB: 10,
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    ...options,
  };

  // Validation initiale
  if (!image) return Promise.resolve(null);

  // Vérification du type de fichier
  if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(image.type)) {
    return Promise.reject(new Error(`Type de fichier non autorisé. Types acceptés: ${config.allowedTypes.join(", ")}`));
  }

  // Vérification de la taille
  const fileSizeMB = image.size / (1024 * 1024);
  if (fileSizeMB > config.maxSizeMB) {
    return Promise.reject(new Error(`Fichier trop volumineux (${fileSizeMB.toFixed(2)}MB). Taille max: ${config.maxSizeMB}MB`));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        resolve(null);
        return;
      }

      const [, base64] = reader.result.split(",");

      // Vérification supplémentaire
      if (!base64 || base64.length === 0) {
        reject(new Error("Conversion Base64 échouée: résultat vide"));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(reader.error || new Error("Impossible de lire le fichier"));

    reader.readAsDataURL(image);
  });
}

// ========================================
// EXEMPLES D'UTILISATION
// ========================================

// Utilisation basique (garde tous les types d'images)
async function exemple1(imageFile) {
  try {
    const base64 = await ImageToBase64(imageFile);
    console.log("✅ Conversion réussie");
    console.log("Taille Base64:", (base64.length / 1024).toFixed(2), "KB");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

// Utilisation avec restrictions personnalisées
async function exemple2(imageFile) {
  try {
    const base64 = await ImageToBase64(imageFile, {
      maxSizeMB: 5,
      allowedTypes: ["image/jpeg", "image/png"],
    });
    console.log("✅ Conversion réussie");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

// Utilisation dans un formulaire
async function handleImageUpload(imageFile) {
  try {
    const base64 = await ImageToBase64(imageFile);

    // Envoyer au serveur
    const response = await fetch("/api/dessins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commentaire: "Mon dessin",
        classement: 3,
        format: "A3",
        technique: "crayon",
        numConcours: 2,
        leDessin: base64,
        nom: "Robert",
        prenom: "Chloe",
      }),
    });

    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

    const result = await response.json();
    console.log("✅ Image enregistrée:", result);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}
