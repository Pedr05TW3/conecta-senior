(() => {
  "use strict";
  const STORAGE_KEY = "conecta-senior.consultas.v1";
  let appointments = [];
  async function loadAppointments() {
    const response = await fetch("/api/consultas", { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível carregar as consultas.");
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error("Resposta inválida do servidor.");
    appointments = items;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* O arquivo do servidor continua sendo a fonte persistente. */ }
    return items;
  }
  function dateLabel(date) {
    const parsed = new Date(`${date}T12:00:00`);
    const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(parsed);
    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(parsed).replace(".", "").toUpperCase();
    return `${day} ${month}`;
  }
  function createAppointmentCard(item) {
    const card = document.createElement("a");
    card.className = "appointment-card";
    card.href = `/pages/editar-consulta.html?id=${encodeURIComponent(item.id)}`;
    card.setAttribute("aria-label", `Editar consulta: ${item.specialty}, ${item.date}, ${item.time}`);
    const date = document.createElement("time");
    date.className = "appointment-date-badge";
    date.dateTime = item.date;
    date.textContent = dateLabel(item.date);
    const details = document.createElement("div");
    details.className = "appointment-details";
    const title = document.createElement("strong");
    title.textContent = item.specialty;
    const meta = document.createElement("p");
    meta.textContent = `${item.time} · ${item.location}`;
    details.append(title, meta);
    card.append(date, details);
    return card;
  }
  function renderAppointments(list) {
    if (!list) return;
    list.replaceChildren(...appointments.map(createAppointmentCard));
    const newId = new URLSearchParams(window.location.search).get("nova") || new URLSearchParams(window.location.search).get("atualizada");
    const newCard = newId && [...list.children].find((card) => card.href.includes(encodeURIComponent(newId)));
    if (newCard) newCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  const list = document.getElementById("appointment-list");
  const form = document.getElementById("appointment-form");
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const fields = form ? {
    specialty: form.elements.namedItem("specialty"),
    date: form.elements.namedItem("date"),
    time: form.elements.namedItem("time"),
    location: form.elements.namedItem("location")
  } : null;

  function updateMap() {
    const map = document.getElementById("appointment-map");
    if (!map) return;
    const query = fields.location.value.trim();
    map.src = `https://maps.google.com/maps?q=${encodeURIComponent(query || "Brasil")}&output=embed`;
    map.title = query ? `Mapa do endereço: ${query}` : "Mapa do endereço da consulta";
  }

  async function initialize() {
    try { await loadAppointments(); }
    catch {
      try { appointments = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { appointments = []; }
    }
    renderAppointments(list);
    if (!form) return;
    const appointment = appointments.find((item) => item.id === editId);
    if (appointment) Object.entries(fields).forEach(([key, field]) => { field.value = appointment[key] || ""; });
    fields.location.addEventListener("input", updateMap);
    updateMap();
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const previous = appointments.find((item) => item.id === editId);
      const appointment = {
        id: editId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        specialty: fields.specialty.value.trim(),
        date: fields.date.value,
        time: fields.time.value,
        location: fields.location.value.trim()
      };
      const next = [...appointments];
      const index = next.findIndex((item) => item.id === appointment.id);
      if (index >= 0) next[index] = appointment;
      else next.push(appointment);
      const message = document.getElementById("appointment-form-message");
      try {
        const response = await fetch("/api/consultas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next)
        });
        if (!response.ok) throw new Error("Erro ao salvar.");
        appointments = await response.json();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments)); } catch { /* Persistência garantida pelo servidor. */ }
      } catch {
        if (message) { message.classList.remove("visually-hidden"); message.textContent = "Não foi possível salvar no servidor. Confira se o projeto está aberto pelo npm start e tente novamente."; }
        return;
      }
      window.location.href = `/pages/agenda-consultas.html?${previous ? "atualizada" : "nova"}=${encodeURIComponent(appointment.id)}`;
    });
  }
  const deleteButton = document.getElementById("appointment-delete");
  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      await initialized;
      const message = document.getElementById("appointment-form-message");
      if (!editId) {
        if (message) { message.classList.remove("visually-hidden"); message.textContent = "Não foi possível identificar a consulta para excluir."; }
        return;
      }
      deleteButton.disabled = true;
      try {
        const currentResponse = await fetch("/api/consultas", { cache: "no-store" });
        if (!currentResponse.ok) throw new Error("Falha ao carregar consultas.");
        const current = await currentResponse.json();
        if (!Array.isArray(current) || !current.some((item) => item.id === editId)) {
          if (message) { message.classList.remove("visually-hidden"); message.textContent = "Esta consulta não foi encontrada no arquivo."; }
          deleteButton.disabled = false;
          return;
        }
        const remaining = current.filter((item) => item.id !== editId);
        const response = await fetch("/api/consultas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(remaining)
        });
        if (!response.ok) throw new Error("Falha ao excluir consulta.");
        appointments = await response.json();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments)); } catch { /* Persistência garantida no arquivo do servidor. */ }
        window.location.href = `/pages/agenda-consultas.html?excluida=${encodeURIComponent(editId)}`;
      } catch {
        deleteButton.disabled = false;
        if (message) { message.classList.remove("visually-hidden"); message.textContent = "Não foi possível excluir a consulta do arquivo. Confira se o servidor está ativo e tente novamente."; }
      }
    });
  }
  const initialized = initialize();
})();
