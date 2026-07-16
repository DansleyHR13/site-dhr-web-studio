const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-form]");
const whatsappLinks = document.querySelectorAll("[data-whatsapp]");

const whatsappBase = "https://wa.me/5531994452814";
const defaultMessage = "Olá, Cassandra Personalizados! Gostaria de solicitar um orçamento.";

whatsappLinks.forEach((link) => {
  link.href = `${whatsappBase}?text=${encodeURIComponent(defaultMessage)}`;
});

menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const lines = [
    "Olá, Cassandra Personalizados! Gostaria de solicitar um orçamento.",
    "",
    `Nome: ${data.get("nome") || ""}`,
    `Telefone: ${data.get("telefone") || ""}`,
    `Tipo de personalizado: ${data.get("tipo") || ""}`,
    `Data do evento: ${data.get("data") || ""}`,
    `Mensagem: ${data.get("mensagem") || ""}`
  ];

  window.open(`${whatsappBase}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
});
