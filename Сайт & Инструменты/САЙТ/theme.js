(() => {
  const root =
    document.documentElement;

  const toggle =
    document.getElementById("theme-toggle");

  if (!toggle) {
    return;
  }

  let savedTheme = null;

  try {
    savedTheme =
      localStorage.getItem("ecoai-theme");
  } catch {
    savedTheme = null;
  }

  function applyTheme(theme) {
    const isDark =
      theme === "dark";

    root.dataset.theme =
      isDark ? "dark" : "light";

    toggle.querySelector("span").textContent =
      isDark ? "☀" : "◐";

    toggle.setAttribute(
      "aria-label",
      isDark
        ? "Включить светлую тему"
        : "Включить тёмную тему"
    );

    toggle.setAttribute(
      "title",
      isDark
        ? "Включить светлую тему"
        : "Включить тёмную тему"
    );
  }

  applyTheme(
    savedTheme === "dark"
      ? "dark"
      : "light"
  );

  toggle.addEventListener("click", () => {
    const nextTheme =
      root.dataset.theme === "dark"
        ? "light"
        : "dark";

    applyTheme(nextTheme);

    try {
      localStorage.setItem(
        "ecoai-theme",
        nextTheme
      );
    } catch {
      // Theme still works when storage is unavailable.
    }
  });
})();
