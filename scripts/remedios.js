(() => {
  "use strict";

  const STORAGE_KEY = "conecta-senior.remedios.v1";
  const DEFAULT_MEDICINES = [
    { id: "sample-losartana", name: "Losartana", dosage: "50 mg · 1 comprimido", time: "09:00", instructions: "Após o café", durationLabel: "Uso contínuo", endDate: null, sample: true, status: "TOMADO" },
    { id: "sample-metformina", name: "Metformina", dosage: "850 mg · 1 comprimido", time: "19:00", instructions: "Após o jantar", durationLabel: "Uso contínuo", endDate: null, sample: true, status: "PENDENTE" }
  ];
  const periods = {
    "1-week": { label: "1 semana", weeks: 1 },
    "2-weeks": { label: "2 semanas", weeks: 2 },
    "1-month": { label: "1 mês", months: 1 },
    "3-months": { label: "3 meses", months: 3 },
    "6-months": { label: "6 meses", months: 6 },
    continuous: { label: "Uso contínuo" }
  };

  function getSavedMedicines() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function addCalendarMonths(date, months) {
    const result = new Date(date);
    const day = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
    return result;
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${dateString}T12:00:00`));
  }

  function createCard(medicine) {
    const card = document.createElement("article");
    card.className = "medication-card";
    card.id = `medication-${medicine.id}`;

    const heading = document.createElement("div");
    heading.className = "medication-card-heading";
    const name = document.createElement("h2");
    name.textContent = medicine.name;
    const status = document.createElement("span");
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
    period.textContent = medicine.durationLabel === "Uso contínuo"
      ? "Uso contínuo"
      : `${medicine.durationLabel}${medicine.endDate ? ` · até ${formatDate(medicine.endDate)}` : ""}`;
    card.append(heading, dosage, schedule, period);
    return card;
  }

  function renderList() {
    const list = document.getElementById("medication-list");
    if (!list) return;
    const medicines = [...DEFAULT_MEDICINES, ...getSavedMedicines()];
    list.replaceChildren(...medicines.map(createCard));

    const newId = new URLSearchParams(window.location.search).get("novo");
    if (newId) {
      const addedCard = document.getElementById(`medication-${newId}`);
      if (addedCard) {
        addedCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
        const feedback = document.getElementById("medication-feedback");
        if (feedback) feedback.textContent = `${addedCard.querySelector("h2").textContent} adicionado à sua lista.`;
      }
    }
  }

  function setupForm() {
    const form = document.getElementById("remedy-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const selectedPeriod = periods[data.get("duration")];
      if (!selectedPeriod) return;

      const start = new Date();
      let endDate = null;
      if (selectedPeriod.weeks) {
        start.setDate(start.getDate() + selectedPeriod.weeks * 7);
        endDate = start.toISOString().slice(0, 10);
      } else if (selectedPeriod.months) {
        endDate = addCalendarMonths(start, selectedPeriod.months).toISOString().slice(0, 10);
      }

      const medicine = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(data.get("name")).trim(),
        dosage: String(data.get("dosage")).trim(),
        time: String(data.get("time")),
        instructions: String(data.get("instructions")).trim(),
        duration: String(data.get("duration")),
        durationLabel: selectedPeriod.label,
        startDate: new Date().toISOString().slice(0, 10),
        endDate
      };

      try {
        const saved = getSavedMedicines();
        saved.push(medicine);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {
        const message = document.getElementById("remedy-form-message");
        if (message) {
          message.classList.remove("visually-hidden");
          message.textContent = "Não foi possível salvar neste navegador. Tente novamente.";
        }
        return;
      }
      window.location.href = `/pages/meus-remedios.html?novo=${encodeURIComponent(medicine.id)}`;
    });
  }

  setupForm();
  renderList();
})();
