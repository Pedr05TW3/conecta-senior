(() => {
  "use strict";
  const MODE_KEY = "conecta-senior.modo";
  const page = window.location.pathname.toLowerCase();
  const caregiverOnlyPages = ["/pages/painel-familia.html"];
  let mode = "idoso";
  try {
    mode = localStorage.getItem(MODE_KEY) || "idoso";
  } catch { /* O seletor ainda funciona durante esta sessão. */ }

  if (caregiverOnlyPages.includes(page) && mode !== "cuidador") {
    window.location.replace("/pages/index.html");
    return;
  }

  if (document.body.classList.contains("call-screen-page")) return;

  const root = document.createElement("div");
  root.className = "profile-mode-switcher";
  root.innerHTML = `
    <button class="profile-mode-toggle" type="button" aria-expanded="false" aria-controls="profile-mode-panel" aria-label="Escolher modo de uso">
      <span aria-hidden="true">☰</span><span class="profile-toggle-label">Modo</span>
    </button>
    <aside class="profile-mode-panel" id="profile-mode-panel" aria-label="Modo de uso" hidden>
      <p class="profile-mode-eyebrow">ConectaSênior</p>
      <h2>Como você vai usar?</h2>
      <button class="profile-mode-choice" type="button" data-mode-choice="idoso"><span aria-hidden="true">♙</span><span><strong>Modo idoso</strong><small>Acesso à área da Dona Maria</small></span></button>
      <button class="profile-mode-choice" type="button" data-mode-choice="cuidador"><span aria-hidden="true">♡</span><span><strong>Modo cuidador</strong><small>Acompanhamento e contato</small></span></button>
      <p class="profile-mode-current">Modo atual: <strong>${mode === "cuidador" ? "Cuidador" : "Idoso"}</strong></p>
    </aside>`;
  document.body.append(root);

  const toggle = root.querySelector(".profile-mode-toggle");
  const panel = root.querySelector(".profile-mode-panel");
  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    root.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  root.querySelectorAll("[data-mode-choice]").forEach((choice) => {
    choice.addEventListener("click", () => {
      const selected = choice.dataset.modeChoice;
      try { localStorage.setItem(MODE_KEY, selected); } catch { /* Continua a navegação. */ }
      window.location.href = selected === "cuidador" ? "/pages/painel-familia.html" : "/pages/index.html";
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      panel.hidden = true;
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
})();
