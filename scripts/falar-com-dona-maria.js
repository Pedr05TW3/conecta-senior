(() => {
  const button = document.getElementById("start-call");
  if (!button) return;
  button.addEventListener("click", () => {
      const caregiverContext = window.location.pathname.toLowerCase().startsWith("/pages/cuidador/");
      window.location.href = caregiverContext
        ? "/pages/cuidador/ligacao-dona-maria.html"
        : "/pages/ligacao-dona-maria.html";
  });
})();
