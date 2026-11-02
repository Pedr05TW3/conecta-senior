(() => {
  "use strict";
  const STORAGE_KEY = "conecta-senior.remedios.v1";
  let medicines = [];
  const periods = {
    "1-week": { label: "1 semana", weeks: 1 },
    "2-weeks": { label: "2 semanas", weeks: 2 },
    "1-month": { label: "1 mês", months: 1 },
    "3-months": { label: "3 meses", months: 3 },
    "6-months": { label: "6 meses", months: 6 },
    continuous: { label: "Uso contínuo" }
  };
  const fallbackMedicines = [
    { id: "sample-losartana", name: "Losartana", dosage: "50 mg · 1 comprimido", time: "09:00", instructions: "Após o café", duration: "continuous", durationLabel: "Uso contínuo", startDate: "2026-09-22", endDate: null, sample: true, status: "TOMADO" },
    { id: "sample-metformina", name: "Metformina", dosage: "850 mg · 1 comprimido", time: "19:00", instructions: "Após o jantar", duration: "continuous", durationLabel: "Uso contínuo", startDate: "2026-09-22", endDate: null, sample: true, status: "PENDENTE" }
  ];

  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function addCalendarMonths(date, months) {
    const result = new Date(date);
    const day = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    result.setDate(Math.min(day, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
    return result;
  }
  function formatDate(dateString) {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${dateString}T12:00:00`));
  }
  function createCard(medicine) {
    const card = document.createElement("a");
    card.className = "medication-card";
    card.id = `medication-${medicine.id}`;
    card.href = `/pages/remedio-registrado.html?id=${encodeURIComponent(medicine.id)}`;
    card.setAttribute("aria-label", `Ver detalhes de ${medicine.name}`);
    const heading = document.createElement("div");
    heading.className = "medication-card-heading";
    const name = document.createElement("h3");
    name.textContent = medicine.name;
    const status = document.createElement("p");
    status.className = `medication-status${medicine.sample ? "" : " medication-status-new"}`;
    status.textContent = medicine.status || "CADASTRADO";
    heading.append(name, status);
    const dosage = document.createElement("p");
    dosage.className = "medication-dosage";
    dosage.textContent = medicine.dosage;
    const schedule = document.createElement("p");
    schedule.className = "medication-schedule";
    schedule.textContent = [medicine.time, medicine.instructions].filter(Boolean).join(" · ");
    const period = document.createElement("p");
    period.className = "medication-period";
    period.textContent = medicine.durationLabel === "Uso contínuo" ? "Uso contínuo" : `${medicine.durationLabel}${medicine.endDate ? ` · até ${formatDate(medicine.endDate)}` : ""}`;
    card.append(heading, dosage, schedule, period);
    return card;
  }
  async function loadMedicines() {
    const response = await fetch("/api/remedios", { cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao carregar medicamentos");
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error("Resposta inválida");
    medicines = items;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* O arquivo do servidor mantém a persistência. */ }
  }
  function renderList() {
    const list = document.getElementById("medication-list");
    if (!list) return;
    list.replaceChildren(...medicines.map(createCard));
    const newId = new URLSearchParams(window.location.search).get("novo");
    if (newId) {
      const card = document.getElementById(`medication-${newId}`);
      const feedback = document.getElementById("medication-feedback");
      if (feedback && card) feedback.textContent = `${card.querySelector("h3").textContent} adicionado à sua lista.`;
      if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
  function renderDetails() {
    const details = document.getElementById("medicine-detail-fields");
    if (!details) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const medicine = medicines.find((item) => item.id === id);
    const name = document.getElementById("medicine-detail-name");
    const status = document.getElementById("medicine-detail-status");
    const deleteButton = document.getElementById("medicine-delete");
    if (!medicine) {
      name.textContent = "Remédio não encontrado";
      status.hidden = true;
      deleteButton.disabled = true;
      return;
    }
    name.textContent = medicine.name;
    status.textContent = medicine.status || "CADASTRADO";
    status.className = `medication-status${medicine.sample ? "" : " medication-status-new"}`;
    const values = [
      ["Dosagem", medicine.dosage],
      ["Horário", medicine.time],
      ["Orientação", medicine.instructions || "Não informada"],
      ["Período de uso", medicine.durationLabel || "Não informado"],
      ["Data de início", formatDate(medicine.startDate)],
      ...(medicine.endDate ? [["Data final", formatDate(medicine.endDate)]] : [])
    ];
    details.replaceChildren(...values.map(([label, value]) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      return row;
    }));
  }
  async function initializeList() {
    try { await loadMedicines(); }
    catch {
      try { medicines = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || fallbackMedicines; }
      catch { medicines = fallbackMedicines; }
    }
    renderList();
    renderDetails();
  }

  const initialLoad = initializeList();
  const form = document.getElementById("remedy-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      await initialLoad;
      const data = new FormData(form);
      const period = periods[data.get("duration")];
      if (!period) return;
      const today = new Date();
      let endDate = null;
      if (period.weeks) {
        const end = new Date(today);
        end.setDate(end.getDate() + period.weeks * 7);
        endDate = localDate(end);
      } else if (period.months) endDate = localDate(addCalendarMonths(today, period.months));
      const medicine = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(data.get("name")).trim(),
        dosage: String(data.get("dosage")).trim(),
        time: String(data.get("time")),
        instructions: String(data.get("instructions")).trim(),
        duration: String(data.get("duration")),
        durationLabel: period.label,
        startDate: localDate(today),
        endDate,
        sample: false,
        status: "CADASTRADO"
      };
      const message = document.getElementById("remedy-form-message");
      try {
        const response = await fetch("/api/remedios", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([...medicines, medicine])
        });
        if (!response.ok) throw new Error("Falha ao persistir medicamento");
        medicines = await response.json();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines)); } catch { /* Persistência feita no JSON do servidor. */ }
      } catch {
        if (message) {
          message.classList.remove("visually-hidden");
          message.textContent = "Não foi possível salvar no arquivo do projeto. Confira se o servidor está ativo e tente novamente.";
        }
        return;
      }
      window.location.href = `/pages/meus-remedios.html?novo=${encodeURIComponent(medicine.id)}`;
    });
  }

  const deleteButton = document.getElementById("medicine-delete");
  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      await initialLoad;
      const id = new URLSearchParams(window.location.search).get("id");
      const message = document.getElementById("medicine-detail-message");
      if (!id || !medicines.some((item) => item.id === id)) {
        if (message) message.textContent = "Não foi possível identificar esse remédio.";
        return;
      }
      const updated = medicines.filter((item) => item.id !== id);
      deleteButton.disabled = true;
      try {
        const response = await fetch("/api/remedios", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
        if (!response.ok) throw new Error("Falha ao excluir remédio");
        medicines = await response.json();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines)); } catch { /* Persistência feita no JSON do servidor. */ }
        window.location.href = "/pages/meus-remedios.html?excluido=1";
      } catch {
        deleteButton.disabled = false;
        if (message) message.textContent = "Não foi possível excluir no arquivo do projeto. Confira se o servidor está ativo e tente novamente.";
      }
    });
  }
})();
