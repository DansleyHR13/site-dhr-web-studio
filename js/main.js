(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const projects = Array.isArray(window.DHR_PROJECTS) ? window.DHR_PROJECTS : [];
  const contact = window.DHR_CONTACT || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = $("[data-header]");
  const menuToggle = $("[data-menu-toggle]");
  const nav = $("[data-nav]");
  const projectsGrid = $("[data-projects]");
  const filters = $("[data-filters]");
  const modal = $("[data-modal]");
  const iframe = $("[data-project-frame]");
  const iframeShell = $("[data-iframe-shell]");
  const loader = $("[data-loader]");
  const embedError = $("[data-embed-error]");
  let activeProject = null;
  let lastFocused = null;
  let loadTimer = null;

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  const renderProjects = (filter = "Todos") => {
    const visible = filter === "Todos" ? projects : projects.filter((project) => project.category === filter);
    projectsGrid.innerHTML = visible.map((project, index) => `
      <article class="project-card reveal visible" style="--delay:${index * 70}ms">
        <button class="project-visual project-${escapeHtml(project.accent)}" type="button" data-preview="${escapeHtml(project.id)}" aria-label="Visualizar ${escapeHtml(project.title)}">
          <img src="${escapeHtml(project.thumbnail)}" alt="Capa do projeto ${escapeHtml(project.title)}" loading="lazy">
          <span class="project-overlay"><i>↗</i> Visualizar projeto</span>
        </button>
        <div class="project-info">
          <div class="project-number">0${index + 1}</div>
          <div>
            <span class="project-category">${escapeHtml(project.categoryLabel)}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
            <div class="tech-list">${project.technologies.map((tech) => `<span>${escapeHtml(tech)}</span>`).join("")}</div>
            <div class="project-actions">
              <button type="button" data-preview="${escapeHtml(project.id)}">Visualizar projeto <b>↗</b></button>
              <a href="${escapeHtml(project.url)}" target="_blank" rel="noopener">Abrir em nova aba</a>
            </div>
          </div>
        </div>
      </article>`).join("");
  };

  const renderFilters = () => {
    const categories = ["Todos", ...new Set(projects.map((project) => project.category))];
    filters.innerHTML = categories.map((category, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-filter="${escapeHtml(category)}" aria-pressed="${index === 0}">${escapeHtml(category)}</button>`).join("");
  };

  const closeMenu = () => {
    nav.classList.remove("open");
    header.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  };

  const setDevice = (device) => {
    iframeShell.className = `iframe-shell ${device}`;
    $$("[data-device]").forEach((button) => {
      const active = button.dataset.device === device;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const finishLoading = () => {
    window.clearTimeout(loadTimer);
    loader.classList.add("hidden");
    iframeShell.classList.add("loaded");
  };

  const openProject = (project) => {
    if (!project) return;
    activeProject = project;
    lastFocused = document.activeElement;
    $("[data-modal-title]").textContent = project.title;
    $("[data-modal-url]").textContent = project.url;
    $("[data-open-project]").href = project.url;
    $("[data-error-open]").href = project.url;
    embedError.hidden = true;
    loader.classList.remove("hidden");
    iframeShell.classList.remove("loaded");
    setDevice(window.innerWidth < 600 ? "mobile" : "desktop");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    iframe.src = project.url;
    loadTimer = window.setTimeout(() => {
      if (!iframeShell.classList.contains("loaded")) {
        loader.classList.add("hidden");
        embedError.hidden = false;
      }
    }, 12000);
    $("[data-modal-close].modal-close").focus();
  };

  const closeProject = () => {
    if (!modal.classList.contains("open")) return;
    window.clearTimeout(loadTimer);
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    iframe.src = "about:blank";
    iframeShell.classList.remove("loaded");
    activeProject = null;
    if (lastFocused) lastFocused.focus();
  };

  const consentCookieName = "dhr_cookie_consent";
  const cookieBanner = $("[data-cookie-banner]");
  const cookieModal = $("[data-cookie-modal]");
  const analyticsConsent = $("[data-consent-analytics]");
  const marketingConsent = $("[data-consent-marketing]");
  let cookieLastFocused = null;

  const readConsent = () => {
    const item = document.cookie.split("; ").find((entry) => entry.startsWith(`${consentCookieName}=`));
    if (!item) return null;
    try {
      const value = JSON.parse(decodeURIComponent(item.slice(consentCookieName.length + 1)));
      return value?.version === 1 ? value : null;
    } catch { return null; }
  };

  const publishConsent = (preferences) => {
    window.DHR_COOKIE_CONSENT = preferences;
    window.dispatchEvent(new CustomEvent("dhr:cookie-consent", { detail: preferences }));
  };

  const writeConsent = ({ analytics, marketing }) => {
    const preferences = { version: 1, necessary: true, analytics: Boolean(analytics), marketing: Boolean(marketing), savedAt: new Date().toISOString() };
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${consentCookieName}=${encodeURIComponent(JSON.stringify(preferences))}; Max-Age=15552000; Path=/; SameSite=Lax${secure}`;
    publishConsent(preferences);
    return preferences;
  };

  const hideCookieBanner = () => {
    cookieBanner.classList.remove("show");
    window.setTimeout(() => { cookieBanner.hidden = true; }, reducedMotion ? 0 : 300);
  };

  const openCookieSettings = () => {
    const current = readConsent();
    analyticsConsent.checked = Boolean(current?.analytics);
    marketingConsent.checked = Boolean(current?.marketing);
    cookieLastFocused = document.activeElement;
    cookieModal.classList.add("open");
    cookieModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    $("[data-cookie-save]", cookieModal).focus();
  };

  const closeCookieSettings = () => {
    if (!cookieModal.classList.contains("open")) return;
    cookieModal.classList.remove("open");
    cookieModal.setAttribute("aria-hidden", "true");
    if (!modal.classList.contains("open")) document.body.classList.remove("modal-open");
    cookieLastFocused?.focus();
  };

  const saveCookieConsent = (analytics, marketing) => {
    writeConsent({ analytics, marketing });
    hideCookieBanner();
    closeCookieSettings();
  };

  $$('[data-cookie-settings]').forEach((button) => button.addEventListener("click", openCookieSettings));
  $$('[data-cookie-accept]').forEach((button) => button.addEventListener("click", () => saveCookieConsent(true, true)));
  $$('[data-cookie-reject]').forEach((button) => button.addEventListener("click", () => saveCookieConsent(false, false)));
  $$('[data-cookie-close]').forEach((button) => button.addEventListener("click", closeCookieSettings));
  $("[data-cookie-save]").addEventListener("click", () => saveCookieConsent(analyticsConsent.checked, marketingConsent.checked));

  const storedConsent = readConsent();
  if (storedConsent) {
    publishConsent(storedConsent);
  } else {
    cookieBanner.hidden = false;
    requestAnimationFrame(() => cookieBanner.classList.add("show"));
  }

  const setupContactLinks = () => {
    const values = {
      whatsapp: contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "",
      email: contact.email ? `mailto:${contact.email}` : "",
      behance: contact.behance || ""
    };
    const labels = {
      whatsapp: contact.whatsappLabel || contact.whatsapp || "Contato a configurar",
      email: contact.email || "E-mail a configurar",
      behance: contact.behanceLabel || "Behance a configurar"
    };
    Object.keys(values).forEach((type) => {
      $$(`[data-contact-link="${type}"]`).forEach((link) => {
        link.href = values[type] || "#contato";
        if (values[type] && type !== "email") { link.target = "_blank"; link.rel = "noopener"; }
        if (!values[type]) link.dataset.unconfigured = "true";
      });
      $$(`[data-contact-label="${type}"]`).forEach((label) => { label.textContent = labels[type]; });
    });
  };

  const validateField = (field) => {
    const error = $(".field-error", field.closest("label"));
    const value = field.value.trim();
    let message = "";
    if (field.required && !value) message = "Preencha este campo.";
    else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Digite um e-mail válido.";
    else if (field.name === "phone" && value.replace(/\D/g, "").length < 10) message = "Digite um WhatsApp com DDD.";
    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) error.textContent = message;
    return !message;
  };

  renderFilters();
  renderProjects();
  setupContactLinks();
  $("[data-year]").textContent = new Date().getFullYear();

  [".feature-grid article", ".service-card", ".process-step"].forEach((selector) => {
    $$(selector).forEach((element, index) => {
      element.classList.add("reveal", "reveal-scale");
      element.style.setProperty("--delay", `${Math.min(index * 85, 300)}ms`);
    });
  });
  $$(".project-card").forEach((card, index) => card.classList.add(index % 2 ? "reveal-right" : "reveal-left"));

  let scrollTicking = false;
  const updateScrollEffects = () => {
    const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    document.documentElement.style.setProperty("--scroll-progress", String(Math.min(window.scrollY / scrollRange, 1)));
    header.classList.toggle("scrolled", window.scrollY > 24);
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateScrollEffects); }
  }, { passive: true });
  updateScrollEffects();
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  $$("a", nav).forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("open") && !nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    $$("button", filters).forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-pressed", "false"); });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    renderProjects(button.dataset.filter);
  });

  projectsGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-preview]");
    if (trigger) openProject(projects.find((project) => project.id === trigger.dataset.preview));
  });
  $$('[data-modal-close]').forEach((button) => button.addEventListener("click", closeProject));
  $$("[data-device]").forEach((button) => button.addEventListener("click", () => setDevice(button.dataset.device)));
  iframe.addEventListener("load", finishLoading);
  $("[data-refresh]").addEventListener("click", () => {
    if (!activeProject) return;
    loader.classList.remove("hidden");
    iframeShell.classList.remove("loaded");
    iframe.src = "about:blank";
    requestAnimationFrame(() => { iframe.src = activeProject.url; });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeProject(); closeMenu(); closeCookieSettings(); }
    if (event.key === "Tab" && modal.classList.contains("open")) {
      const focusable = $$('button:not([disabled]), a[href], iframe', modal).filter((element) => !element.hidden);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const form = $("[data-contact-form]");
  $$('[data-plan]').forEach((button) => button.addEventListener("click", () => {
    const projectType = $("[name='projectType']", form);
    const message = $("[name='message']", form);
    projectType.value = button.dataset.planType || "";
    const planMessage = `Tenho interesse no plano ${button.dataset.plan}. Gostaria de receber mais detalhes para o meu projeto.`;
    if (!message.value.trim()) message.value = planMessage;
    else if (!message.value.includes(button.dataset.plan)) message.value = `${message.value.trim()}\n\n${planMessage}`;
    projectType.dispatchEvent(new Event("change", { bubbles: true }));
    window.setTimeout(() => message.focus({ preventScroll: true }), reducedMotion ? 0 : 450);
  }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = $(".form-status", form);
    if (form.elements.website.value) return;
    const fields = $$('input:not([name="website"]), select, textarea', form);
    if (!fields.map(validateField).every(Boolean)) {
      status.textContent = "Revise os campos destacados.";
      status.className = "form-status error";
      $("[aria-invalid='true']", form)?.focus();
      return;
    }
    const lastSubmit = Number(sessionStorage.getItem("dhr-last-submit") || 0);
    if (Date.now() - lastSubmit < 8000) {
      status.textContent = "Aguarde alguns segundos antes de enviar novamente.";
      status.className = "form-status error";
      return;
    }
    sessionStorage.setItem("dhr-last-submit", String(Date.now()));
    const submit = $(".form-submit", form);
    submit.classList.add("loading");
    submit.disabled = true;
    window.setTimeout(() => {
      const data = new FormData(form);
      const message = `Olá, DHR Web Studio!%0A%0AMeu nome é ${encodeURIComponent(data.get("name"))}.%0AEmpresa: ${encodeURIComponent(data.get("company") || "Não informada")}%0AE-mail: ${encodeURIComponent(data.get("email"))}%0AWhatsApp: ${encodeURIComponent(data.get("phone"))}%0ATipo de projeto: ${encodeURIComponent(data.get("projectType"))}%0A%0A${encodeURIComponent(data.get("message"))}`;
      if (contact.whatsapp) {
        window.open(`https://wa.me/${contact.whatsapp}?text=${message}`, "_blank", "noopener");
        status.textContent = "Mensagem preparada. Continue o envio no WhatsApp.";
        status.className = "form-status success";
      } else {
        status.textContent = "Formulário validado. Para enviar pelo WhatsApp, configure o número em js/config.js.";
        status.className = "form-status notice";
      }
      submit.classList.remove("loading");
      submit.disabled = false;
    }, 600);
  });
  $$('input, select, textarea', form).forEach((field) => field.addEventListener("blur", () => validateField(field)));

  $$('[data-unconfigured="true"]').forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    $("[name='name']", form)?.focus();
    form.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  }));

  if (!reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((element) => observer.observe(element));
    const light = $(".cursor-light");
    window.addEventListener("pointermove", (event) => {
      light.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    }, { passive: true });
    const heroVisual = $(".hero-visual");
    if (heroVisual && window.matchMedia("(pointer: fine)").matches) {
      heroVisual.addEventListener("pointermove", (event) => {
        const rect = heroVisual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        heroVisual.style.setProperty("--tilt-x", `${(-y * 3).toFixed(2)}deg`);
        heroVisual.style.setProperty("--tilt-y", `${(x * 4).toFixed(2)}deg`);
      }, { passive: true });
      heroVisual.addEventListener("pointerleave", () => {
        heroVisual.style.setProperty("--tilt-x", "0deg");
        heroVisual.style.setProperty("--tilt-y", "0deg");
      });
    }
  } else {
    $$(".reveal").forEach((element) => element.classList.add("visible"));
  }
})();
