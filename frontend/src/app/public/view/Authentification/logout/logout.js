(function () {
  const LOGOUT_URL = "/api/user/logout";
  const REDIRECT_URL = "/view/Authentification/connection/connection.html";

  async function performLogout() {
    if (typeof window.logout === "function") {
      try {
        await window.logout();
      } catch (err) {
        console.error("logout() threw:", err);
      }
      window.location.href = REDIRECT_URL;
      return;
    }

    try {
      const res = await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
      if (res.ok) {
        window.location.href = REDIRECT_URL;
      } else {
        console.error("Logout failed", res.status);
      }
    } catch (err) {
      console.error("Logout request error:", err);
    }
  }

  // Delegate click handler: any element with data-logout-component will trigger logout
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-logout-component]");
    if (!btn) return;
    e.preventDefault();
    performLogout();
  });

  // Expose for direct invocation if needed
  window.performAuthLogout = performLogout;
})();
