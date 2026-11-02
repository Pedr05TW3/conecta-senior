(() => {
  "use strict";
  const MODE_KEY = "conecta-senior.modo";
  const ACCESSIBILITY_KEY = "conecta-senior.acessibilidade.v1";
  const page = window.location.pathname.toLowerCase();
  const caregiverOnlyPages = [
    "/pages/cuidador/painel-familia.html",
    "/pages/cuidador/agenda-consultas-cuidador.html",
    "/pages/cuidador/nova-consulta-cuidador.html",
    "/pages/cuidador/editar-consulta-cuidador.html",
    "/pages/cuidador/sinais-vitais-cuidador.html",
    "/pages/cuidador/adicionar-remedio-cuidador.html",
    "/pages/cuidador/meus-remedios-cuidador.html",
    "/pages/cuidador/remedio-registrado-cuidador.html",
    "/pages/cuidador/falar-com-dona-maria.html",
    "/pages/cuidador/ligacao-dona-maria.html"
  ];
  const textScale = { pequeno: 0.9, medio: 1, grande: 1.16 };
  const textSizeLabel = { pequeno: "Pequeno", medio: "Médio", grande: "Grande" };
  let accessibility = { textSize: "grande", highContrast: false, readAloud: false };
  try {
    const savedAccessibility = JSON.parse(localStorage.getItem(ACCESSIBILITY_KEY) || "null");
    if (savedAccessibility) accessibility = { ...accessibility, ...savedAccessibility };
  } catch { /* Preferências padrão permanecem disponíveis sem armazenamento. */ }

  function persistAccessibility() {
    try { localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(accessibility)); } catch { /* Os controles continuam funcionando nesta página. */ }
  }
  function prepareTextSize(element) {
    if (!(element instanceof HTMLElement) || element.dataset.a11yOriginalFontSize) return;
    if (element.classList.contains("app-icon") || element.classList.contains("bottom-navigation-icon") || element.classList.contains("visually-hidden") || element.getAttribute("aria-hidden") === "true") return;
    element.dataset.a11yOriginalFontSize = getComputedStyle(element).fontSize;
  }
  function applyTextSize(scope = document) {
    const scale = textScale[accessibility.textSize] || 1;
    document.documentElement.style.setProperty("--app-text-scale", String(scale));
    const selector = "h1,h2,h3,h4,p,a,button,label,span,strong,small,dt,dd,input,select,textarea,legend,li";
    const elements = [];
    if (scope instanceof Element && scope.matches(selector)) elements.push(scope);
    if (scope.querySelectorAll) elements.push(...scope.querySelectorAll(selector));
    elements.forEach((element) => {
      prepareTextSize(element);
      const base = element.dataset.a11yOriginalFontSize;
      if (base) element.style.setProperty("font-size", `calc(var(--app-text-scale) * ${base})`, "important");
    });
  }
  function applyContrast() {
    document.documentElement.classList.toggle("a11y-high-contrast", Boolean(accessibility.highContrast));
  }
  function speak(text) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined" || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "pt-BR";
    window.speechSynthesis.speak(utterance);
  }
  function applyReadAloud(readCurrentPage = false) {
    document.documentElement.classList.toggle("a11y-read-aloud", Boolean(accessibility.readAloud));
    if (accessibility.readAloud && readCurrentPage) {
      const main = document.querySelector("main");
      if (main) speak(main.innerText);
    }
    if (!accessibility.readAloud && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  applyTextSize();
  applyContrast();
  applyReadAloud();
  const textObserver = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node instanceof Element) applyTextSize(node);
  })));
  textObserver.observe(document.body, { childList: true, subtree: true });

  document.querySelectorAll("[data-accessibility-toggle]").forEach((toggle) => {
    const setting = toggle.dataset.accessibilityToggle;
    const stateKey = setting === "high-contrast" ? "highContrast" : "readAloud";
    const refreshToggle = () => {
      const enabled = Boolean(accessibility[stateKey]);
      toggle.setAttribute("aria-checked", String(enabled));
      toggle.classList.toggle("is-on", enabled);
    };
    refreshToggle();
    toggle.addEventListener("click", () => {
      accessibility[stateKey] = !accessibility[stateKey];
      persistAccessibility();
      if (stateKey === "highContrast") applyContrast();
      else applyReadAloud(accessibility.readAloud);
      refreshToggle();
    });
  });
  document.querySelectorAll('input[name="text-size"]').forEach((choice) => {
    choice.checked = choice.value === accessibility.textSize;
    choice.addEventListener("change", () => {
      if (!choice.checked) return;
      accessibility.textSize = choice.value;
      persistAccessibility();
      applyTextSize();
    });
  });
  document.querySelectorAll("[data-notification-switch]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const enabled = toggle.getAttribute("aria-checked") !== "true";
      toggle.setAttribute("aria-checked", String(enabled));
      toggle.classList.toggle("is-on", enabled);
    });
  });
  const savedTextSize = document.querySelector('[data-node-id="2001:1188"]');
  if (savedTextSize) savedTextSize.textContent = textSizeLabel[accessibility.textSize] || "Médio";
  document.addEventListener("click", (event) => {
    if (!accessibility.readAloud) return;
    const target = event.target instanceof Element ? event.target.closest("a,button,label,[role=button],[role=switch]") : null;
    if (!target || target.classList.contains("accessibility-switch")) return;
    speak(target.getAttribute("aria-label") || target.innerText || target.value || "");
  });
  let mode = "idoso";
  try {
    mode = localStorage.getItem(MODE_KEY) || "idoso";
  } catch { /* O seletor ainda funciona durante esta sessão. */ }

  if (caregiverOnlyPages.includes(page) && mode !== "cuidador") {
    window.location.replace("/pages/index.html");
    return;
  }

  if (mode === "cuidador") {
    document.querySelectorAll(".bottom-navigation").forEach((navigation) => {
      const links = navigation.querySelectorAll(".bottom-navigation-link");
      if (links[0]) links[0].href = "/pages/cuidador/painel-familia.html";
      if (links[1]) links[1].href = "/pages/cuidador/agenda-consultas-cuidador.html";
    });
  }

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
      window.location.href = selected === "cuidador" ? "/pages/cuidador/painel-familia.html" : "/pages/index.html";
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
