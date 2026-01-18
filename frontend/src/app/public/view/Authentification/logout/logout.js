// Logout component script
// If a global `logout` function exists it will be called; otherwise
// this script POSTs to `/logout` and redirects to the connection page.
(function () {
  async function performLogout() {
    if (typeof window.logout === "function") {
      try {
        await window.logout();
      } catch (err) {
        console.error("logout() threw:", err);
      }
      window.location.href = "../connection/coonnection.html";
      return;
    }

    try {
      const res = await fetch("/logout", { method: "POST", credentials: "include" });
      if (res.ok) {
        window.location.href = "../../Authentification/connection/connection.html";
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
