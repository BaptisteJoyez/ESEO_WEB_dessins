async function loadConfig() {
  const module = await import("../../../assets/js/config.js");
  return module.default;
}

const config = await loadConfig();
const BASE_URL = `${config.API.BASE_URL}/user/register`;
const BOARD_URL = config.BOARD.BASE_URL;

const form = document.getElementById("register-form");
const submitButton = document.getElementById("register-submit");
const messageEl = document.getElementById("form-message");

function setMessage(text, type = "") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("is-error", "is-success");
  if (type) {
    messageEl.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function buildPayload() {
  const nom = getValue("nom");
  const prenom = getValue("prenom");
  const login = getValue("login");
  const password = document.getElementById("password")?.value || "";
  const ageRaw = getValue("age");
  const sexe = getValue("sexe");
  const adresse = getValue("adresse");
  const numClubRaw = getValue("numClub");

  return {
    nom,
    prenom,
    login,
    password,
    age: ageRaw ? parseInt(ageRaw, 10) : null,
    sexe: sexe || null,
    adresse: adresse || null,
    numClub: numClubRaw ? parseInt(numClubRaw, 10) : null,
  };
}

function validate(payload) {
  if (!payload.nom || !payload.prenom || !payload.login || !payload.password) {
    setMessage("Remplis tous les champs obligatoires (*).", "error");
    return false;
  }
  if (payload.password.length < 6) {
    setMessage("Le mot de passe doit faire au moins 6 caracteres.", "error");
    return false;
  }
  return true;
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = buildPayload();
  if (!validate(payload)) return;

  if (submitButton) submitButton.disabled = true;
  setMessage("Creation du compte...", "");

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      setMessage("Ce login est deja utilise.", "error");
      return;
    }

    if (!res.ok) {
      setMessage(`Erreur lors de l'inscription (${res.status}).`, "error");
      return;
    }

    const data = await res.json();
    if (data?.success) {
      setMessage("Compte cree, redirection...", "success");
      window.location.href = BOARD_URL;
      return;
    }

    setMessage("Inscription refusee.", "error");
  } catch (error) {
    setMessage("Backend indisponible.", "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

if (form) {
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", () => setMessage(""));
}
