import CTFd from "../index";
import Alpine from "alpinejs";

Alpine.data("LanguageForm", () => ({
  async set(event) {
    let language = event.target.getAttribute("value");
    document.cookie = `language=${language};SameSite=Lax`;
    try {
      localStorage.setItem("language", language);
    } catch {
      // The cookie above is what the server reads.
    }

    // Set user language preference if logged in
    if (CTFd.user.id) {
      await CTFd.fetch("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify({ language }),
      });
    }

    // Reload with new language
    window.location.reload();
  },
}));
